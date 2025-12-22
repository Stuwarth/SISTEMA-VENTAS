import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '20px', // Responsive padding
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    margin: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    marginTop: '4px',
  },
  filtersCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '20px 24px',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    minWidth: '140px',
    cursor: 'pointer',
  },
  dateInput: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.05)',
    padding: '4px',
    borderRadius: '10px',
    flexWrap: 'wrap', // Responsive tabs
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    flex: '1 1 auto',
    textAlign: 'center',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // Responsive Grid
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginBottom: '16px',
  },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '500', marginBottom: '8px' },
  statValue: { color: 'white', fontSize: '28px', fontWeight: '700' },
  statMeta: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '8px' },

  // Layouts
  flexRow: { display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' },
  flexLarge: { flex: '2 1 400px', minWidth: '300px' },
  flexSmall: { flex: '1 1 300px', minWidth: '300px' },

  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    height: '100%',
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  cardBody: { padding: '24px' },
  chartContainer: { height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '16px' },
  chartBar: { flex: 1, background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)', borderRadius: '6px 6px 0 0', height: '100%', minHeight: '4px', position: 'relative', transition: 'all 0.3s ease' },
  chartLabel: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '8px' },
  chartValue: { position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', color: '#3b82f6', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },

  paymentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' },
  paymentCard: { padding: '16px', borderRadius: '12px', textAlign: 'center' },
  paymentLabel: { fontSize: '12px', marginBottom: '4px' },
  paymentValue: { fontSize: '18px', fontWeight: '700' },

  topProductItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  productRank: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', marginRight: '12px' },
  productName: { color: 'white', fontSize: '14px', fontWeight: '500', flex: 1 },
  productQty: { color: '#10b981', fontSize: '14px', fontWeight: '700' },
  lowStockItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' },

  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { textAlign: 'left', padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },

  btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none', transition: 'all 0.2s ease' },
  btnPrimary: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
  btnSecondary: { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' },
  pageBtn: { padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '14px', cursor: 'pointer' },
  pageBtnActive: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none' },
  emptyState: { textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.4)' },
};

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.style.cssText = `position: fixed; top: 24px; right: 24px; z-index: 9999; display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; font-family: system-ui; box-shadow: 0 10px 40px rgba(0,0,0,0.3); ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : 'background:#3b82f6;color:white;'}`;
  el.innerHTML = `${type === 'success' ? '✓' : 'ℹ'} ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export default function Reports() {
  const navigate = useNavigate()
  const { user, userData } = useOutletContext() || {}
  const containerRef = useRef()

  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('week')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return
    const unsubSales = onSnapshot(query(collection(db, 'sales'), where('tenantId', '==', tenantId)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setSales(arr)
      setLoading(false)
    })
    const unsubProducts = onSnapshot(query(collection(db, 'products'), where('tenantId', '==', tenantId)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setProducts(arr)
    })
    return () => { unsubSales(); unsubProducts() }
  }, [tenantId])

  const filterByDate = (saleDate) => {
    if (!saleDate) return false
    const date = saleDate.toDate ? saleDate.toDate() : new Date(saleDate)
    const now = new Date()
    switch (dateRange) {
      case 'today': return date.toDateString() === now.toDateString()
      case 'week': { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return date >= weekAgo }
      case 'month': { const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1); return date >= monthAgo }
      case 'custom': { if (!customStart || !customEnd) return true; const start = new Date(customStart); const end = new Date(customEnd); end.setHours(23, 59, 59, 999); return date >= start && date <= end }
      default: return true
    }
  }

  const filteredSales = sales.filter(s => s.status !== 'canceled').filter(s => filterByDate(s.createdAt)).filter(s => paymentFilter === 'all' ? true : (s.paymentMethod || 'efectivo') === paymentFilter)
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0)
  const totalSalesCount = filteredSales.length
  const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0
  const inventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0)

  const salesByMethod = filteredSales.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'efectivo'
    acc[method] = (acc[method] || 0) + (sale.amount || 0)
    return acc
  }, { efectivo: 0, tarjeta: 0, qr: 0, credito: 0 })

  const productSales = {}
  filteredSales.forEach(sale => {
    if (sale.items) {
      sale.items.forEach(item => { if (item.productName) productSales[item.productName] = (productSales[item.productName] || 0) + (item.quantity || 0) })
    }
  })
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const lowStockProducts = products.filter(p => (p.stock ?? 0) < 10 && (p.stock ?? 0) > 0).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5)

  const salesByDay = {}
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    last7Days.push({ key, label: date.toLocaleDateString('es-BO', { weekday: 'short' }) })
    salesByDay[key] = 0
  }
  filteredSales.forEach(sale => {
    if (sale.createdAt) {
      const date = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
      const key = date.toISOString().split('T')[0]
      if (salesByDay.hasOwnProperty(key)) { salesByDay[key] += sale.amount || 0 }
    }
  })
  const maxDayValue = Math.max(...Object.values(salesByDay), 1)

  const exportPDF = async () => {
    try {
      showToast('Generando Reporte PDF...', 'info')
      const [jspdfModule, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default
      const html2canvas = html2canvasModule.default
      if (!containerRef.current) return
      const canvas = await html2canvas(containerRef.current, { scale: 2, useCORS: true, logging: false, background: '#0f172a' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth(); const pdfH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pdfW) / canvas.width
      let finalH = imgH; let finalW = pdfW
      if (imgH > pdfH) { const ratio = pdfH / imgH; finalH = pdfH; finalW = pdfW * ratio }
      pdf.addImage(imgData, 'PNG', 0, 0, finalW, finalH)
      pdf.save(`reporte_${new Date().toISOString().split('T')[0]}.pdf`)
      showToast('PDF Exportado', 'success')
    } catch (err) { console.error(err); showToast('Error', 'error') }
  }

  const exportCSV = () => {
    const headers = ['Fecha', 'Cliente', 'Productos', 'Método', 'Monto']
    const rows = filteredSales.map(s => {
      const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || Date.now())
      return [date.toLocaleDateString('es-BO'), s.clientName || 'Cliente General', s.items?.map(i => `${i.quantity}x ${i.productName}`).join('; ') || '-', s.paymentMethod || 'efectivo', s.amount || 0]
    })
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `reporte_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const pagedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize))

  if (!user || !tenantId) return <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', color: 'white' }}>🔒 Debes iniciar sesión</div></div>

  return (
    <div style={styles.container} ref={containerRef}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } select option { background: #1e293b; color: white; } input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }`}</style>

      {/* Header */}
      <div style={styles.header}>
        <div><h1 style={styles.title}>📊 Reportes y Análisis</h1><p style={styles.subtitle}>Visualiza el rendimiento de tu negocio</p></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={exportPDF}><span>📄</span> PDF</button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={exportCSV}><span>📥</span> CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.tabsContainer}>
          {['today', 'week', 'month', 'all', 'custom'].map(range => (
            <button key={range} style={{ ...styles.tab, ...(dateRange === range ? styles.tabActive : {}) }} onClick={() => setDateRange(range)}>{range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : range === 'all' ? 'Todo' : 'Personalizado'}</button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <>
            <div style={styles.filterGroup}><label style={styles.filterLabel}>Desde</label><input type="date" style={styles.dateInput} value={customStart} onChange={e => setCustomStart(e.target.value)} /></div>
            <div style={styles.filterGroup}><label style={styles.filterLabel}>Hasta</label><input type="date" style={styles.dateInput} value={customEnd} onChange={e => setCustomEnd(e.target.value)} /></div>
          </>
        )}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Método de Pago</label>
          <select style={styles.select} value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
            <option value="all">Todos</option><option value="efectivo">💵 Efectivo</option><option value="tarjeta">💳 Tarjeta</option><option value="qr">📱 QR</option><option value="credito">📄 Crédito</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}><div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' }}>💰</div><div style={styles.statLabel}>Ingresos Totales</div><div style={{ ...styles.statValue, color: '#10b981' }}>{formatCurrency(totalRevenue)}</div><div style={styles.statMeta}>{dateRange}</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)' }}>🛒</div><div style={styles.statLabel}>Total de Ventas</div><div style={styles.statValue}>{totalSalesCount}</div><div style={styles.statMeta}>transacciones</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>🎫</div><div style={styles.statLabel}>Ticket Promedio</div><div style={{ ...styles.statValue, color: '#a855f7' }}>{formatCurrency(avgTicket)}</div><div style={styles.statMeta}>por venta</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)' }}>🏰</div><div style={styles.statLabel}>Valor Inventario</div><div style={{ ...styles.statValue, color: '#f59e0b' }}>{formatCurrency(inventoryValue)}</div><div style={styles.statMeta}>Costo stock</div></div>
      </div>

      {/* Chart Row */}
      <div style={styles.flexRow}>
        <div style={{ ...styles.card, ...styles.flexLarge }}>
          <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📈</span> Ventas Últimos 7 Días</div></div>
          <div style={styles.cardBody}>
            <div style={styles.chartContainer}>
              {last7Days.map(({ key, label }) => {
                const value = salesByDay[key] || 0; const height = Math.max(4, (value / maxDayValue) * 100)
                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div style={{ ...styles.chartBar, height: `${height}%`, width: '100%' }}>
                      {value > 0 && <span style={styles.chartValue}>{formatCurrency(value)}</span>}
                    </div>
                    <div style={styles.chartLabel}>{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, ...styles.flexSmall }}>
          <div style={styles.cardHeader}><div style={styles.cardTitle}><span>💳</span> Por Método</div></div>
          <div style={styles.cardBody}>
            <div style={styles.paymentGrid}>
              <div style={{ ...styles.paymentCard, background: 'rgba(16, 185, 129, 0.1)' }}><div style={{ ...styles.paymentLabel, color: '#10b981' }}>Efectivo</div><div style={{ ...styles.paymentValue, color: '#10b981' }}>{formatCurrency(salesByMethod.efectivo)}</div></div>
              <div style={{ ...styles.paymentCard, background: 'rgba(59, 130, 246, 0.1)' }}><div style={{ ...styles.paymentLabel, color: '#3b82f6' }}>Tarjeta</div><div style={{ ...styles.paymentValue, color: '#3b82f6' }}>{formatCurrency(salesByMethod.tarjeta)}</div></div>
              <div style={{ ...styles.paymentCard, background: 'rgba(168, 85, 247, 0.1)' }}><div style={{ ...styles.paymentLabel, color: '#a855f7' }}>QR</div><div style={{ ...styles.paymentValue, color: '#a855f7' }}>{formatCurrency(salesByMethod.qr)}</div></div>
              <div style={{ ...styles.paymentCard, background: 'rgba(245, 158, 11, 0.1)' }}><div style={{ ...styles.paymentLabel, color: '#f59e0b' }}>Crédito</div><div style={{ ...styles.paymentValue, color: '#f59e0b' }}>{formatCurrency(salesByMethod.credito)}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists Row */}
      <div style={styles.flexRow}>
        <div style={{ ...styles.card, ...styles.flexSmall }}>
          <div style={styles.cardHeader}><div style={styles.cardTitle}><span>🏆</span> Top Productos</div></div>
          <div style={styles.cardBody}>
            {topProducts.length === 0 ? <div style={styles.emptyState}>No data</div> : topProducts.map(([name, qty], idx) => (
              <div key={name} style={styles.topProductItem}><div style={{ ...styles.productRank, background: idx < 3 ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: idx < 3 ? '#000' : '#fff' }}>{idx + 1}</div><div style={styles.productName}>{name}</div><div style={styles.productQty}>{qty}</div></div>
            ))}
          </div>
        </div>
        <div style={{ ...styles.card, ...styles.flexSmall }}>
          <div style={styles.cardHeader}><div style={styles.cardTitle}><span>⚠️</span> Stock Bajo</div></div>
          <div style={styles.cardBody}>
            {lowStockProducts.length === 0 ? <div style={{ ...styles.emptyState, color: '#10b981', padding: '24px' }}>✅ Todo OK</div> : lowStockProducts.map(p => (
              <div key={p.id} style={styles.lowStockItem}><span>{p.name}</span><span style={{ color: '#ef4444', fontWeight: '700' }}>{p.stock} uds</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📋</span> Detalle de Ventas</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Cliente</th><th style={styles.th}>Items</th><th style={styles.th}>Método</th><th style={styles.th}>Total</th></tr></thead>
            <tbody>
              {pagedSales.map(sale => {
                const date = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt || Date.now())
                return (
                  <tr key={sale.id}>
                    <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{date.toLocaleDateString('es-BO')} {date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{sale.clientName || 'General'}</td>
                    <td style={{ ...styles.td, color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{sale.items?.length} items</td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: sale.paymentMethod === 'efectivo' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: sale.paymentMethod === 'efectivo' ? '#10b981' : '#3b82f6' }}>{sale.paymentMethod || 'efectivo'}</span></td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#10b981' }}>{formatCurrency(sale.amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div style={styles.pagination}><button style={styles.pageBtn} onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>←</button><span style={{ color: 'white', fontSize: '14px' }}>Página {page}</span><button style={styles.pageBtn} onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>→</button></div>}
      </div>
    </div>
  )
}
