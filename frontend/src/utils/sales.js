import { httpsCallable } from 'firebase/functions'
import { functions, db } from '../firebase'
import { collection, doc, addDoc, updateDoc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore'

export async function cancelSale({ saleId, reason = null }) {
  try {
    const fn = httpsCallable(functions, 'cancelSale')
    const res = await fn({ saleId, reason })
    return res.data
  } catch (err) {
    throw err
  }
}

export async function createSale({ sale }) {
  try {
    // Try Cloud Function first
    const fn = httpsCallable(functions, 'createSale')
    const res = await fn({ sale })
    return res.data
  } catch (err) {
    console.warn('Cloud Function failed, falling back to direct Firestore:', err.message)

    // Fallback: Create sale directly in Firestore
    // This is less secure but works when Cloud Functions are not deployed
    return await createSaleDirectly(sale)
  }
}

// Fallback function that creates sale directly in Firestore
async function createSaleDirectly(sale) {
  if (!sale || !sale.tenantId) {
    throw new Error('Sale data and tenantId are required')
  }

  const items = Array.isArray(sale.items) ? sale.items : []
  const now = serverTimestamp()

  // Use transaction to update stock and create sale atomically
  return await runTransaction(db, async (transaction) => {
    // First, read all product docs and validate stock
    const productUpdates = []

    for (const item of items) {
      if (!item.productId) continue

      const prodRef = doc(db, 'products', item.productId)
      const prodSnap = await transaction.get(prodRef)

      if (!prodSnap.exists()) {
        throw new Error(`Producto ${item.productId} no encontrado`)
      }

      const prod = prodSnap.data()
      const currentStock = Number(prod.stock || 0)
      const requestedQty = Number(item.quantity || 0)

      if (currentStock < requestedQty) {
        throw new Error(`Stock insuficiente para ${prod.name}. Disponible: ${currentStock}`)
      }

      productUpdates.push({
        ref: prodRef,
        newStock: currentStock - requestedQty,
        productName: prod.name
      })
    }

    // Create the sale document
    const saleData = {
      tenantId: sale.tenantId,
      clientId: sale.clientId || null,
      clientName: sale.clientName || 'Cliente General',
      items: items.map((item, idx) => ({
        ...item,
        productName: productUpdates[idx]?.productName || item.productName
      })),
      desc: sale.desc || '',
      amount: Number(sale.amount || 0),
      paymentMethod: sale.paymentMethod || 'efectivo',
      createdBy: sale.createdBy || 'Sistema',
      createdAt: now,
      status: 'completed',
      dueDate: sale.dueDate || null,
      paidAmount: sale.paidAmount || null,
      deposit: sale.deposit || null
    }

    // Create sale
    const saleRef = doc(collection(db, 'sales'))
    transaction.set(saleRef, saleData)

    // Update stock for each product
    for (const { ref, newStock } of productUpdates) {
      transaction.update(ref, {
        stock: newStock,
        updatedAt: now
      })
    }

    // Create cash movement if payment is in cash
    if (sale.paymentMethod === 'efectivo') {
      const movRef = doc(collection(db, 'cash_movements'))
      transaction.set(movRef, {
        tenantId: sale.tenantId,
        type: 'sale',
        amount: Number(sale.amount || 0),
        paymentMethod: 'efectivo',
        referenceId: saleRef.id,
        createdBy: sale.createdBy || 'Sistema',
        createdAt: now
      })
    }

    return { id: saleRef.id, ...saleData }
  })
}
