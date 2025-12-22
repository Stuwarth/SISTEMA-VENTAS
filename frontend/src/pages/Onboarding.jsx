import React, { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'

function showToast(msg, type = 'info') {
  const el = document.createElement('div')
  el.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    padding: 16px 24px; border-radius: 12px;
    font-weight: 600; font-size: 14px; font-family: system-ui;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669); color: white;' : ''}
    ${type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' : ''}
  `
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: '500px',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
  },
  header: {
    padding: '40px 32px 24px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  icon: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    margin: '0 auto 20px',
    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  body: {
    padding: '32px',
  },
  inputGroup: {
    marginBottom: '24px',
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
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '16px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  },
  btn: {
    width: '100%',
    padding: '18px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '32px',
  },
  step: {
    width: '40px',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.1)',
  },
  stepActive: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
  },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useOutletContext?.() || {}
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!businessName || !businessType) return showToast('Completa todos los campos', 'error')

    setLoading(true)
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('No estás autenticado')

      const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await setDoc(doc(db, 'tenants', tenantId), {
        name: businessName,
        type: businessType,
        owner: uid,
        createdAt: serverTimestamp()
      })

      await setDoc(doc(db, 'users', uid), {
        email: auth.currentUser.email,
        tenantId,
        role: 'owner',
        createdAt: serverTimestamp()
      }, { merge: true })

      showToast('¡Negocio configurado!', 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus, select:focus { border-color: #10b981 !important; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); outline: none; }
        select option { background: #1e293b; color: white; }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🏪</div>
          <h1 style={styles.title}>Configura tu Negocio</h1>
          <p style={styles.subtitle}>
            Solo necesitamos algunos datos para personalizar tu experiencia
          </p>
        </div>

        <div style={styles.body}>
          <div style={styles.stepIndicator}>
            <div style={{ ...styles.step, ...styles.stepActive }}></div>
            <div style={styles.step}></div>
            <div style={styles.step}></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>🏢 Nombre de tu Negocio</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Ej: Mi Tienda, Farmacia Central..."
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>📦 Tipo de Negocio</label>
              <select
                style={styles.select}
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                required
              >
                <option value="">Selecciona una opción...</option>
                <option value="tienda">🛒 Tienda / Minimarket</option>
                <option value="farmacia">💊 Farmacia</option>
                <option value="restaurante">🍔 Restaurante / Cafetería</option>
                <option value="ferreteria">🔧 Ferretería</option>
                <option value="ropa">👕 Ropa / Boutique</option>
                <option value="electronica">📱 Electrónica</option>
                <option value="servicios">⚡ Servicios</option>
                <option value="otro">📋 Otro</option>
              </select>
            </div>

            <button
              type="submit"
              style={{ ...styles.btn, ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? '⏳ Configurando...' : '🚀 Comenzar a Vender'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
