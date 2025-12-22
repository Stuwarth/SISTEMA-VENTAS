import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { createPurchase } from '../utils/purchases'

function showToast(msg, type = 'info') {
  const el = document.createElement('div')
  el.style.cssText = `position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;'}`
  el.textContent = `${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} ${msg}`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`

const formatDate = (ts) => { if (!ts) return '-'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('es-BO') }

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '20px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none' },
  btnPrimary: { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
  btnSecondary: { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
  btnDanger: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { textAlign: 'left', padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
  badge: { display: 'inline-flex', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  badgePrimary: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'linear-gradient(180deg, #1e293b, #0f172a)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: '95%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 },
  modalClose: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' },
  modalBody: { padding: '0', overflowY: 'hidden', flex: 1, display: 'flex' }, // Desktop default
  inputGroup: { marginBottom: '20px' },
  inputLabel: { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' },
  input: { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' },
  productList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', paddingBottom: '20px', overflowY: 'auto' },
  productCard: { background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tabBtn: { flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: 'rgba(255,255,255,0.5)', fontWeight: '600', cursor: 'pointer' },
  tabBtnActive: { color: '#3b82f6', borderBottomColor: '#3b82f6' }
}

export default function Purchases() {
  const { user, userData } = useOutletContext() || {}
  const [purchases, setPurchases] = useState([])
  const [providers, setProviders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [activeTab, setActiveTab] = useState('products') // products | cart

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Form State
  const [providerId, setProviderId] = useState('')
  const [description, setDescription] = useState('')
  const [cart, setCart] = useState([]) // [{ productId, productName, quantity, cost, subtotal }]
  const [searchTerm, setSearchTerm] = useState('')

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return
    const unsub1 = onSnapshot(query(collection(db, 'purchases'), where('tenantId', '==', tenantId)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setPurchases(arr)
      setLoading(false)
    })
    const unsub2 = onSnapshot(query(collection(db, 'providers'), where('tenantId', '==', tenantId)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setProviders(arr)
    })
    const unsub3 = onSnapshot(query(collection(db, 'products'), where('tenantId', '==', tenantId)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setProducts(arr)
    })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [tenantId])

  const resetForm = () => {
    setProviderId('')
    setDescription('')
    setCart([])
    setSearchTerm('')
    setShowModal(false)
    setActiveTab('products')
  }

  const addToCart = (product) => {
    const existing = cart.find(i => i.productId === product.id)
    if (existing) {
      showToast('Producto ya en lista', 'info')
      return
    }

    setCart([...cart, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      cost: product.costPrice || 0, // Default to current cost
      subtotal: (product.costPrice || 0) * 1
    }])
    if (isMobile) showToast('Producto agregado', 'success')
  }

  const updateCartItem = (productId, field, value) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: parseFloat(value) || 0 }
        updated.subtotal = updated.quantity * updated.cost
        return updated
      }
      return item
    }))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.productId !== productId))
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!providerId) return showToast('Selecciona un proveedor', 'error')
    if (cart.length === 0) return showToast('Agrega productos', 'error')

    // Validar cantidades positivas
    if (cart.some(i => i.quantity <= 0 || i.cost < 0)) return showToast('Valores deben ser positivos', 'error')

    const provider = providers.find(p => p.id === providerId)

    try {
      showToast('Registrando compra...', 'info')
      await createPurchase({
        tenantId,
        providerId,
        providerName: provider?.name || 'Proveedor',
        items: cart,
        total: cartTotal,
        description,
        createdBy: user?.email
      })
      showToast('Compra registrada exitosamente', 'success')
      resetForm()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!user || !tenantId) return null

  // Components for Panels
  const ProductSelectionPanel = () => (
    <div style={{ padding: '24px', flex: isMobile ? 1 : 1, borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', maxHeight: isMobile ? 'calc(80vh - 150px)' : '100%' }}>
      <h4 style={{ marginTop: 0, color: 'white', marginBottom: '16px' }}>1. Seleccionar Productos</h4>
      <input
        type="text"
        style={{ ...styles.input, marginBottom: '16px' }}
        placeholder="🔍 Buscar producto..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        autoFocus={!isMobile}
      />
      <div style={styles.productList}>
        {filteredProducts.slice(0, 50).map(p => (
          <div
            key={p.id}
            style={{
              ...styles.productCard,
              borderColor: cart.some(i => i.productId === p.id) ? '#10b981' : 'transparent',
              background: cart.some(i => i.productId === p.id) ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'
            }}
            onClick={() => addToCart(p)}
          >
            <div style={{ fontWeight: '600', fontSize: '13px', color: 'white', marginBottom: '4px' }}>{p.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Stock: {p.stock}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const CartPanel = () => (
    <div style={{ padding: '24px', flex: isMobile ? 1 : 1.2, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'hidden' }}>
      <h4 style={{ marginTop: 0, color: 'white', marginBottom: '16px' }}>2. Detalle de Compra</h4>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Proveedor *</label>
        <select style={styles.select} value={providerId} onChange={e => setProviderId(e.target.value)}>
          <option value="">Seleccionar Proveedor...</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', minHeight: '150px' }}>
        {cart.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Selecciona productos</div>
        ) : (
          cart.map(item => (
            <div key={item.productId} style={styles.cartItem}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: 'white', fontSize: '14px' }}>{item.productName}</div>
              </div>
              <div style={{ width: '70px' }}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Cant.</label>
                <input
                  type="number"
                  min="1"
                  style={{ ...styles.input, padding: '4px 8px', height: '30px' }}
                  value={item.quantity}
                  onChange={e => updateCartItem(item.productId, 'quantity', e.target.value)}
                />
              </div>
              <div style={{ width: '90px' }}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Costo</label>
                <input
                  type="number"
                  step="0.01"
                  style={{ ...styles.input, padding: '4px 8px', height: '30px' }}
                  value={item.cost}
                  onChange={e => updateCartItem(item.productId, 'cost', e.target.value)}
                />
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => removeFromCart(item.productId)}
              >×</button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Items: {cart.length}</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>Total: {formatCurrency(cartTotal)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button style={{ ...styles.btn, ...styles.btnSecondary, justifyContent: 'center' }} onClick={resetForm}>Cancelar</button>
        <button style={{ ...styles.btn, ...styles.btnPrimary, justifyContent: 'center' }} onClick={handleSubmit}>Confirmar</button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <style>{`input::placeholder{color:rgba(255,255,255,0.3)} select option{background:#1e293b;color:white}
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={styles.header}>
        <div><h1 style={styles.title}>📦 Compras</h1><p style={styles.subtitle}>Gestión de abastecimiento e inventario</p></div>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowModal(true)}>+ Nueva Compra</button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📋</span> Historial</div><span style={{ ...styles.badge, ...styles.badgePrimary }}>{purchases.length}</span></div>
        {loading ? <div style={styles.emptyState}>⏳ Cargando...</div> : purchases.length === 0 ? <div style={styles.emptyState}><div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div><p>Sin compras registradas</p></div> : (
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Proveedor</th><th style={styles.th}>Items</th><th style={styles.th}>Total</th></tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)' }}>{formatDate(p.createdAt)}</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>
                      <div>{p.providerName}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{p.description}</div>
                    </td>
                    <td style={styles.td}>{p.items?.length || 0}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => resetForm()}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>➕ Registrar Compra</h3><button style={styles.modalClose} onClick={resetForm}>×</button></div>

            {/* Mobile Tabs */}
            {isMobile && (
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  style={{ ...styles.tabBtn, ...(activeTab === 'products' ? styles.tabBtnActive : {}) }}
                  onClick={() => setActiveTab('products')}
                >
                  Productos
                </button>
                <button
                  style={{ ...styles.tabBtn, ...(activeTab === 'cart' ? styles.tabBtnActive : {}) }}
                  onClick={() => setActiveTab('cart')}
                >
                  Carrito ({cart.length})
                </button>
              </div>
            )}

            <div style={{ ...styles.modalBody, flexDirection: isMobile ? 'column' : 'row' }}>
              {isMobile ? (
                <>
                  {activeTab === 'products' && <ProductSelectionPanel />}
                  {activeTab === 'cart' && <CartPanel />}
                </>
              ) : (
                <>
                  <ProductSelectionPanel />
                  <CartPanel />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
