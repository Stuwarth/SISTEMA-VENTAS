import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '24px', // Optimized padding
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    marginBottom: '24px',
  },
  greeting: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '15px',
    marginBottom: '4px',
  },
  title: {
    color: 'white',
    fontSize: '28px', // Slightly smaller for mobile safety
    fontWeight: '700',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', // RESPONSIVE GRID
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    marginBottom: '12px',
  },
  statValue: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
  },
  // RESPONSIVE FLEX LAYOUT INSTEAD OF CSS GRID
  mainLayout: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    alignItems: 'flex-start',
  },
  salesSection: {
    flex: '2 1 400px', // Grow, Shrink, Min-Width
    minWidth: '300px',
    width: '100%', // Mobile fallback
  },
  actionsSection: {
    flex: '1 1 250px',
    minWidth: '250px',
    width: '100%',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    height: '100%',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardBody: {
    padding: '20px',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '500px', // Force scroll on small screens
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '14px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 18px',
    marginBottom: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  actionBtnPrimary: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '100px',
    fontSize: '11px',
    fontWeight: '600',
  },
  badgeSuccess: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
  },
  badgeDanger: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    color: 'rgba(255,255,255,0.4)',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  tenantInfo: {
    marginTop: '24px',
    padding: '14px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
};

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userData } = useOutletContext() || {}

  const [stats, setStats] = useState({
    products: 0,
    clients: 0,
    sales: 0,
    totalRevenue: 0,
    lowStock: 0
  })
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return

    const prodQ = query(collection(db, 'products'), where('tenantId', '==', tenantId))
    const unsubProducts = onSnapshot(prodQ, snap => {
      let lowCount = 0
      snap.forEach(d => {
        const data = d.data()
        if ((data.stock ?? 0) <= (data.stockMin ?? 0)) lowCount++
      })
      setStats(prev => ({ ...prev, products: snap.size, lowStock: lowCount }))
    })

    const unsubClients = onSnapshot(
      query(collection(db, 'clients'), where('tenantId', '==', tenantId)),
      snap => setStats(prev => ({ ...prev, clients: snap.size }))
    )

    const unsubSales = onSnapshot(
      query(collection(db, 'sales'), where('tenantId', '==', tenantId)),
      snap => {
        let totalActive = 0
        let countActive = 0
        const salesArr = []
        snap.forEach(doc => {
          const data = doc.data()
          salesArr.push({ id: doc.id, ...data })
          if (data.status !== 'canceled') {
            totalActive += data.amount || 0
            countActive += 1
          }
        })
        salesArr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setRecentSales(salesArr.slice(0, 5))
        setStats(prev => ({ ...prev, sales: countActive, totalRevenue: totalActive }))
        setLoading(false)
      }
    )

    return () => { unsubProducts(); unsubClients(); unsubSales() }
  }, [tenantId])

  if (!user || !userData?.tenantId) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h2 style={{ marginBottom: '16px' }}>Acceso Requerido</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
            {!user ? 'Debes iniciar sesión para continuar.' : 'Completa el registro de tu negocio.'}
          </p>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary, padding: '14px 28px' }}
            onClick={() => navigate(user ? '/onboarding' : '/login')}
          >
            {user ? 'Completar Registro' : 'Iniciar Sesión'}
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '¡Buenos días!'
    if (hour < 18) return '¡Buenas tardes!'
    return '¡Buenas noches!'
  }

  return (
    <div style={styles.container}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* Header */}
      <div style={styles.header}>
        <p style={styles.greeting}>{getTimeGreeting()} 👋</p>
        <h1 style={styles.title}>Panel Principal</h1>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} onClick={() => navigate('/products')}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)' }}>📦</div>
          <div style={styles.statValue}>{stats.products}</div>
          <div style={styles.statLabel}>Productos</div>
        </div>

        <div style={styles.statCard} onClick={() => navigate('/clients')}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' }}>👥</div>
          <div style={styles.statValue}>{stats.clients}</div>
          <div style={styles.statLabel}>Clientes</div>
        </div>

        <div style={styles.statCard} onClick={() => navigate('/sales')}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)' }}>🛒</div>
          <div style={styles.statValue}>{stats.sales}</div>
          <div style={styles.statLabel}>Ventas</div>
        </div>

        <div style={styles.statCard} onClick={() => navigate('/products')}>
          <div style={{ ...styles.statIcon, background: stats.lowStock > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' }}>
            {stats.lowStock > 0 ? '⚠️' : '✅'}
          </div>
          <div style={{ ...styles.statValue, color: stats.lowStock > 0 ? '#ef4444' : '#10b981' }}>{stats.lowStock}</div>
          <div style={styles.statLabel}>Stock Bajo</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>💰</div>
          <div style={{ ...styles.statValue, color: '#10b981', fontSize: '22px' }}>{formatCurrency(stats.totalRevenue)}</div>
          <div style={styles.statLabel}>Ingresos</div>
        </div>
      </div>

      {/* Main Grid Converted to Flex */}
      <div style={styles.mainLayout}>
        {/* Recent Sales */}
        <div style={{ ...styles.card, ...styles.salesSection }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}><span>🛒</span> Ventas Recientes</div>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => navigate('/sales')}>Ver todas</button>
          </div>
          <div style={styles.cardBody}>
            {loading ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '32px', animation: 'pulse 1s infinite' }}>⏳</div>
                <p>Cargando...</p>
              </div>
            ) : recentSales.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                <p>Sin ventas registradas</p>
                <div style={{ marginTop: '16px' }}>
                  <button
                    style={{ ...styles.btn, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
                    onClick={() => navigate('/sales')}
                  >
                    + Nueva Venta
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>Monto</th>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map(sale => (
                      <tr key={sale.id} style={{ opacity: sale.status === 'canceled' ? 0.5 : 1 }}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '500' }}>{sale.clientName || 'Cliente General'}</div>
                        </td>
                        <td style={{ ...styles.td, fontWeight: '700', color: sale.status === 'canceled' ? '#ef4444' : '#10b981' }}>
                          {formatCurrency(sale.amount)}
                        </td>
                        <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{formatDate(sale.createdAt)}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...(sale.status === 'canceled' ? styles.badgeDanger : styles.badgeSuccess) }}>
                            {sale.status === 'canceled' ? 'Anulada' : 'Completada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ ...styles.card, ...styles.actionsSection }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}><span>⚡</span> Acciones Rápidas</div>
          </div>
          <div style={styles.cardBody}>
            <button style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }} onClick={() => navigate('/sales')}>
              <span style={{ fontSize: '20px' }}>🛒</span>
              <span>Nueva Venta</span>
            </button>
            <button style={styles.actionBtn} onClick={() => navigate('/products')}>
              <span style={{ fontSize: '20px' }}>📦</span>
              <span>Agregar Producto</span>
            </button>
            <button style={styles.actionBtn} onClick={() => navigate('/clients')}>
              <span style={{ fontSize: '20px' }}>👥</span>
              <span>Nuevo Cliente</span>
            </button>
            <button style={styles.actionBtn} onClick={() => navigate('/cashbox')}>
              <span style={{ fontSize: '20px' }}>💵</span>
              <span>Gestión de Caja</span>
            </button>
            <button style={styles.actionBtn} onClick={() => navigate('/reports')}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <span>Ver Reportes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tenant Info */}
      <div style={styles.tenantInfo}>
        <div style={{ marginBottom: '4px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>ID del Negocio</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{tenantId}</p>
        </div>
        <span style={{ ...styles.badge, ...styles.badgeSuccess }}>✅ Cuenta Activa</span>
      </div>
    </div>
  )
}
