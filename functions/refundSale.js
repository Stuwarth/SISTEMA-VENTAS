const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { Timestamp } = require('firebase-admin/firestore')

if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp()
}

const db = admin.firestore()

exports.refundSale = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  const uid = context.auth.uid
  const { saleId, amount, paymentMethod, reason } = data || {}
  if (!saleId || !amount || amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'saleId and positive amount required')

  const now = Timestamp.now()

  return await db.runTransaction(async (tx) => {
    const saleRef = db.collection('sales').doc(saleId)
    const saleSnap = await tx.get(saleRef)
    if (!saleSnap.exists) throw new functions.https.HttpsError('not-found', 'Sale not found')
    const sale = saleSnap.data()
    if (sale.status !== 'completed') throw new functions.https.HttpsError('failed-precondition', 'Only completed sales can be refunded')

    // Mark sale refunded
    tx.update(saleRef, { status: 'refunded', refundedBy: uid, refundedAt: now, refundReason: reason || null })

    // Restock items
    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (!item.productId) continue
        const prodRef = db.collection('products').doc(item.productId)
        const prodSnap = await tx.get(prodRef)
        if (prodSnap.exists) {
          const prod = prodSnap.data()
          const prevStock = Number(prod.stock || 0)
          const newStock = prevStock + Number(item.quantity || 0)
          tx.update(prodRef, { stock: newStock, updatedAt: now })
          const movRef = db.collection('stock_movements').doc()
          tx.set(movRef, {
            productId: item.productId,
            productName: item.productName || prod.name || '',
            tenantId: sale.tenantId,
            delta: Number(item.quantity || 0),
            previousStock: prevStock,
            newStock,
            reason: 'Reembolso / devolución',
            saleId: saleId,
            createdBy: uid,
            createdAt: now
          })
        }
      }
    }

    // Create refund cash movement (if refund in efectivo affects cash)
    const movRef = db.collection('cash_movements').doc()
    tx.set(movRef, {
      tenantId: sale.tenantId,
      type: 'refund',
      amount: Number(amount),
      reason: reason || 'Reembolso venta',
      referenceId: saleId,
      paymentMethod: paymentMethod || sale.paymentMethod || 'efectivo',
      createdBy: uid,
      createdAt: now
    })

    // Audit log
    const auditRef = db.collection('audit_logs').doc()
    tx.set(auditRef, {
      tenantId: sale.tenantId,
      action: 'refund_sale',
      entity: 'sales',
      entityId: saleId,
      before: sale,
      after: { status: 'refunded' },
      performedBy: uid,
      timestamp: now
    })

    return { refunded: true }
  })
})
