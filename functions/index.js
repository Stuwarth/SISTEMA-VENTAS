const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { Timestamp } = require('firebase-admin/firestore')

// Configurable threshold for auto-closing differences (in local currency units)
const DIFFERENCE_THRESHOLD = Number(process.env.DIFFERENCE_THRESHOLD || 10)

admin.initializeApp()
const db = admin.firestore()

// load auxiliary callables
try {
  require('./refundSale')
} catch (e) {
  console.warn('Could not load refundSale module:', e.message)
}

/**
 * Callable function to open a cash session atomically.
 * Input: { startBalance: number, notes: string }
 * Requirements: authenticated user with role 'owner' o 'admin', y no debe haber caja abierta.
 */
exports.openCashSession = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
    }
    const uid = context.auth.uid
    const startBalance = Number(data.startBalance || 0)
    const notes = data.notes || ''

    // Verificar rol
    const userDoc = await db.collection('users').doc(uid).get()
    const role = userDoc.exists ? userDoc.data().role : null
    const tenantId = userDoc.exists ? userDoc.data().tenantId : null
    if (!['owner', 'admin'].includes(role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions')
    }
    if (!tenantId) {
      throw new functions.https.HttpsError('invalid-argument', 'No tenantId')
    }

    // Verificar que no haya caja abierta para el tenant
    const openQ = await db.collection('cash_sessions')
      .where('tenantId', '==', tenantId)
      .where('status', '==', 'open')
      .limit(1).get()
    if (!openQ.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Ya existe una caja abierta para este negocio')
    }

    // Crear sesión de caja
    const now = Timestamp.now()
    const sessionData = {
      tenantId,
      openedBy: uid,
      openedAt: now,
      startBalance,
      closedBy: null,
      closedAt: null,
      countedCash: null,
      expectedCash: null,
      difference: null,
      status: 'open',
      notes
    }
    const ref = await db.collection('cash_sessions').add(sessionData)

    // Log de auditoría
    const auditRef = db.collection('audit_logs').doc()
    await auditRef.set({
      tenantId,
      action: 'open_cash_session',
      entity: 'cash_sessions',
      entityId: ref.id,
      after: sessionData,
      performedBy: uid,
      timestamp: now
    })

    return { id: ref.id, ...sessionData }
  } catch (err) {
    console.error('openCashSession error:', err)
    if (err instanceof functions.https.HttpsError) throw err
    throw new functions.https.HttpsError('internal', String(err.message || err))
  }
})

/**
 * approveDifference: callable function for managers/owners to approve or reject pending differences
 * Input: { pendingId: string, action: 'approve'|'reject', note?: string }
 */
exports.approveDifference = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  const uid = context.auth.uid
  const { pendingId, action, note } = data || {}
  if (!pendingId || !['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'pendingId and action are required')
  }

  // Verify caller role
  const callerSnap = await db.collection('users').doc(uid).get()
  const caller = callerSnap.exists ? callerSnap.data() : null
  if (!caller || !['owner', 'admin', 'manager'].includes(caller.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions')
  }

  const now = Timestamp.now()

  return await db.runTransaction(async (tx) => {
    const pendingRef = db.collection('pending_differences').doc(pendingId)
    const pendSnap = await tx.get(pendingRef)
    if (!pendSnap.exists) throw new functions.https.HttpsError('not-found', 'Pending difference not found')
    const pend = pendSnap.data()
    if (pend.status !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'Pending difference not pending')

    const sessionRef = db.collection('cash_sessions').doc(pend.sessionId)
    const sessionSnap = await tx.get(sessionRef)
    if (!sessionSnap.exists) throw new functions.https.HttpsError('not-found', 'Session not found')

    if (action === 'approve') {
      // create cash_movement for difference and mark pending approved and session closed
      const movement = {
        tenantId: pend.tenantId,
        type: 'diferencia',
        amount: Number(pend.difference),
        reason: 'Aprobación de diferencia',
        referenceId: pend.sessionId,
        createdBy: uid,
        createdAt: now
      }
      const movRef = db.collection('cash_movements').doc()
      tx.set(movRef, movement)

      tx.update(pendingRef, { status: 'approved', approvedBy: uid, approvedAt: now, note: note || null })
      tx.update(sessionRef, { status: 'closed', approvedBy: uid, approvedAt: now })

      const auditRef = db.collection('audit_logs').doc()
      tx.set(auditRef, {
        tenantId: pend.tenantId,
        action: 'approve_difference',
        entity: 'pending_differences',
        entityId: pendingId,
        before: pend,
        after: { status: 'approved', approvedBy: uid, approvedAt: now },
        performedBy: uid,
        timestamp: now
      })

      return { approved: true }
    } else {
      // reject: mark pending rejected and reopen session for recount
      tx.update(pendingRef, { status: 'rejected', rejectedBy: uid, rejectedAt: now, note: note || null })
      tx.update(sessionRef, { status: 'open', closedAt: null, closedBy: null })

      const auditRef = db.collection('audit_logs').doc()
      tx.set(auditRef, {
        tenantId: pend.tenantId,
        action: 'reject_difference',
        entity: 'pending_differences',
        entityId: pendingId,
        before: pend,
        after: { status: 'rejected', rejectedBy: uid, rejectedAt: now },
        performedBy: uid,
        timestamp: now
      })

      return { approved: false }
    }
  })
})

/**
 * Callable function to close a cash session atomically.
 * Input: { sessionId: string, countedCash: number }
 * Requirements: authenticated user with role 'owner' or 'admin' in `users/{uid}`.
 */
exports.closeCashSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }
  const uid = context.auth.uid
  const sessionId = data.sessionId
  const countedCash = Number(data.countedCash || 0)

  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'sessionId is required')
  }

  // Verify role from users collection
  const userDoc = await db.collection('users').doc(uid).get()
  const role = userDoc.exists ? userDoc.data().role : null
  if (!['owner', 'admin'].includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions')
  }

  const sessionRef = db.collection('cash_sessions').doc(sessionId)
  return await db.runTransaction(async (tx) => {
    const sessSnap = await tx.get(sessionRef)
    if (!sessSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Cash session not found')
    }

    const session = sessSnap.data()
    if (session.status !== 'open') {
      throw new functions.https.HttpsError('failed-precondition', 'Session already closed')
    }

    const tenantId = session.tenantId
    const openedAt = session.openedAt
    const now = Timestamp.now()

    // Professional thresholds for alerts
    const GREEN_THRESHOLD = 5
    const YELLOW_THRESHOLD = 20
    const RED_THRESHOLD = 20

    // Sum sales and collect details in the session period (use tx.get for consistency)
    const salesQuery = db.collection('sales')
      .where('tenantId', '==', tenantId)
      .where('createdAt', '>=', openedAt)
      .where('createdAt', '<=', now)

    const salesSnap = await tx.get(salesQuery)
    let salesTotal = 0
    const salesList = []
    let canceledSales = 0
    let pendingSales = 0
    const totalsByPayment = {}
    salesSnap.forEach(s => {
      const sd = s.data()
      const sid = s.id
      // Only 'completed' sales affect financial calculations
      if (sd.status === 'canceled') {
        canceledSales += 1
        return
      }
      if (sd.status !== 'completed') {
        pendingSales += 1
        return
      }
      // accumulate totals by payment method
      const pm = sd.paymentMethod || 'efectivo'
      totalsByPayment[pm] = (totalsByPayment[pm] || 0) + Number(sd.amount || 0)
      if (pm === 'efectivo') salesTotal += Number(sd.amount || 0)

      salesList.push({
        id: sid,
        amount: Number(sd.amount || 0),
        paymentMethod: pm,
        clientId: sd.clientId || null,
        clientName: sd.clientName || null,
        createdBy: sd.createdBy || null,
        createdAt: sd.createdAt || null,
        items: Array.isArray(sd.items) ? sd.items.map(it => ({ productId: it.productId, qty: it.quantity, subtotal: it.subtotal || null })) : []
      })
    })

    // Sum cash_movements in the period and classify by types for professional close
    const movQuery = db.collection('cash_movements')
      .where('tenantId', '==', tenantId)
      .where('createdAt', '>=', openedAt)
      .where('createdAt', '<=', now)

    const movSnap = await tx.get(movQuery)
    let ingresos = 0
    let retiros = 0
    let cambioTotal = 0
    let refundsByMethod = {}
    let withdrawalsList = []
    let bankDeposits = 0
    let otherIngresos = 0
    const movList = []
    let reversedCount = 0
    movSnap.forEach(m => {
      const md = m.data()
      if (md.reversed === true) {
        reversedCount += 1
        return
      }
      const amt = Number(md.amount || 0)
      switch (md.type) {
        case 'sale':
          // sale movements include paymentMethod; only efectivo affects caja
          if (md.paymentMethod === 'efectivo') ingresos += amt
          // accumulate totalsByPayment also from sales collection, but include here for completeness
          break
        case 'deposit':
          ingresos += amt
          otherIngresos += amt
          break
        case 'withdrawal':
          retiros += amt
          withdrawalsList.push({ id: m.id, amount: amt, reason: md.reason || null })
          break
        case 'bank_deposit':
          // bank deposits remove cash from the drawer
          bankDeposits += amt
          retiros += amt
          break
        case 'change':
          cambioTotal += amt
          break
        case 'refund':
          // refunds reduce cash when paid in efectivo
          if (md.paymentMethod === 'efectivo') {
            ingresos -= amt
            refundsByMethod[md.paymentMethod || 'efectivo'] = (refundsByMethod[md.paymentMethod || 'efectivo'] || 0) + amt
          }
          break
        case 'retiro':
          retiros += amt
          break
        default:
          // fallback: treat as ingreso
          ingresos += amt
          otherIngresos += amt
      }
      movList.push({ id: m.id, type: md.type, amount: amt, reason: md.reason || null, referenceId: md.referenceId || null, paymentMethod: md.paymentMethod || null })
    })

    // Expected cash calculation:
    // - Start balance (fondo inicial)
    // - + ingresos (ventas en efectivo, depósitos)
    // - - retiros (gastos, retiros de efectivo)
    // - - bankDeposits (depósitos al banco que salen del cajón)
    // NOTA: cambioTotal ya NO se resta porque el monto de venta ya es el correcto
    // (el cambio es solo devolver el exceso que el cliente dio, no reduce el ingreso real)
    const expectedCash = Number(session.startBalance || 0) + ingresos - retiros - (typeof bankDeposits !== 'undefined' ? bankDeposits : 0)
    const difference = Number(countedCash) - expectedCash

    // Build a detailed close report object (keeps full breakdown for investigations)
    const report = {
      tenantId,
      sessionId,
      openedAt: openedAt || null,
      closedAt: now,
      countedCash,
      expectedCash,
      difference,
      sales: salesList,
      totalsByPayment,
      salesCount: salesList.length,
      canceledSales,
      pendingSales,
      cashMovements: movList,
      ingresos,
      retiros,
      cambioTotal,
      refundsByMethod,
      withdrawals: withdrawalsList,
      bankDeposits,
      reversedMovementsCount: reversedCount,
      generatedAt: now
    }

    // Simple discrepancy analysis / suggestions
    const analysis = []
    if (difference > 0) analysis.push({ type: 'sobra', message: 'Sobra de efectivo detectado' })
    if (difference < 0) analysis.push({ type: 'faltante', message: 'Faltante de efectivo detectado' })
    if (reversedCount > 0) analysis.push({ type: 'anulaciones', message: `${reversedCount} movimientos revertidos durante la sesión (revisar anulaciones)` })
    if (cambioTotal > 0) analysis.push({ type: 'cambio', message: `Se devolvieron ${cambioTotal} como cambio a clientes` })
    if (Math.abs(difference) > (DIFFERENCE_THRESHOLD * 5)) analysis.push({ type: 'alto', message: 'Diferencia muy alta — investigar inmediatamente' })
    report.analysis = analysis

    const reportRef = db.collection('cash_session_reports').doc()
    tx.set(reportRef, report)

    // If difference exceeds threshold, create a pending_differences document and mark session pending
    if (Math.abs(difference) > YELLOW_THRESHOLD) {
      tx.update(sessionRef, {
        countedCash,
        expectedCash,
        difference,
        closedAt: now,
        closedBy: uid,
        status: 'closed_pending_approval',
        reportId: reportRef.id
      })

      const pending = {
        tenantId,
        sessionId,
        countedCash,
        expectedCash,
        difference,
        createdBy: uid,
        status: 'pending',
        createdAt: now
      }
      const pendingRef = db.collection('pending_differences').doc()
      tx.set(pendingRef, pending)
      const pendingId = pendingRef.id

      // Audit log entry for pending close
      const auditRef = db.collection('audit_logs').doc()
      tx.set(auditRef, {
        tenantId,
        action: 'close_cash_session_pending',
        entity: 'cash_sessions',
        entityId: sessionId,
        before: session,
        after: {
          countedCash,
          expectedCash,
          difference,
          closedAt: now,
          closedBy: uid,
          status: 'closed_pending_approval',
          reportId: reportRef.id
        },
        performedBy: uid,
        timestamp: now
      })

      return { expectedCash, difference, pending: true, pendingId, reportId: reportRef.id }
    }

    // Update session doc (auto-close path)
    tx.update(sessionRef, {
      countedCash,
      expectedCash,
      difference,
      closedAt: now,
      closedBy: uid,
      status: 'closed',
      reportId: reportRef.id
    })

    // If difference non-zero, add a cash_movements record with type 'diferencia'
    if (Math.abs(difference) > 0.0001) {
      const diffDoc = {
        tenantId,
        type: 'diferencia',
        amount: Number(difference),
        reason: 'Cierre de caja (auto) ',
        referenceId: sessionId,
        createdBy: uid,
        createdAt: now
      }
      const diffRef = db.collection('cash_movements').doc()
      tx.set(diffRef, diffDoc)
    }

    // Audit log entry
    const auditRef = db.collection('audit_logs').doc()
    tx.set(auditRef, {
      tenantId,
      action: 'close_cash_session',
      entity: 'cash_sessions',
      entityId: sessionId,
      before: session,
      after: {
        countedCash,
        expectedCash,
        difference,
        closedAt: now,
        closedBy: uid,
        status: 'closed',
        reportId: reportRef.id
      },
      performedBy: uid,
      timestamp: now
    })

    return { expectedCash, difference, pending: false, reportId: reportRef.id }
  })
})

exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'La llamada requiere autenticación')
  }
  const callerUid = context.auth.uid
  const callerSnap = await db.doc(`users/${callerUid}`).get()
  if (!callerSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Perfil no encontrado')
  }
  const caller = callerSnap.data()
  if (!caller || !['owner', 'admin'].includes(caller.role)) {
    throw new functions.https.HttpsError('permission-denied', 'No autorizado')
  }

  const { email, password, role } = data
  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email y contraseña requeridos')
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password })
    await db.doc(`users/${userRecord.uid}`).set({
      email,
      role: role || 'vendedor',
      tenantId: caller.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return { uid: userRecord.uid }
  } catch (err) {
    console.error('createUser error', err)
    throw new functions.https.HttpsError('internal', 'Error creando usuario: ' + (err.message || err))
  }
})

/**
 * getCashSessionReport: return a cash session report document by id, validating tenant.
 * Input: { reportId: string }
 */
exports.getCashSessionReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  const uid = context.auth.uid
  const reportId = data?.reportId
  if (!reportId) throw new functions.https.HttpsError('invalid-argument', 'reportId required')

  const callerSnap = await db.collection('users').doc(uid).get()
  if (!callerSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Caller profile not found')
  const caller = callerSnap.data()
  const tenantId = caller.tenantId
  if (!tenantId) throw new functions.https.HttpsError('failed-precondition', 'No tenantId')

  const repRef = db.collection('cash_session_reports').doc(reportId)
  const repSnap = await repRef.get()
  if (!repSnap.exists) throw new functions.https.HttpsError('not-found', 'Report not found')
  const report = repSnap.data()
  if (report.tenantId !== tenantId) throw new functions.https.HttpsError('permission-denied', 'Tenant mismatch')

  return { report }
})

/**
 * payAccountsReceivable: register payment for an accounts_receivable entry
 * Input: { arId: string, amount: number, paymentMethod: string }
 */
exports.payAccountsReceivable = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  const uid = context.auth.uid
  const { arId, amount, paymentMethod } = data || {}
  if (!arId || !amount || amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'arId and positive amount required')

  const callerSnap = await db.collection('users').doc(uid).get()
  if (!callerSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Caller profile not found')
  const caller = callerSnap.data()
  const tenantId = caller.tenantId
  if (!tenantId) throw new functions.https.HttpsError('failed-precondition', 'No tenantId')

  const now = Timestamp.now()

  return await db.runTransaction(async (tx) => {
    const arRef = db.collection('accounts_receivable').doc(arId)
    const arSnap = await tx.get(arRef)
    if (!arSnap.exists) throw new functions.https.HttpsError('not-found', 'Cuenta por cobrar no encontrada')
    const ar = arSnap.data()
    if (ar.tenantId !== tenantId) throw new functions.https.HttpsError('permission-denied', 'Tenant mismatch')
    if (ar.status === 'paid') throw new functions.https.HttpsError('failed-precondition', 'Cuenta ya pagada')

    const remaining = Number(ar.balance || ar.totalAmount || 0) - Number(amount)
    const newStatus = remaining <= 0 ? 'paid' : 'pending'

    // Payment record
    const payRef = db.collection('accounts_receivable_payments').doc()
    tx.set(payRef, {
      tenantId,
      arId,
      saleId: ar.saleId || null,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'efectivo',
      createdBy: uid,
      createdAt: now
    })

    // Update AR
    tx.update(arRef, { balance: remaining, status: newStatus, updatedAt: now, lastPaymentAt: now })

    // Optionally create cash movement for efectivo
    if ((paymentMethod || 'efectivo') === 'efectivo') {
      const movRef = db.collection('cash_movements').doc()
      tx.set(movRef, {
        tenantId,
        type: 'ingreso',
        amount: Number(amount),
        reason: 'Cobro cuenta por cobrar',
        referenceId: arId,
        createdBy: uid,
        createdAt: now
      })
    }

    // Audit log
    const auditRef = db.collection('audit_logs').doc()
    tx.set(auditRef, {
      tenantId,
      action: 'pay_accounts_receivable',
      entity: 'accounts_receivable',
      entityId: arId,
      before: ar,
      after: { balance: remaining, status: newStatus },
      performedBy: uid,
      timestamp: now
    })

    return { success: true, remaining }
  })
})

/**
 * createSale: create a sale transactionally on the server.
 * Input: { sale: { clientId, clientName, items, desc, amount, paymentMethod, tenantId, createdBy, dueDate } }
 */
exports.createSale = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
    }
    const uid = context.auth.uid
    const { sale } = data || {}

    if (!sale || !sale.tenantId) {
      throw new functions.https.HttpsError('invalid-argument', 'Sale data and tenantId are required')
    }

    // Verify user belongs to tenant
    const userDoc = await db.collection('users').doc(uid).get()
    const userData = userDoc.exists ? userDoc.data() : null
    if (!userData || userData.tenantId !== sale.tenantId) {
      throw new functions.https.HttpsError('permission-denied', 'User does not belong to this tenant')
    }

    const role = userData.role || ''
    if (!['owner', 'admin', 'vendedor'].includes(role)) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create sales')
    }

    const now = Timestamp.now()
    const items = Array.isArray(sale.items) ? sale.items : []

    // Use transaction to validate stock and create sale atomically
    const result = await db.runTransaction(async (tx) => {
      // Validate stock for all items
      const productRefs = []
      const productData = []

      for (const item of items) {
        if (!item.productId) continue
        const prodRef = db.collection('products').doc(item.productId)
        const prodSnap = await tx.get(prodRef)

        if (!prodSnap.exists) {
          throw new functions.https.HttpsError('not-found', `Producto ${item.productId} no encontrado`)
        }

        const prod = prodSnap.data()
        const currentStock = Number(prod.stock || 0)
        const requestedQty = Number(item.quantity || 0)

        if (currentStock < requestedQty) {
          throw new functions.https.HttpsError('failed-precondition', `Stock insuficiente para ${prod.name || item.productId}. Disponible: ${currentStock}, Solicitado: ${requestedQty}`)
        }

        productRefs.push({ ref: prodRef, newStock: currentStock - requestedQty, productName: prod.name })
        productData.push({ ...item, productName: prod.name || item.productName })
      }

      // Create sale document
      const saleData = {
        tenantId: sale.tenantId,
        clientId: sale.clientId || null,
        clientName: sale.clientName || 'Cliente General',
        items: productData,
        desc: sale.desc || '',
        amount: Number(sale.amount || 0),
        paymentMethod: sale.paymentMethod || 'efectivo',
        createdBy: sale.createdBy || userData.email || uid,
        createdAt: now,
        status: 'completed',
        dueDate: sale.dueDate || null,
        paidAmount: sale.paidAmount || null,
        deposit: sale.deposit || null
      }

      const saleRef = db.collection('sales').doc()
      tx.set(saleRef, saleData)

      // Update stock for each product
      for (const { ref, newStock } of productRefs) {
        tx.update(ref, { stock: newStock, updatedAt: now })
      }

      // Create cash movement if payment is in cash
      // NOTA: Solo registramos el monto de la VENTA (no el cambio)
      // El cambio NO es un movimiento de caja, es simplemente devolver el exceso
      if (sale.paymentMethod === 'efectivo') {
        const movRef = db.collection('cash_movements').doc()
        tx.set(movRef, {
          tenantId: sale.tenantId,
          type: 'sale',
          amount: Number(sale.amount || 0),
          paymentMethod: 'efectivo',
          referenceId: saleRef.id,
          createdBy: sale.createdBy || userData.email || uid,
          createdAt: now
        })
        // El cambio (paidAmount - amount) es solo informativo en la venta
        // No lo registramos como movimiento porque el dinero que queda es = amount
      }

      // Audit log
      const auditRef = db.collection('audit_logs').doc()
      tx.set(auditRef, {
        tenantId: sale.tenantId,
        action: 'create_sale',
        entity: 'sales',
        entityId: saleRef.id,
        after: saleData,
        performedBy: uid,
        timestamp: now
      })

      return { id: saleRef.id, ...saleData }
    })

    return result
  } catch (err) {
    console.error('createSale error:', err)
    if (err instanceof functions.https.HttpsError) throw err
    throw new functions.https.HttpsError('internal', String(err.message || err))
  }
});

/**
 * Firestore trigger: when a product is updated, create a stock alert if stock falls to or below stockMin
 */
exports.onProductUpdateStockAlert = functions.firestore.document('products/{productId}').onUpdate(async (change, context) => {
  try {
    const before = change.before.data() || {}
    const after = change.after.data() || {}
    const productId = context.params.productId
    const tenantId = after.tenantId || before.tenantId
    if (!tenantId) return null

    const beforeStock = Number(before.stock || 0)
    const afterStock = Number(after.stock || 0)
    const stockMin = Number(after.stockMin ?? before.stockMin ?? 0)

    // Trigger only when stock decreased and crossed threshold (or is at/below threshold)
    const crossedToLow = (afterStock <= stockMin) && (beforeStock > afterStock)
    if (!crossedToLow) return null

    const now = Timestamp.now()
    const alertRef = db.collection('stock_alerts').doc()
    await alertRef.set({
      tenantId,
      productId,
      productName: after.name || before.name || '',
      previousStock: beforeStock,
      newStock: afterStock,
      stockMin,
      resolved: false,
      createdAt: now
    })

    // Audit log
    const auditRef = db.collection('audit_logs').doc()
    await auditRef.set({
      tenantId,
      action: 'stock_alert_created',
      entity: 'stock_alerts',
      entityId: alertRef.id,
      before: { previousStock: beforeStock },
      after: { newStock: afterStock, stockMin },
      performedBy: null,
      timestamp: now
    })

    return { alertId: alertRef.id }
  } catch (err) {
    console.error('onProductUpdateStockAlert error', err)
    return null
  }
})

/**
 * Callable to resolve a stock alert
 * Input: { alertId: string }
 */
exports.resolveStockAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  const uid = context.auth.uid
  const { alertId } = data || {}
  if (!alertId) throw new functions.https.HttpsError('invalid-argument', 'alertId required')

  const userSnap = await db.collection('users').doc(uid).get()
  const user = userSnap.exists ? userSnap.data() : null
  if (!user) throw new functions.https.HttpsError('permission-denied', 'User profile not found')

  const now = Timestamp.now()
  const alertRef = db.collection('stock_alerts').doc(alertId)
  const alertSnap = await alertRef.get()
  if (!alertSnap.exists) throw new functions.https.HttpsError('not-found', 'Alert not found')
  const alert = alertSnap.data()

  await alertRef.update({ resolved: true, resolvedBy: uid, resolvedAt: now })

  const auditRef = db.collection('audit_logs').doc()
  await auditRef.set({
    tenantId: alert.tenantId,
    action: 'resolve_stock_alert',
    entity: 'stock_alerts',
    entityId: alertId,
    before: alert,
    after: { resolved: true, resolvedBy: uid, resolvedAt: now },
    performedBy: uid,
    timestamp: now
  })

  return { success: true }
})

/**
 * cancelSale: callable function to annul a sale, revert stock and create audit logs.
 * Input: { saleId: string }
 * Rules: authenticated; caller must belong to the same tenant; cannot cancel if sale is inside a closed cash session
 */
exports.cancelSale = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  const uid = context.auth.uid
  const saleId = data?.saleId
  const reason = data?.reason || null
  if (!saleId) throw new functions.https.HttpsError('invalid-argument', 'saleId required')

  const callerSnap = await db.collection('users').doc(uid).get()
  if (!callerSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Caller profile not found')
  const caller = callerSnap.data()
  const tenantId = caller.tenantId
  if (!tenantId) throw new functions.https.HttpsError('failed-precondition', 'No tenantId')

  const now = Timestamp.now()

  return await db.runTransaction(async (tx) => {
    const saleRef = db.collection('sales').doc(saleId)
    const saleSnap = await tx.get(saleRef)
    if (!saleSnap.exists) throw new functions.https.HttpsError('not-found', 'Sale not found')
    const sale = saleSnap.data()
    if (sale.status === 'canceled') throw new functions.https.HttpsError('failed-precondition', 'Sale already canceled')

    // Read closed sessions using tx.get (all reads must happen before any writes)
    const sessionsQuery = db.collection('cash_sessions').where('tenantId', '==', tenantId).where('status', '==', 'closed')
    const sessionsSnap = await tx.get(sessionsQuery)
    const saleTime = sale.createdAt && sale.createdAt.toMillis ? sale.createdAt.toMillis() : (sale.createdAt ? new Date(sale.createdAt).getTime() : null)
    if (saleTime) {
      sessionsSnap.forEach(s => {
        const sess = s.data()
        const opened = sess.openedAt && sess.openedAt.toMillis ? sess.openedAt.toMillis() : (sess.openedAt ? new Date(sess.openedAt).getTime() : null)
        const closed = sess.closedAt && sess.closedAt.toMillis ? sess.closedAt.toMillis() : (sess.closedAt ? new Date(sess.closedAt).getTime() : null)
        if (opened && closed && saleTime >= opened && saleTime <= closed) {
          throw new functions.https.HttpsError('failed-precondition', 'Esta venta ya fue incluida en una caja cerrada y no puede anularse')
        }
      })
    }

    // Pre-read all product documents referenced in the sale (reads before writes)
    const productIds = Array.isArray(sale.items) ? sale.items.map(it => it.productId).filter(Boolean) : []
    const productRefs = productIds.map(id => db.collection('products').doc(id))
    const productSnaps = {}
    for (const ref of productRefs) {
      const snap = await tx.get(ref)
      productSnaps[ref.id] = snap
    }

    // Pre-read cash movements and accounts_receivable/payments referenced by this sale
    const cashQ = db.collection('cash_movements').where('tenantId', '==', tenantId).where('referenceId', '==', saleId)
    const cashSnap = await tx.get(cashQ)

    const arQ = db.collection('accounts_receivable').where('tenantId', '==', tenantId).where('saleId', '==', saleId).limit(1)
    const arSnap = await tx.get(arQ)
    let paySnap = null
    let arDoc = null
    if (!arSnap.empty) {
      arDoc = arSnap.docs[0]
      const payQ = db.collection('accounts_receivable_payments').where('tenantId', '==', tenantId).where('arId', '==', arDoc.id)
      paySnap = await tx.get(payQ)
    }

    // All reads done; perform writes: mark sale canceled, update products and stock_movements, and audit log
    tx.update(saleRef, { status: 'canceled', canceledBy: uid, canceledAt: now, canceledReason: reason })

    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (!item.productId) continue
        const prodRef = db.collection('products').doc(item.productId)
        const prodSnap = productSnaps[item.productId]
        if (prodSnap && prodSnap.exists) {
          const prod = prodSnap.data()
          const prevStock = Number(prod.stock || 0)
          const newStock = prevStock + (Number(item.quantity || 0))
          tx.update(prodRef, { stock: newStock, updatedAt: now })

          const movRef = db.collection('stock_movements').doc()
          tx.set(movRef, {
            productId: item.productId,
            productName: item.productName || prod.name || '',
            tenantId,
            delta: Number(item.quantity || 0),
            previousStock: prevStock,
            newStock,
            reason: 'Anulación de venta',
            saleId: saleId,
            createdBy: uid,
            createdAt: now
          })
        }
      }
    }

    // Audit log
    const auditRef = db.collection('audit_logs').doc()
    tx.set(auditRef, {
      tenantId,
      action: 'cancel_sale',
      entity: 'sales',
      entityId: saleId,
      before: sale,
      after: { status: 'canceled', canceledBy: uid, canceledAt: now, canceledReason: reason },
      performedBy: uid,
      note: reason || null,
      timestamp: now
    })

    // Reverse any cash movements linked to this sale (create reversal entries and mark originals)
    const mapReversalType = (t) => {
      switch (t) {
        case 'ingreso': return 'retiro'
        case 'retiro': return 'ingreso'
        case 'sale': return 'refund'
        case 'refund': return 'sale'
        case 'change': return 'ingreso'
        case 'withdrawal': return 'deposit'
        case 'deposit': return 'retiro'
        case 'bank_deposit': return 'retiro'
        default: return t
      }
    }

    for (const cmDoc of cashSnap.docs) {
      const cm = cmDoc.data()
      const cmRef = cmDoc.ref
      // skip if already reversed
      if (cm.reversed === true) continue
      const reversalType = mapReversalType(cm.type)
      const reversal = {
        tenantId,
        type: reversalType,
        amount: Number(cm.amount || 0),
        reason: 'Reversión por anulación de venta',
        referenceId: saleId,
        originalMovementId: cmRef.id,
        createdBy: uid,
        createdAt: now
      }
      const revRef = db.collection('cash_movements').doc()
      tx.set(revRef, reversal)
      tx.update(cmRef, { reversed: true, reversedAt: now, reversedBy: uid, reversalId: revRef.id })
    }

    // If there is an accounts_receivable for this sale, mark it canceled and reverse any payments
    if (!arSnap.empty) {
      const ar = arDoc.data()
      const arRef = arDoc.ref
      tx.update(arRef, { status: 'canceled', balance: 0, canceledBy: uid, canceledAt: now })

      if (paySnap && !paySnap.empty) {
        for (const pDoc of paySnap.docs) {
          const p = pDoc.data()
          const pRef = pDoc.ref
          if (p.reversed === true) continue
          // mark payment reversed
          tx.update(pRef, { reversed: true, reversedAt: now, reversedBy: uid })
          // reverse matching cash movements from the cached cashSnap
          for (const cdoc of cashSnap.docs) {
            const c = cdoc.data()
            const cref = cdoc.ref
            if (c.reversed === true) continue
            if (Number(c.amount || 0) === Number(p.amount || 0)) {
              const rev = {
                tenantId,
                type: c.type === 'ingreso' ? 'retiro' : (c.type === 'retiro' ? 'ingreso' : c.type),
                amount: Number(c.amount || 0),
                reason: 'Reversión por anulación de pago (venta anulada)',
                referenceId: saleId,
                originalMovementId: cref.id,
                createdBy: uid,
                createdAt: now
              }
              const revRef2 = db.collection('cash_movements').doc()
              tx.set(revRef2, rev)
              tx.update(cref, { reversed: true, reversedAt: now, reversedBy: uid, reversalId: revRef2.id })
            }
          }
        }
      }
    }
    return { canceled: true }
  })
})
