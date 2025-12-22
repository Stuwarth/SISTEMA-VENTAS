import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

function showToast(msg, type = 'info') {
  const el = document.createElement('div')
  el.style.cssText = `position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;'}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '32px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  header: { marginBottom: '24px' },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  alertItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  alertInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  alertIcon: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  alertText: { color: 'white', fontWeight: '600', marginBottom: '4px' },
  alertMeta: { color: 'rgba(255,255,255,0.5)', fontSize: '13px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' },
  badge: { display: 'inline-flex', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
}

export default function StockAlerts() {
  const { user, userData } = useOutletContext() || {}
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return
    const unsub = onSnapshot(query(collection(db, 'stock_alerts'), where('tenantId', '==', tenantId), where('resolved', '==', false)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setAlerts(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const resolveAlert = async (id) => {
    await updateDoc(doc(db, 'stock_alerts', id), { resolved: true })
    showToast('Alerta resuelta', 'success')
  }

  if (!user || !tenantId) return <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', color: 'white' }}><div style={{ fontSize: '48px' }}>🔒</div><p>Inicia sesión.</p></div></div>

  return (
    <div style={styles.container}>
      <div style={styles.header}><h1 style={styles.title}>⚠️ Alertas de Stock</h1><p style={styles.subtitle}>Productos con stock bajo</p></div>
      <div style={styles.card}>
        <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📋</span> Alertas Activas</div><span style={styles.badge}>{alerts.length}</span></div>
        {loading ? <div style={styles.emptyState}>⏳ Cargando...</div> : alerts.length === 0 ? (
          <div style={styles.emptyState}><div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div><p>No hay alertas pendientes</p></div>
        ) : (
          alerts.map(a => (
            <div key={a.id} style={styles.alertItem}>
              <div style={styles.alertInfo}>
                <div style={styles.alertIcon}>⚠️</div>
                <div>
                  <div style={styles.alertText}>{a.productName}</div>
                  <div style={styles.alertMeta}>Stock: {a.newStock} | Mínimo: {a.stockMin}</div>
                </div>
              </div>
              <button style={styles.btn} onClick={() => resolveAlert(a.id)}>✓ Resolver</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
