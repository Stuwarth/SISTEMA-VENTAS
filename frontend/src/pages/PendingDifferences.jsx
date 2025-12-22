import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`

function showToast(msg, type = 'info') {
  const el = document.createElement('div')
  el.style.cssText = `position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;'}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '32px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  header: { marginBottom: '24px' },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '24px' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  cardBody: { padding: '24px' },
  diffItem: { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  diffHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  diffTitle: { color: '#f59e0b', fontWeight: '700', fontSize: '16px' },
  diffGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  diffStat: { textAlign: 'center' },
  diffLabel: { color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' },
  diffValue: { color: 'white', fontSize: '18px', fontWeight: '700' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none' },
  btnSuccess: { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' },
  btnDanger: { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
}

export default function PendingDifferences() {
  const { user, userData } = useOutletContext() || {}
  const [differences, setDifferences] = useState([])
  const [loading, setLoading] = useState(true)

  const tenantId = userData?.tenantId
  const isAdmin = userData?.role === 'owner' || userData?.role === 'admin'

  useEffect(() => {
    if (!tenantId) return
    const unsub = onSnapshot(query(collection(db, 'pending_differences'), where('tenantId', '==', tenantId), where('status', '==', 'pending')), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setDifferences(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const handleApprove = async (id) => {
    try {
      const fn = httpsCallable(functions, 'approveDifference')
      await fn({ pendingId: id, action: 'approve' })
      showToast('Diferencia aprobada', 'success')
    } catch (err) { showToast('Error: ' + err.message, 'error') }
  }

  const handleReject = async (id) => {
    try {
      const fn = httpsCallable(functions, 'approveDifference')
      await fn({ pendingId: id, action: 'reject' })
      showToast('Diferencia rechazada', 'success')
    } catch (err) { showToast('Error: ' + err.message, 'error') }
  }

  if (!user || !tenantId) return <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', color: 'white' }}><div style={{ fontSize: '48px' }}>🔒</div><p>Inicia sesión.</p></div></div>

  return (
    <div style={styles.container}>
      <div style={styles.header}><h1 style={styles.title}>⚖️ Diferencias Pendientes</h1><p style={styles.subtitle}>Cierres de caja con diferencias por aprobar</p></div>
      <div style={styles.card}>
        <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📋</span> Pendientes de Aprobación</div></div>
        <div style={styles.cardBody}>
          {loading ? <div style={styles.emptyState}>⏳ Cargando...</div> : differences.length === 0 ? (
            <div style={styles.emptyState}><div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div><p>No hay diferencias pendientes</p></div>
          ) : (
            differences.map(d => (
              <div key={d.id} style={styles.diffItem}>
                <div style={styles.diffHeader}>
                  <div style={styles.diffTitle}>⚠️ Diferencia en Cierre de Caja</div>
                </div>
                <div style={styles.diffGrid}>
                  <div style={styles.diffStat}><div style={styles.diffLabel}>Esperado</div><div style={styles.diffValue}>{formatCurrency(d.expectedCash)}</div></div>
                  <div style={styles.diffStat}><div style={styles.diffLabel}>Contado</div><div style={styles.diffValue}>{formatCurrency(d.countedCash)}</div></div>
                  <div style={styles.diffStat}><div style={styles.diffLabel}>Diferencia</div><div style={{ ...styles.diffValue, color: d.difference < 0 ? '#ef4444' : '#f59e0b' }}>{formatCurrency(d.difference)}</div></div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => handleReject(d.id)}>✕ Rechazar</button>
                    <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={() => handleApprove(d.id)}>✓ Aprobar</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
