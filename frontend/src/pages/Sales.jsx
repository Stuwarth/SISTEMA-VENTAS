import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { renderInvoiceHTML } from '../components/Invoice'
import { cancelSale, createSale } from '../utils/sales'

// ==================== HELPERS ====================

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px; font-family: system-ui, sans-serif;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;' : ''}
    ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;' : ''}
    ${type === 'info' ? 'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;' : ''}
  `;
  el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100px)'; setTimeout(() => el.remove(), 300); }, 3500);
}

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  statValue: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '700',
  },
  mainGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    alignItems: 'flex-start',
  },
  historyColumn: {
    flex: '1 1 500px',
    minWidth: '300px',
  },
  posColumn: {
    flex: '1 1 350px',
    minWidth: '300px',
    maxWidth: '100%',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '20px',
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
    gap: '10px',
  },
  cardBody: {
    padding: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '14px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '100px',
    fontSize: '11px',
    fontWeight: '600',
  },
  badgeSuccess: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  badgeDanger: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  badgeInfo: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
  badgePurple: {
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#a855f7',
    border: '1px solid rgba(168, 85, 247, 0.3)',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  btnDanger: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  btnSmall: {
    padding: '6px 12px',
    fontSize: '12px',
  },
  posPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
  },
  productSearch: {
    marginBottom: '16px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  productCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
  },
  productName: {
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '4px',
    lineHeight: '1.4',
  },
  productPrice: {
    color: '#10b981',
    fontSize: '15px',
    fontWeight: '700',
  },
  productStock: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
    marginTop: '4px',
  },
  cartSection: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '16px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '24px',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
  },
  cartItemPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
  },
  cartItemQty: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
  },
  cartTotal: {
    marginTop: '16px',
    padding: '20px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
    marginBottom: '4px',
  },
  totalValue: {
    color: '#10b981',
    fontSize: '32px',
    fontWeight: '800',
  },
  paymentMethods: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '16px',
  },
  paymentBtn: {
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  paymentBtnActive: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
  },
  checkoutBtn: {
    width: '100%',
    padding: '18px',
    marginTop: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'rgba(255,255,255,0.4)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    width: '90%',
    maxWidth: '500px',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '24px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  modalClose: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '20px',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '28px',
  },
  modalFooter: {
    padding: '20px 28px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  inputLabel: {
    display: 'block',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
};

export default function Sales() {
  const navigate = useNavigate()
  const { user, userData, business } = useOutletContext() || {}

  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [productSearch, setProductSearch] = useState('')

  // Cart State
  const [cart, setCart] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paidAmount, setPaidAmount] = useState('')
  const [discount, setDiscount] = useState('') // DISCOUNT STATE

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelSaleId, setCancelSaleId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const tenantId = userData?.tenantId
  const role = userData?.role
  const canSell = role === 'owner' || role === 'admin' || role === 'vendedor'

  useEffect(() => {
    if (!tenantId) return

    const unsubSales = onSnapshot(
      query(collection(db, 'sales'), where('tenantId', '==', tenantId)),
      snap => {
        const arr = []
        snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
        arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setSales(arr)
        setLoading(false)
      }
    )

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('tenantId', '==', tenantId)),
      snap => {
        const arr = []
        snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
        setProducts(arr.filter(p => (p.stock ?? 0) > 0))
      }
    )

    const unsubClients = onSnapshot(
      query(collection(db, 'clients'), where('tenantId', '==', tenantId)),
      snap => {
        const arr = []
        snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
        setClients(arr)
      }
    )

    return () => { unsubSales(); unsubProducts(); unsubClients() }
  }, [tenantId])

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      if (existing.quantity >= (product.stock ?? 0)) {
        return showToast('No hay más stock disponible', 'error')
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
        maxStock: product.stock ?? 0
      }])
    }
  }

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.maxStock))
        return { ...item, quantity: newQty, subtotal: newQty * item.price }
      }
      return item
    }))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedClient('')
    setPaymentMethod('efectivo')
    setPaidAmount('')
    setDiscount('')
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const finalTotal = Math.max(0, cartTotal - (Number(discount) || 0))
  const changeAmount = Math.max(0, (Number(paidAmount) || 0) - finalTotal)

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast('Agrega productos al carrito', 'error')
    if (!canSell) return showToast('No tienes permiso para vender', 'error')

    const client = clients.find(c => c.id === selectedClient)

    const salePayload = {
      clientId: selectedClient || null,
      clientName: client?.name || 'Cliente General',
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal
      })),
      desc: '',
      subtotal: cartTotal, // ORIGINAL SUBTOTAL
      discount: Number(discount) || 0, // DISCOUNT FIELD
      amount: finalTotal, // FINAL AMOUNT
      paymentMethod,
      tenantId,
      createdBy: user?.email || user?.uid || null,
    }

    if (paymentMethod === 'efectivo' && paidAmount) {
      salePayload.paidAmount = Number(paidAmount)
      salePayload.changeAmount = changeAmount
    }

    try {
      const res = await createSale({ sale: salePayload })
      if (res && res.id) {
        showToast('¡Venta registrada exitosamente!', 'success')
        clearCart()
      }
    } catch (err) {
      showToast('Error: ' + (err.message || err), 'error')
    }
  }

  const doCancelSale = async () => {
    if (!cancelSaleId) return
    if (!cancelReason || cancelReason.trim().length < 3) {
      return showToast('Ingrese un motivo (mínimo 3 caracteres)', 'error')
    }
    try {
      const res = await cancelSale({ saleId: cancelSaleId, reason: cancelReason })
      if (res && res.canceled) {
        showToast('Venta anulada correctamente', 'success')
        setShowCancelModal(false)
        setCancelSaleId(null)
        setCancelReason('')
      }
    } catch (err) {
      showToast('Error: ' + (err.message || err), 'error')
    }
  }

  const exportSalePDF = async (sale) => {
    try {
      showToast('Generando PDF...', 'info')
      const [jspdfModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default
      const html2canvas = html2canvasModule.default

      const container = document.createElement('div')
      container.style.cssText = 'position: fixed; left: -9999px; top: 0;'

      const invoiceData = {
        sale,
        business: business || {}
      }

      container.innerHTML = renderInvoiceHTML(invoiceData)
      document.body.appendChild(container)

      const images = container.getElementsByTagName('img')
      if (images.length > 0) {
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise(resolve => { img.onload = resolve; img.onerror = resolve })
        }))
      }

      await new Promise(r => setTimeout(r, 500))

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`venta_${sale.id}.pdf`)

      document.body.removeChild(container)
      showToast('PDF descargado', 'success')
    } catch (err) {
      console.error(err)
      showToast('Error generando PDF: ' + err.message, 'error')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  )

  const filteredSales = sales.filter(s =>
    s.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeSales = sales.filter(s => s.status !== 'canceled')
  const todaySales = activeSales.filter(s => {
    if (!s.createdAt) return false
    const saleDate = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
    return saleDate.toDateString() === new Date().toDateString()
  })
  const todayTotal = todaySales.reduce((sum, s) => sum + (s.amount || 0), 0)

  if (!user || !tenantId) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <p>Debes iniciar sesión para ver las ventas.</p>
          <button style={{ ...styles.btn, ...styles.btnPrimary, marginTop: '16px' }} onClick={() => navigate('/login')}>
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
          input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
          select option { background: #1e293b; color: white; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Punto de Venta</h1>
          <p style={styles.subtitle}>📅 {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>💰 Ventas de Hoy</div>
          <div style={{ ...styles.statValue, color: '#10b981' }}>{formatCurrency(todayTotal)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>🛒 Transacciones</div>
          <div style={styles.statValue}>{todaySales.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>📦 Productos Disponibles</div>
          <div style={styles.statValue}>{products.length}</div>
        </div>
      </div>

      <div style={styles.mainGrid}>

        <div style={{ ...styles.card, ...styles.historyColumn }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              <span>📋</span> Historial de Ventas
            </div>
            <div style={{ position: 'relative', width: '200px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>🔍</span>
              <input
                type="text"
                style={{ ...styles.searchInput, padding: '10px 12px 10px 32px', fontSize: '13px' }}
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, 20).map(sale => (
                  <tr key={sale.id} style={{ opacity: sale.status === 'canceled' ? 0.5 : 1 }}>
                    <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      {sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td style={{ ...styles.td }}>
                      <div style={{ fontWeight: '500', fontSize: '13px' }}>{sale.clientName || 'General'}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {sale.items?.length} prod. • {sale.paymentMethod}
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: '700', color: sale.status === 'canceled' ? '#ef4444' : '#10b981' }}>
                      {formatCurrency(sale.amount)}
                    </td>
                    <td style={styles.td}>
                      {sale.status === 'canceled' ? (
                        <span style={{ ...styles.badge, ...styles.badgeDanger }}>Anulada</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall, padding: '6px' }}
                            onClick={() => exportSalePDF(sale)}
                            title="Exportar PDF"
                          >
                            📄
                          </button>
                          <button
                            style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall, padding: '6px' }}
                            onClick={() => { setCancelSaleId(sale.id); setCancelReason(''); setShowCancelModal(true); }}
                            title="Anular"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div style={styles.emptyCart}>
                <div style={styles.emptyIcon}>🛒</div>
                <p>No hay ventas registradas</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...styles.card, ...styles.posPanel, ...styles.posColumn }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              <span>🛒</span> Nueva Venta
            </div>
            {cart.length > 0 && (
              <button style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }} onClick={clearCart}>
                Limpiar
              </button>
            )}
          </div>
          <div style={styles.cardBody}>
            <div style={styles.inputGroup}>
              <select
                style={styles.select}
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
              >
                <option value="">Cliente General</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.productSearch}>
              <input
                type="text"
                style={styles.input}
                placeholder="🔍 Buscar producto..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>

            <div style={styles.productGrid}>
              {filteredProducts.slice(0, 12).map(product => (
                <div
                  key={product.id}
                  style={styles.productCard}
                  onClick={() => addToCart(product)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={styles.productName}>{product.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={styles.productPrice}>{formatCurrency(product.price)}</div>
                    <div style={styles.productStock}>{product.stock} un.</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.cartSection}>
              {cart.length === 0 ? (
                <div style={{ ...styles.emptyCart, padding: '24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>Selecciona productos</p>
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {cart.map(item => (
                      <div key={item.productId} style={styles.cartItem}>
                        <div style={styles.cartItemInfo}>
                          <div style={styles.cartItemName}>{item.productName}</div>
                          <div style={styles.cartItemPrice}>{formatCurrency(item.price)}</div>
                        </div>
                        <div style={styles.cartItemQty}>
                          <button style={styles.qtyBtn} onClick={() => updateQuantity(item.productId, -1)}>−</button>
                          <span style={styles.qtyValue}>{item.quantity}</span>
                          <button style={styles.qtyBtn} onClick={() => updateQuantity(item.productId, 1)}>+</button>
                          <button
                            style={{ ...styles.qtyBtn, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', marginLeft: '4px', width: '28px', height: '28px', fontSize: '14px' }}
                            onClick={() => removeFromCart(item.productId)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DISCOUNT INPUT & TOTALS */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#fbbf24' }}>Descuento:</span>
                      <input
                        type="number"
                        style={{ ...styles.input, width: '100px', padding: '6px 10px', textAlign: 'right', borderColor: discount ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}
                        placeholder="0.00"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                      />
                    </div>

                    <div style={styles.cartTotal}>
                      <div style={styles.totalLabel}>TOTAL A COBRAR</div>
                      <div style={styles.totalValue}>{formatCurrency(finalTotal)}</div>
                    </div>
                  </div>

                  <div style={styles.paymentMethods}>
                    {[
                      { id: 'efectivo', label: '💵' },
                      { id: 'tarjeta', label: '💳' },
                      { id: 'qr', label: '📱' },
                      { id: 'credito', label: '📄' },
                    ].map(method => (
                      <button
                        key={method.id}
                        style={{
                          ...styles.paymentBtn,
                          ...(paymentMethod === method.id ? styles.paymentBtnActive : {})
                        }}
                        onClick={() => setPaymentMethod(method.id)}
                        title={method.id}
                      >
                        {method.label} {method.id.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <div style={{ marginTop: '16px' }}>
                      <input
                        type="number"
                        style={styles.input}
                        placeholder="Monto recibido"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                      />
                      {Number(paidAmount) > finalTotal && (
                        <div style={{ marginTop: '8px', color: '#10b981', fontWeight: '600', fontSize: '14px', textAlign: 'right' }}>
                          Cambio: {formatCurrency(changeAmount)}
                        </div>
                      )}
                    </div>
                  )}

                  <button style={styles.checkoutBtn} onClick={handleCheckout}>
                    <span>✓</span> Completar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🗑️ Anular Venta</h3>
              <button style={styles.modalClose} onClick={() => setShowCancelModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
                Esto devolverá el stock. Ingresa el motivo:
              </p>
              <textarea
                style={{ ...styles.input, minHeight: '100px', resize: 'none' }}
                placeholder="Motivo de la anulación..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowCancelModal(false)}>
                Cancelar
              </button>
              <button style={{ ...styles.btn, ...styles.btnPrimary, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }} onClick={doCancelSale}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
