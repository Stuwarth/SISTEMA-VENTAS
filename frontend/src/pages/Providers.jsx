import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function showToast(msg, type = 'info') {
  const el = document.createElement('div')
  el.style.cssText = `position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;'}`
  el.textContent = `${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} ${msg}`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', padding: '32px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  searchInput: { flex: 1, maxWidth: '400px', padding: '14px 20px 14px 48px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none' },
  btnPrimary: { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
  btnSecondary: { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
  btnDanger: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  btnSmall: { padding: '8px 14px', fontSize: '13px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
  badge: { display: 'inline-flex', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  badgePrimary: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'linear-gradient(180deg, #1e293b, #0f172a)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '500px', overflow: 'hidden' },
  modalHeader: { padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 },
  modalClose: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' },
  modalBody: { padding: '28px' },
  modalFooter: { padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  inputGroup: { marginBottom: '20px' },
  inputLabel: { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' },
  input: { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px', boxSizing: 'border-box' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
}

export default function Providers() {
  const navigate = useNavigate()
  const { user, userData } = useOutletContext() || {}
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const tenantId = userData?.tenantId

  useEffect(() => {
    if (!tenantId) return
    const unsub = onSnapshot(query(collection(db, 'providers'), where('tenantId', '==', tenantId)), snap => {
      const arr = []
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }))
      setProviders(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const resetForm = () => { setName(''); setPhone(''); setEmail(''); setAddress(''); setEditingId(null); setShowModal(false) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name) return showToast('Nombre requerido', 'error')
    const data = { name, phone, email, address, tenantId, updatedAt: serverTimestamp() }
    try {
      if (editingId) {
        await updateDoc(doc(db, 'providers', editingId), data)
        showToast('Proveedor actualizado', 'success')
      } else {
        await addDoc(collection(db, 'providers'), { ...data, createdAt: serverTimestamp() })
        showToast('Proveedor creado', 'success')
      }
      resetForm()
    } catch (err) { showToast('Error: ' + err.message, 'error') }
  }

  const handleEdit = (p) => { setEditingId(p.id); setName(p.name || ''); setPhone(p.phone || ''); setEmail(p.email || ''); setAddress(p.address || ''); setShowModal(true) }
  const handleDelete = async (id) => { if (!confirm('¿Eliminar proveedor?')) return; await deleteDoc(doc(db, 'providers', id)); showToast('Eliminado', 'success') }
  const filteredProviders = providers.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!user || !tenantId) return <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', color: 'white' }}><div style={{ fontSize: '48px' }}>🔒</div><p>Inicia sesión.</p></div></div>

  return (
    <div style={styles.container}>
      <style>{`input::placeholder{color:rgba(255,255,255,0.3)}`}</style>
      <div style={styles.header}>
        <div><h1 style={styles.title}>🏭 Proveedores</h1><p style={styles.subtitle}>Directorio de proveedores</p></div>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowModal(true)}>+ Nuevo Proveedor</button>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input type="text" style={styles.searchInput} placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}><div style={styles.cardTitle}><span>📋</span> Lista</div><span style={{ ...styles.badge, ...styles.badgePrimary }}>{filteredProviders.length}</span></div>
        {loading ? <div style={styles.emptyState}>⏳ Cargando...</div> : filteredProviders.length === 0 ? <div style={styles.emptyState}><div style={{ fontSize: '64px', marginBottom: '16px' }}>🏭</div><p>Sin proveedores</p></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Nombre</th><th style={styles.th}>Teléfono</th><th style={styles.th}>Email</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {filteredProviders.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{p.name}</td>
                    <td style={styles.td}>{p.phone || '-'}</td>
                    <td style={styles.td}>{p.email || '-'}</td>
                    <td style={styles.td}><div style={{ display: 'flex', gap: '8px' }}><button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => handleEdit(p)}>✏️</button><button style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }} onClick={() => handleDelete(p.id)}>🗑️</button></div></td>
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
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>{editingId ? '✏️ Editar' : '➕ Nuevo'} Proveedor</h3><button style={styles.modalClose} onClick={resetForm}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.inputGroup}><label style={styles.inputLabel}>Nombre *</label><input type="text" style={styles.input} placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required /></div>
                <div style={styles.inputGroup}><label style={styles.inputLabel}>Teléfono</label><input type="tel" style={styles.input} placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                <div style={styles.inputGroup}><label style={styles.inputLabel}>Email</label><input type="email" style={styles.input} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div style={styles.inputGroup}><label style={styles.inputLabel}>Dirección</label><input type="text" style={styles.input} placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} /></div>
              </div>
              <div style={styles.modalFooter}><button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={resetForm}>Cancelar</button><button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{editingId ? 'Guardar' : 'Crear'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
