import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

const formatCurrency = (amount) => `Bs ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px; font-family: system-ui;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : ''}
    ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : ''}
    ${type === 'info' ? 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;' : ''}
  `;
  el.innerHTML = `${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  // ...
  modal: {
    background: 'linear-gradient(180deg, #1e293b, #0f172a)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    width: '90%', // Mobile width
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    margin: 'auto',
  },
  inputRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  searchRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  searchInput: {
    flex: 1,
    maxWidth: '400px',
    padding: '14px 20px 14px 48px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  btnDanger: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
  },
  btnSmall: { padding: '8px 14px', fontSize: '13px' },
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '14px',
  },
  badge: {
    display: 'inline-flex',
    padding: '6px 12px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: '600',
  },
  badgeSuccess: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  badgeWarning: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  badgeDanger: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  badgePrimary: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
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
    background: 'linear-gradient(180deg, #1e293b, #0f172a)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: '500px',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '24px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 },
  modalClose: {
    width: '36px', height: '36px', borderRadius: '10px', border: 'none',
    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
    fontSize: '20px', cursor: 'pointer',
  },
  modalBody: { padding: '28px' },
  modalFooter: {
    padding: '20px 28px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  inputGroup: { marginBottom: '20px' },
  inputLabel: { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
};

export default function Products() {
  const navigate = useNavigate()
  const { user, userData } = useOutletContext() || {}

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockProduct, setStockProduct] = useState(null)
  const [stockDelta, setStockDelta] = useState(0)
  const [stockReason, setStockReason] = useState('Ajuste manual')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [stockMin, setStockMin] = useState('')
  const [category, setCategory] = useState('')

  const tenantId = userData?.tenantId
  const role = userData?.role
  const canEdit = role === 'owner' || role === 'admin'

  useEffect(() => {
    if (!tenantId) return
    const q = query(collection(db, 'products'), where('tenantId', '==', tenantId))
    const unsub = onSnapshot(q, snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setProducts(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); setStock(''); setStockMin(''); setCategory('')
    setEditingId(null); setShowModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name) return showToast('El nombre es requerido', 'error')
    if (!canEdit) return showToast('Sin permiso', 'error')

    const data = {
      name, description,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      stockMin: parseInt(stockMin) || 0,
      category, tenantId,
      updatedAt: serverTimestamp()
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data)
        showToast('Producto actualizado', 'success')
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() })
        showToast('Producto creado', 'success')
      }
      resetForm()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  const handleEdit = (p) => {
    setEditingId(p.id); setName(p.name || ''); setDescription(p.description || '')
    setPrice(p.price?.toString() || ''); setStock(p.stock?.toString() || '')
    setStockMin(p.stockMin?.toString() || ''); setCategory(p.category || '')
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteDoc(doc(db, 'products', id))
    showToast('Producto eliminado', 'success')
  }

  const openStockModal = (p) => {
    setStockProduct(p); setStockDelta(0); setStockReason('Ajuste manual')
    setShowStockModal(true)
  }

  const applyStockAdjustment = async (e) => {
    e.preventDefault()
    if (!stockProduct) return
    const delta = Number(stockDelta) || 0
    if (delta === 0) return showToast('Ingrese cantidad', 'error')
    const prev = stockProduct.stock || 0
    const next = Math.max(0, prev + delta)
    try {
      await updateDoc(doc(db, 'products', stockProduct.id), { stock: next })
      await addDoc(collection(db, 'stock_movements'), {
        productId: stockProduct.id, productName: stockProduct.name, tenantId,
        delta, previousStock: prev, newStock: next, reason: stockReason,
        createdBy: user?.email, createdAt: serverTimestamp()
      })
      showToast('Stock ajustado', 'success')
      setShowStockModal(false)
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user || !tenantId) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <p>Debes iniciar sesión.</p>
          <button style={{ ...styles.btn, ...styles.btnSecondary, marginTop: '16px' }} onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <style>{`input::placeholder { color: rgba(255,255,255,0.3); }`}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📦 Productos</h1>
          <p style={styles.subtitle}>Gestiona tu inventario</p>
        </div>
        {canEdit && (
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowModal(true)}>
            <span>+</span> Nuevo Producto
          </button>
        )}
      </div>

      <div style={styles.searchRow}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}><span>📋</span> Inventario</div>
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>{filteredProducts.length} productos</span>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1s infinite' }}>⏳</div>
            <p>Cargando...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <p>{searchTerm ? 'No se encontraron productos' : 'Agrega tu primer producto'}</p>
            {canEdit && !searchTerm && (
              <button style={{ ...styles.btn, ...styles.btnPrimary, marginTop: '16px' }} onClick={() => setShowModal(true)}>
                + Agregar Producto
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Producto</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Precio</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Estado</th>
                  {canEdit && <th style={styles.th}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{p.description}</div>}
                    </td>
                    <td style={styles.td}>
                      {p.category ? <span style={{ ...styles.badge, ...styles.badgePrimary }}>{p.category}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>}
                    </td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#10b981' }}>{formatCurrency(p.price)}</td>
                    <td style={styles.td}>{p.stock ?? 0}</td>
                    <td style={styles.td}>
                      {(p.stock ?? 0) === 0 ? (
                        <span style={{ ...styles.badge, ...styles.badgeDanger }}>Sin Stock</span>
                      ) : (p.stock ?? 0) <= (p.stockMin ?? 0) ? (
                        <span style={{ ...styles.badge, ...styles.badgeWarning }}>Stock Bajo</span>
                      ) : (
                        <span style={{ ...styles.badge, ...styles.badgeSuccess }}>OK</span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => openStockModal(p)} title="Ajustar Stock">📊</button>
                          <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => handleEdit(p)} title="Editar">✏️</button>
                          <button style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }} onClick={() => handleDelete(p.id)} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => resetForm()}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
              <button style={styles.modalClose} onClick={() => resetForm()}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Nombre *</label>
                  <input type="text" style={styles.input} placeholder="Nombre del producto" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Descripción</label>
                  <input type="text" style={styles.input} placeholder="Descripción (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Precio (Bs)</label>
                    <input type="number" step="0.01" style={styles.input} placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Categoría</label>
                    <input type="text" style={styles.input} placeholder="Ej: Bebidas" value={category} onChange={e => setCategory(e.target.value)} />
                  </div>
                </div>
                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Stock Inicial</label>
                    <input type="number" style={styles.input} placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Stock Mínimo</label>
                    <input type="number" style={styles.input} placeholder="0" value={stockMin} onChange={e => setStockMin(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => resetForm()}>Cancelar</button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{editingId ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && stockProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowStockModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📊 Ajustar Stock</h3>
              <button style={styles.modalClose} onClick={() => setShowStockModal(false)}>×</button>
            </div>
            <form onSubmit={applyStockAdjustment}>
              <div style={styles.modalBody}>
                <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>Producto</div>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>{stockProduct.name}</div>
                  <div style={{ color: '#10b981', fontSize: '24px', fontWeight: '700', marginTop: '8px' }}>Stock actual: {stockProduct.stock ?? 0}</div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Cantidad a agregar/restar</label>
                  <input type="number" style={{ ...styles.input, textAlign: 'center', fontSize: '24px' }} placeholder="0" value={stockDelta} onChange={e => setStockDelta(e.target.value)} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px' }}>Use números negativos para restar stock</p>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Motivo</label>
                  <input type="text" style={styles.input} placeholder="Ajuste manual" value={stockReason} onChange={e => setStockReason(e.target.value)} />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowStockModal(false)}>Cancelar</button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Aplicar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
