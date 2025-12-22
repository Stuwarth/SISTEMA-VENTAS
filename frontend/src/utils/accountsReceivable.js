import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function payAccountsReceivable({ arId, amount, paymentMethod = 'efectivo' }) {
  try {
    const fn = httpsCallable(functions, 'payAccountsReceivable')
    const res = await fn({ arId, amount: Number(amount), paymentMethod })
    return res.data
  } catch (err) {
    throw err
  }
}

export async function createAccountsReceivableClientSide({ saleId, tenantId, clientId, clientName, totalAmount, dueDate, createdBy = null }) {
  // helper to create accounts_receivable doc client-side when sale is created as crédito
  // Import Firestore dynamically to avoid circular imports
  const { db } = await import('../firebase')
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
  const docRef = await addDoc(collection(db, 'accounts_receivable'), {
    tenantId,
    saleId,
    clientId: clientId || null,
    clientName: clientName || null,
    totalAmount: Number(totalAmount || 0),
    balance: Number(totalAmount || 0),
    status: 'pending',
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdBy: createdBy || null,
    createdAt: serverTimestamp()
  })
  return { id: docRef.id }
}
