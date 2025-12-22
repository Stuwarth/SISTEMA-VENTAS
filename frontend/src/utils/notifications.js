import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function resolveStockAlert({ alertId }) {
  try {
    const fn = httpsCallable(functions, 'resolveStockAlert')
    const res = await fn({ alertId })
    return res.data
  } catch (err) {
    throw err
  }
}
