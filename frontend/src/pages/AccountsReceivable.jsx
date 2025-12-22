import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '32px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  header: { marginBottom: '24px' },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' },
  statCard: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' },
  statValue: { color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '4px' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
  badge: { display: 'inline-flex', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  badgeWarning: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  badgeSuccess: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
}

export default function AccountsReceivable() {
  const { user, userData } = useOutletContext() || {}
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return
    const unsub = onSnapshot(query(collection(db, 'sales'), where('tenantId', '==', tenantId), where('paymentMethod', '==', 'credito')), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setSales(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const formatDate = (ts) => { if (!ts) return '-'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('es-BO') }
  const pendingSales = sales.filter(s => s.status !== 'canceled' && (!s.paidAmount || s.paidAmount < s.amount))
  const totalPending = pendingSales.reduce((sum, s) => sum + (s.amount || 0) - (s.paidAmount || 0), 0)
  const totalReceived = sales.filter(s => s.status !== 'canceled').reduce((sum, s) => sum + (s.paidAmount || 0), 0)

  if (!user || !tenantId) return <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', color: 'white' }}><div style={{ fontSize: '48px' }}>🔒</div><p>Inicia sesión.</p></div></div>

  return (
    <div style={styles.container}>
      <div style={styles.header}><h1 style={styles.title}>💳 Cuentas por Cobrar</h1><p style={styles.subtitle}>Ventas a crédito pendientes</p></div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))' }}>⏳</div>
          <div style={{ ...styles.statValue, color: '#f59e0b' }}>{formatCurrency(totalPending)}</div>
          <div style={styles.statLabel}>Pendiente</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' }}>✅</div>
          <div style={{ ...styles.statValue, color: '#10b981' }}>{formatCurrency(totalReceived)}</div>
          <div style={styles.statLabel}>Cobrado</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))' }}>📋</div>
          <div style={styles.statValue}>{pendingSales.length}</div>
          <div style={styles.statLabel}>Créditos activos</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📋</span> Ventas a Crédito</div></div>
        {loading ? <div style={styles.emptyState}>⏳ Cargando...</div> : pendingSales.length === 0 ? <div style={styles.emptyState}><div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div><p>Sin cuentas pendientes</p></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Cliente</th><th style={styles.th}>Total</th><th style={styles.th}>Pagado</th><th style={styles.th}>Pendiente</th><th style={styles.th}>Estado</th></tr></thead>
              <tbody>
                {pendingSales.map(s => {
                  const pending = (s.amount || 0) - (s.paidAmount || 0)
                  const isPaid = pending <= 0
                  return (
                    <tr key={s.id}>
                      <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)' }}>{formatDate(s.createdAt)}</td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{s.clientName || 'Cliente'}</td>
                      <td style={styles.td}>{formatCurrency(s.amount)}</td>
                      <td style={{ ...styles.td, color: '#10b981' }}>{formatCurrency(s.paidAmount || 0)}</td>
                      <td style={{ ...styles.td, fontWeight: '700', color: '#f59e0b' }}>{formatCurrency(pending)}</td>
                      <td style={styles.td}><span style={{ ...styles.badge, ...(isPaid ? styles.badgeSuccess : styles.badgeWarning) }}>{isPaid ? 'Pagado' : 'Pendiente'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
