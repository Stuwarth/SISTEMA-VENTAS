import React, { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth'

export default function ManageUsers({ tenantId, currentUserRole }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Form para crear usuario
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('vendedor')
  const [creating, setCreating] = useState(false)

  // Editar rol
  const [editingUid, setEditingUid] = useState(null)
  const [editRole, setEditRole] = useState('')

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

  // Crear usuario - método alternativo usando el email del admin temporalmente
  const createUser = async () => {
    if (!newEmail || !newPassword) return alert('Email y contraseña requeridos')
    if (newPassword.length < 6) return alert('La contraseña debe tener al menos 6 caracteres')
    
    setCreating(true)
    try {
      // Guardar credenciales actuales
      const currentUser = auth.currentUser
      const currentEmail = currentUser?.email
      
      // Crear el nuevo usuario
      const cred = await createUserWithEmailAndPassword(auth, newEmail, newPassword)
      const newUid = cred.user.uid
      
      // Crear documento en Firestore
      await setDoc(doc(db, 'users', newUid), {
        email: newEmail,
        role: newRole,
        tenantId: tenantId,
        disabled: false,
        createdAt: new Date()
      })
      
      alert(`✅ Usuario creado exitosamente!\n\nEmail: ${newEmail}\nContraseña: ${newPassword}\nRol: ${newRole}\n\n⚠️ IMPORTANTE: Se ha cerrado tu sesión. Vuelve a iniciar sesión con tu cuenta de administrador.`)
      
      setNewEmail('')
      setNewPassword('')
      
      // Redirigir al login
      window.location.href = '/'
      
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/email-already-in-use') {
        alert('❌ Este email ya está registrado en el sistema')
      } else if (err.code === 'auth/weak-password') {
        alert('❌ La contraseña es muy débil. Usa al menos 6 caracteres')
      } else {
        alert('❌ Error: ' + err.message)
      }
    } finally {
      setCreating(false)
    }
  }

  // Cambiar contraseña - enviar email de recuperación
  const handlePasswordChange = async (uid, email, role) => {
    // Para emails de PRUEBA (inventados), mostrar opción de pedir nueva contraseña al admin
    const isTestEmail = email.includes('example.com') || email.includes('test') || email.includes('demo')
    
    if (isTestEmail) {
      const newPass = prompt(
        `⚠️ "${email}" parece ser un email de prueba.\n\n` +
        `Ingresa la NUEVA CONTRASEÑA para este empleado:\n` +
        `(El empleado deberá usar esta contraseña para entrar)`
      )
      if (!newPass || newPass.length < 6) {
        alert('Contraseña inválida o cancelado (mínimo 6 caracteres)')
        return
      }
      
      // Guardar la nueva contraseña temporalmente en Firestore para que el admin la comunique
      await updateDoc(doc(db, 'users', uid), { 
        tempPassword: newPass,
        tempPasswordSetAt: new Date(),
        tempPasswordSetBy: auth.currentUser?.email 
      })
      
      alert(
        `✅ Nueva contraseña guardada!\n\n` +
        `Email: ${email}\n` +
        `Contraseña: ${newPass}\n\n` +
        `📋 IMPORTANTE: Comunica esta contraseña al empleado personalmente o por mensaje.\n\n` +
        `Nota: Para que funcione, el empleado debe usar "¿Olvidaste tu contraseña?" en el login, ` +
        `o puedes eliminar y recrear el usuario con la nueva contraseña.`
      )
      return
    }
    
    // Para emails REALES, enviar email de recuperación
    if (!confirm(`¿Enviar email de recuperación de contraseña a ${email}?`)) return
    
    try {
      await sendPasswordResetEmail(auth, email)
      alert(`✅ Email enviado a ${email}\n\nEl empleado debe revisar su correo para cambiar su contraseña.`)
    } catch (err) {
      alert('❌ Error: ' + err.message)
    }
  }

  // Deshabilitar/habilitar usuario (usando campo en Firestore)
  const toggleUserAccess = async (uid, email, currentlyDisabled) => {
    const action = currentlyDisabled ? 'HABILITAR' : 'DESHABILITAR'
    if (!confirm(`¿${action} el acceso de ${email}?`)) return
    
    await updateDoc(doc(db, 'users', uid), { disabled: !currentlyDisabled })
    alert(`✅ Usuario ${currentlyDisabled ? 'habilitado' : 'deshabilitado'}.\n\n${currentlyDisabled ? 'Ahora puede iniciar sesión.' : 'Ya no podrá acceder al sistema.'}`)
  }

  // Guardar rol (con restricción: solo owner puede asignar owner)
  const saveRole = async (uid) => {
    if (editRole === 'owner' && currentUserRole !== 'owner') {
      alert('❌ Solo el dueño (owner) puede asignar el rol de owner a otro usuario')
      setEditingUid(null)
      return
    }
    await updateDoc(doc(db, 'users', uid), { role: editRole })
    setEditingUid(null)
    setEditRole('')
    alert('✅ Rol actualizado')
  }

  // Eliminar usuario del tenant
  const removeUserFromTenant = async (uid, email, role) => {
    if (role === 'owner') {
      alert('❌ No puedes eliminar al dueño del negocio')
      return
    }
    if (!confirm(`¿Eliminar a ${email} del sistema?\n\nEsto eliminará su perfil y ya no podrá acceder.`)) return
    await deleteDoc(doc(db, 'users', uid))
    alert(`✅ ${email} ha sido eliminado del sistema`)
  }

  if (loading) return <div>Cargando usuarios...</div>

  // Filtrar opciones de rol según el rol del usuario actual
  const roleOptions = currentUserRole === 'owner' 
    ? [{ value: 'vendedor', label: 'Vendedor' }, { value: 'admin', label: 'Admin' }, { value: 'owner', label: 'Owner' }]
    : [{ value: 'vendedor', label: 'Vendedor' }, { value: 'admin', label: 'Admin' }]

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, marginTop: 24, borderRadius: 8 }}>
      <h3>👥 Gestión de Usuarios / Empleados</h3>

      {/* Formulario crear usuario */}
      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>➕ Crear nuevo empleado</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="email"
            placeholder="Email del empleado"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            style={{ padding: 8, flex: 1, minWidth: 180 }}
          />
          <input
            type="text"
            placeholder="Contraseña inicial"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={{ padding: 8, flex: 1, minWidth: 140 }}
          />
          <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: 8 }}>
            {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={createUser} disabled={creating} style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {creating ? 'Creando...' : '+ Crear empleado'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0 0' }}>
          💡 Después de crear el empleado, deberás volver a iniciar sesión con tu cuenta.
        </p>
      </div>

      {/* Lista de usuarios */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Email</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Rol</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Estado</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan="4" style={{ padding: 16, textAlign: 'center', color: '#888' }}>No hay empleados registrados</td></tr>
          )}
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #ddd', opacity: u.disabled ? 0.5 : 1 }}>
              <td style={{ padding: 8 }}>{u.email}</td>
              <td style={{ padding: 8 }}>
                {editingUid === u.id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ padding: 4 }}>
                      {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button onClick={() => saveRole(u.id)} style={{ padding: '4px 8px' }}>✓</button>
                    <button onClick={() => setEditingUid(null)} style={{ padding: '4px 8px' }}>✗</button>
                  </div>
                ) : (
                  <span
                    style={{
                      background: u.role === 'owner' ? '#4caf50' : u.role === 'admin' ? '#2196f3' : '#ff9800',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12
                    }}
                  >
                    {u.role === 'owner' ? '👑 Owner' : u.role === 'admin' ? '⭐ Admin' : '👤 Vendedor'}
                  </span>
                )}
              </td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                <span style={{
                  background: u.disabled ? '#f44336' : '#4caf50',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11
                }}>
                  {u.disabled ? '🚫 Bloqueado' : '✅ Activo'}
                </span>
              </td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setEditingUid(u.id); setEditRole(u.role || 'vendedor') }}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    title="Cambiar rol"
                  >
                    ✏️ Rol
                  </button>
                  <button
                    onClick={() => handlePasswordChange(u.id, u.email, u.role)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    title="Cambiar contraseña"
                  >
                    🔑 Contraseña
                  </button>
                  <button
                    onClick={() => toggleUserAccess(u.id, u.email, u.disabled)}
                    style={{ padding: '4px 8px', fontSize: 12, background: u.disabled ? '#4caf50' : '#ff9800', color: '#fff', border: 'none', borderRadius: 4 }}
                    title={u.disabled ? 'Habilitar acceso' : 'Bloquear acceso'}
                  >
                    {u.disabled ? '✅ Activar' : '🚫 Bloquear'}
                  </button>
                  {u.role !== 'owner' && (
                    <button
                      onClick={() => removeUserFromTenant(u.id, u.email, u.role)}
                      style={{ padding: '4px 8px', fontSize: 12, background: '#f44336', color: '#fff', border: 'none', borderRadius: 4 }}
                      title="Eliminar usuario"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, padding: 12, background: '#e3f2fd', borderRadius: 6, fontSize: 13 }}>
        <strong>ℹ️ Ayuda:</strong><br/>
        • <strong>Resetear contraseña:</strong> Envía un email al empleado para que cree una nueva contraseña.<br/>
        • <strong>Bloquear:</strong> Impide que el empleado acceda al sistema (sin eliminarlo).<br/>
        • <strong>Eliminar:</strong> Remueve al empleado del sistema permanentemente.
      </div>
    </div>
  )
}
