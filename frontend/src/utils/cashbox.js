import { collection, query, where, addDoc, getDocs, serverTimestamp, updateDoc, doc, orderBy } from 'firebase/firestore'
import { db, functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'

// Create a new cash session (apertura) - secure via Cloud Function
export async function openCashSession({ startBalance, notes }) {
  // Llama a la Cloud Function segura
  try {
    const openFn = httpsCallable(functions, 'openCashSession')
    const res = await openFn({ startBalance: Number(startBalance || 0), notes: notes || '' })
    return res.data
  } catch (err) {
    throw err
  }
}

// Get the active (open) cash session for tenant
export async function getOpenSession(tenantId) {
  const q = query(collection(db, 'cash_sessions'), where('tenantId', '==', tenantId), where('status', '==', 'open'), orderBy('openedAt', 'desc'))
  const snap = await getDocs(q)
  const arr = []
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }))
  return arr[0] || null
}

// Sum cash sales and movements for a time range (simple helper)
export async function calculateSessionTotals(tenantId, openedAt, closedAt = null) {
  const opened = openedAt && openedAt.toDate ? openedAt.toDate() : new Date(openedAt || 0)
  const closed = closedAt && closedAt.toDate ? closedAt.toDate() : new Date()

  // Sum sales paid in cash
  const salesQ = query(collection(db, 'sales'), where('tenantId', '==', tenantId))
  const salesSnap = await getDocs(salesQ)
  let salesTotal = 0
  const totalsByPayment = {}
  salesSnap.forEach(d => {
    const s = d.data()
    if (!s.createdAt) return
    const sDate = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
    if (sDate >= opened && sDate <= closed) {
      const pm = s.paymentMethod || 'efectivo'
      totalsByPayment[pm] = (totalsByPayment[pm] || 0) + Number(s.amount || 0)
      if (pm === 'efectivo') salesTotal += Number(s.amount || 0)
    }
  })

  // Sum cash_movements (ingresos, retiros)
  const movQ = query(collection(db, 'cash_movements'), where('tenantId', '==', tenantId))
  const movSnap = await getDocs(movQ)
  let ingresos = 0
  let retiros = 0
  let cambioTotal = 0
  movSnap.forEach(d => {
    const m = d.data()
    if (!m.createdAt) return
    const mDate = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt)
    if (mDate >= opened && mDate <= closed) {
      if (m.type === 'ingreso') ingresos += Number(m.amount || 0)
      if (m.type === 'retiro') retiros += Number(m.amount || 0)
      if (m.type === 'cambio') cambioTotal += Number(m.amount || 0)
    }
  })

  return { salesTotal, totalsByPayment, ingresos, retiros, cambioTotal }
}

// Close a session (client-side helper). For production, prefer Cloud Function atomic close.
export async function closeCashSession({ sessionId, countedCash }) {
  // Prefer secure server-side closure via Cloud Function
  try {
    const closeFn = httpsCallable(functions, 'closeCashSession')
    const res = await closeFn({ sessionId, countedCash: Number(countedCash || 0) })
    return res.data
  } catch (err) {
    // fallback: rethrow so caller can handle
    throw err
  }
}

export async function approveDifference({ pendingId, action, note }) {
  try {
    const approveFn = httpsCallable(functions, 'approveDifference')
    const res = await approveFn({ pendingId, action, note })
    return res.data
  } catch (err) {
    throw err
  }
}

// Fetch cash session report (secure callable)
export async function getCashSessionReport({ reportId }) {
  try {
    const getFn = httpsCallable(functions, 'getCashSessionReport')
    const res = await getFn({ reportId })
    return res.data && res.data.report ? res.data.report : null
  } catch (err) {
    throw err
  }
}
