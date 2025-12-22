import { db } from '../firebase'
import { collection, doc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore'

/**
 * Registra una compra, actualiza stock y costo promedio de productos.
 * @param {Object} purchaseData - Datos de la compra
 * @param {string} purchaseData.tenantId
 * @param {string} purchaseData.providerId
 * @param {string} purchaseData.providerName
 * @param {Array} purchaseData.items - [{ productId, quantity, cost }]
 * @param {number} purchaseData.total
 * @param {string} purchaseData.description
 * @param {string} purchaseData.createdBy
 */
export const createPurchase = async (purchaseData) => {
    try {
        await runTransaction(db, async (transaction) => {
            const { tenantId, items } = purchaseData

            // 1. Leer todos los productos involucrados para obtener stock actual
            const productReads = []
            for (const item of items) {
                const productRef = doc(db, 'products', item.productId)
                productReads.push({ ref: productRef, ...item })
            }

            const productSnapshots = await Promise.all(
                productReads.map(p => transaction.get(p.ref))
            )

            // 2. Calcular actualizaciones
            productSnapshots.forEach((snap, index) => {
                if (!snap.exists()) throw new Error(`Producto no encontrado: ${productReads[index].productId}`)

                const currentData = snap.data()
                const purchaseItem = items[index]

                const currentStock = Number(currentData.stock) || 0
                const currentCost = Number(currentData.costPrice) || 0
                const purchaseQty = Number(purchaseItem.quantity)
                const purchaseCost = Number(purchaseItem.cost)

                // Cálculo de Nuevo Stock
                const newStock = currentStock + purchaseQty

                // Cálculo de Costo Promedio Ponderado
                // Fórmula: ((StockActual * CostoActual) + (CantCompra * CostoCompra)) / NuevoStock
                let newAverageCost = currentCost
                if (newStock > 0) {
                    newAverageCost = ((currentStock * currentCost) + (purchaseQty * purchaseCost)) / newStock
                }

                // Actualizar Producto
                transaction.update(snap.ref, {
                    stock: newStock,
                    costPrice: newAverageCost,
                    updatedAt: serverTimestamp()
                })
            })

            // 3. Guardar la Compra
            const purchaseRef = doc(collection(db, 'purchases'))
            transaction.set(purchaseRef, {
                ...purchaseData,
                createdAt: serverTimestamp()
            })

            // 4. Registrar Movimientos de Stock (Auditoría)
            for (const item of items) {
                const movementRef = doc(collection(db, 'stock_movements'))
                transaction.set(movementRef, {
                    tenantId: tenantId,
                    productId: item.productId,
                    productName: item.productName || 'Producto',
                    type: 'in', // Entrada
                    reason: 'purchase',
                    quantity: Number(item.quantity),
                    referenceId: purchaseRef.id, // ID de la compra
                    createdAt: serverTimestamp(),
                    createdBy: purchaseData.createdBy
                })
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Error creating purchase:', error)
        throw error // Re-throw para manejar en la UI
    }
}
