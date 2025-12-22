import React, { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth'

function showToast(msg, type = 'info') {
  const el = document.createElement('div')
  el.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px; font-family: system-ui;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : ''}
    ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : ''}
    ${type === 'warning' ? 'background: linear-gradient(135deg, #f59e0b, #d97706); color: white;' : ''}
    ${type === 'info' ? 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;' : ''}
  `
  el.innerHTML = `${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} ${msg}`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }, // Header wrap
  title: { color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' },
  statCard: {
    background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  statIcon: {
    width: '48px', height: '48px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px',
  },
  statValue: { color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '4px' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  searchRow: { display: 'flex', gap: '16px', marginBottom: '24px' },
  searchInput: {
    flex: 1, maxWidth: '400px', padding: '14px 20px 14px 48px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: 'white', fontSize: '15px',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px',
    borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none',
  },
  btnPrimary: { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' },
  btnSecondary: { background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
  btnDanger: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  btnWarning: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  btnSuccess: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  btnSmall: { padding: '8px 14px', fontSize: '13px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  cardHeader: {
    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  cardTitle: { color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' },
  cardBody: { padding: '24px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '14px 16px', color: 'rgba(255,255,255,0.5)',
    fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '14px' },
  badge: { display: 'inline-flex', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  badgeSuccess: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  badgeWarning: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  badgeDanger: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
  badgePrimary: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(180deg, #1e293b, #0f172a)', borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '500px', overflow: 'hidden',
  },
  modalHeader: {
    padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  modalTitle: { color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 },
  modalClose: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' },
  modalBody: { padding: '28px' },
  modalFooter: { padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  inputGroup: { marginBottom: '20px' },
  inputLabel: { display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' },
  input: { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px' },
  emptyState: { textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.4)' },
  alert: { padding: '16px 20px', borderRadius: '12px', marginBottom: '20px' },
  alertWarning: { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
  alertInfo: { background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#94a3b8' },
}

export default function Users() {
  const navigate = useNavigate()
  const { user, userData } = useOutletContext() || {}

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('vendedor')
  const [creating, setCreating] = useState(false)
  const [editingUid, setEditingUid] = useState(null)
  const [editRole, setEditRole] = useState('')

  const tenantId = userData?.tenantId
  const currentUserRole = userData?.role
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'

  useEffect(() => {
    if (!tenantId) return
    const q = query(collection(db, 'users'), where('tenantId', '==', tenantId))
    const unsub = onSnapshot(q, snap => {
      const arr = []
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }))
      setUsers(arr)
      setLoading(false)
    })
    return () => unsub()
  }, [tenantId])

  const resetForm = () => { setNewEmail(''); setNewPassword(''); setNewRole('vendedor'); setShowModal(false) }

  const createUser = async (e) => {
    e.preventDefault()
    if (!newEmail || !newPassword) return showToast('Email y contraseña requeridos', 'error')
    if (newPassword.length < 6) return showToast('Mínimo 6 caracteres', 'error')

    setCreating(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, newEmail, newPassword)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: newEmail, role: newRole, tenantId, disabled: false, createdAt: new Date()
      })
      showToast('Usuario creado. Sesión cerrada.', 'success')
      resetForm()
      window.location.href = '/login'
    } catch (err) {
      showToast(err.code === 'auth/email-already-in-use' ? 'Email ya registrado' : err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const handlePasswordChange = async (uid, email) => {
    if (email.includes('example') || email.includes('test')) {
      const newPass = prompt('Nueva contraseña para ' + email + ':')
      if (!newPass || newPass.length < 6) return showToast('Contraseña inválida', 'error')
      await updateDoc(doc(db, 'users', uid), { tempPassword: newPass })
      showToast('Contraseña temporal guardada', 'success')
      return
    }
    if (!confirm(`¿Enviar email de recuperación a ${email}?`)) return
    await sendPasswordResetEmail(auth, email)
    showToast('Email enviado', 'success')
  }

  const toggleUserAccess = async (uid, email, disabled) => {
    if (!confirm(`¿${disabled ? 'Habilitar' : 'Bloquear'} a ${email}?`)) return
    await updateDoc(doc(db, 'users', uid), { disabled: !disabled })
    showToast(disabled ? 'Usuario habilitado' : 'Usuario bloqueado', 'success')
  }

  const saveRole = async (uid) => {
    if (editRole === 'owner' && currentUserRole !== 'owner') {
      showToast('Solo el dueño puede asignar owner', 'error')
      setEditingUid(null)
      return
    }
    await updateDoc(doc(db, 'users', uid), { role: editRole })
    setEditingUid(null)
    showToast('Rol actualizado', 'success')
  }

  const removeUser = async (uid, email, role) => {
    if (role === 'owner') return showToast('No puedes eliminar al dueño', 'error')
    if (!confirm(`¿Eliminar a ${email}?`)) return
    await deleteDoc(doc(db, 'users', uid))
    showToast('Usuario eliminado', 'success')
  }

  const roleOptions = currentUserRole === 'owner'
    ? [{ value: 'vendedor', label: 'Vendedor' }, { value: 'admin', label: 'Administrador' }, { value: 'owner', label: 'Dueño' }]
    : [{ value: 'vendedor', label: 'Vendedor' }, { value: 'admin', label: 'Administrador' }]

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!user || !tenantId) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <p>Debes iniciar sesión.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <p>No tienes permisos.</p>
          <button style={{ ...styles.btn, ...styles.btnSecondary, marginTop: '16px' }} onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <style>{`input::placeholder,select option{color:rgba(255,255,255,0.3)} select option{background:#1e293b;color:white}`}</style>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 Usuarios</h1>
          <p style={styles.subtitle}>Gestiona los empleados del sistema</p>
        </div>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowModal(true)}>+ Nuevo Usuario</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))' }}>👥</div>
          <div style={styles.statValue}>{users.length}</div>
          <div style={styles.statLabel}>Total</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' }}>✅</div>
          <div style={{ ...styles.statValue, color: '#10b981' }}>{users.filter(u => !u.disabled).length}</div>
          <div style={styles.statLabel}>Activos</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))' }}>🚫</div>
          <div style={{ ...styles.statValue, color: '#ef4444' }}>{users.filter(u => u.disabled).length}</div>
          <div style={styles.statLabel}>Bloqueados</div>
        </div>
      </div>

      <div style={styles.searchRow}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input type="text" style={styles.searchInput} placeholder="Buscar usuarios..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}><span>📋</span> Lista de Usuarios</div>
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>{filteredUsers.length}</span>
        </div>

        {loading ? (
          <div style={styles.emptyState}><div style={{ fontSize: '48px' }}>⏳</div><p>Cargando...</p></div>
        ) : filteredUsers.length === 0 ? (
          <div style={styles.emptyState}><div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div><p>No hay usuarios</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ opacity: u.disabled ? 0.5 : 1 }}>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{u.email}</td>
                    <td style={styles.td}>
                      {editingUid === u.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select style={{ ...styles.select, width: '120px', padding: '8px' }} value={editRole} onChange={e => setEditRole(e.target.value)}>
                            {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <button style={{ ...styles.btn, ...styles.btnSuccess, ...styles.btnSmall }} onClick={() => saveRole(u.id)}>✓</button>
                          <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => setEditingUid(null)}>✕</button>
                        </div>
                      ) : (
                        <span style={{ ...styles.badge, ...(u.role === 'owner' ? styles.badgeSuccess : u.role === 'admin' ? styles.badgePrimary : styles.badgeWarning) }}>
                          {u.role === 'owner' ? '👑 Dueño' : u.role === 'admin' ? '⭐ Admin' : '👤 Vendedor'}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(u.disabled ? styles.badgeDanger : styles.badgeSuccess) }}>
                        {u.disabled ? '🚫 Bloqueado' : '✅ Activo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => { setEditingUid(u.id); setEditRole(u.role || 'vendedor') }} title="Cambiar rol">✏️</button>
                        <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => handlePasswordChange(u.id, u.email)} title="Contraseña">🔑</button>
                        <button style={{ ...styles.btn, ...(u.disabled ? styles.btnSuccess : styles.btnWarning), ...styles.btnSmall }} onClick={() => toggleUserAccess(u.id, u.email, u.disabled)}>{u.disabled ? '✅' : '🚫'}</button>
                        {u.role !== 'owner' && <button style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }} onClick={() => removeUser(u.id, u.email, u.role)}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: '24px' }}>
        <div style={styles.cardBody}>
          <div style={{ ...styles.alert, ...styles.alertInfo }}>
            <strong>ℹ️ Roles:</strong> <strong>Vendedor</strong> → Ventas | <strong>Admin</strong> → Productos, clientes, usuarios | <strong>Dueño</strong> → Control total
          </div>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => resetForm()}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👤 Nuevo Usuario</h3>
              <button style={styles.modalClose} onClick={resetForm}>×</button>
            </div>
            <form onSubmit={createUser}>
              <div style={styles.modalBody}>
                <div style={{ ...styles.alert, ...styles.alertWarning }}>⚠️ Al crear usuario, se cerrará tu sesión.</div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Email *</label>
                  <input type="email" style={styles.input} placeholder="correo@ejemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Contraseña *</label>
                  <input type="text" style={styles.input} placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Rol</label>
                  <select style={styles.select} value={newRole} onChange={e => setNewRole(e.target.value)}>
                    {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={resetForm}>Cancelar</button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }} disabled={creating}>{creating ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
