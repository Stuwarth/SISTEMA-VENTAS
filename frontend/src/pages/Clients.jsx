import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

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
    padding: '20px', // Responsive padding
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap', // Allow wrapping
    gap: '16px',
  },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  searchRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '280px', // Min width for mobile
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
    padding: '12px 20px',
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
  btnSmall: { padding: '8px 12px', fontSize: '13px' },
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
  tableWrapper: { overflowX: 'auto', width: '100%' }, // Responsive Table
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
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
    width: '90%', // Responsive width
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    margin: 'auto',
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
  inputRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }, // Responsive Grid
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
  clientAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    marginRight: '12px',
  },
};

export default function Clients() {
  const navigate = useNavigate()
  const { user, userData } = useOutletContext() || {}

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nit, setNit] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  // History
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [clientHistory, setClientHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedClientName, setSelectedClientName] = useState('')

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return
    const q = query(collection(db, 'clients'), where('tenantId', '==', tenantId))
    const unsub = onSnapshot(q, snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setClients(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const resetForm = () => {
    setName(''); setPhone(''); setNit(''); setEmail(''); setAddress('')
    setEditingId(null); setShowModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name) return showToast('El nombre es requerido', 'error')

    const data = {
      name, phone, nit, email, address, tenantId,
      updatedAt: serverTimestamp()
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'clients', editingId), data)
        showToast('Cliente actualizado', 'success')
      } else {
        await addDoc(collection(db, 'clients'), { ...data, createdAt: serverTimestamp() })
        showToast('Cliente creado', 'success')
      }
      resetForm()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  const handleEdit = (c) => {
    setEditingId(c.id); setName(c.name || ''); setPhone(c.phone || '')
    setNit(c.nit || ''); setEmail(c.email || ''); setAddress(c.address || '')
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await deleteDoc(doc(db, 'clients', id))
    showToast('Cliente eliminado', 'success')
  }

  const viewHistory = (client) => {
    setSelectedClientName(client.name)
    setShowHistoryModal(true)
    setHistoryLoading(true)
    setClientHistory([])

    const q = query(collection(db, 'sales'), where('tenantId', '==', tenantId), where('clientId', '==', client.id))
    onSnapshot(q, snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setClientHistory(arr.slice(0, 50))
      setHistoryLoading(false)
    })
  }

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit?.includes(searchTerm)
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
          <h1 style={styles.title}>👥 Clientes</h1>
          <p style={styles.subtitle}>Directorio de clientes</p>
        </div>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowModal(true)}>
          <span>+</span> Nuevo Cliente
        </button>
      </div>

      <div style={styles.searchRow}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Buscar por nombre o NIT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}><span>📋</span> Listado</div>
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>{filteredClients.length} clientes</span>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1s infinite' }}>⏳</div>
            <p>Cargando...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
            <p>{searchTerm ? 'No se encontraron clientes' : 'Agrega tu primer cliente'}</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>NIT</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(c => (
                  <tr key={c.id}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={styles.clientAvatar}>{c.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{c.name}</div>
                          {c.address && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{c.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{c.phone || <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>}</td>
                    <td style={styles.td}>{c.email || <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>}</td>
                    <td style={styles.td}>{c.nit || <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => viewHistory(c)} title="Ver Historial">📜</button>
                        <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => handleEdit(c)} title="Editar">✏️</button>
                        <button style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }} onClick={() => handleDelete(c.id)} title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => resetForm()}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingId ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}</h3>
              <button style={styles.modalClose} onClick={() => resetForm()}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Nombre *</label>
                  <input type="text" style={styles.input} placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Teléfono</label>
                    <input type="tel" style={styles.input} placeholder="Ej: 70012345" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>NIT</label>
                    <input type="text" style={styles.input} placeholder="NIT (opcional)" value={nit} onChange={e => setNit(e.target.value)} />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Email</label>
                  <input type="email" style={styles.input} placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Dirección</label>
                  <input type="text" style={styles.input} placeholder="Dirección (opcional)" value={address} onChange={e => setAddress(e.target.value)} />
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

      {/* Modal Historial */}
      {showHistoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowHistoryModal(false)}>
          <div style={{ ...styles.modal, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📜 Historial: {selectedClientName}</h3>
              <button style={styles.modalClose} onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div style={{ ...styles.modalBody, maxHeight: '400px', overflowY: 'auto' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>Cargando historial...</div>
              ) : clientHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>No hay compras registradas.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Items</th>
                      <th style={{ textAlign: 'right', padding: '10px', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientHistory.map(sale => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                          {sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString('es-BO') : '-'}
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '13px', color: 'white' }}>
                          {sale.items?.length || 0} productos
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 'bold', color: '#10b981', textAlign: 'right' }}>
                          {sale.amount ? `Bs ${sale.amount.toFixed(2)}` : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowHistoryModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
