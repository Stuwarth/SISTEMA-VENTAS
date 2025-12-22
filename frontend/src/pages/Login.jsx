import React, { useState } from 'react'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

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
    maxWidth: '420px',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
  },
  header: {
    padding: '40px 32px 24px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logo: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    margin: '0 auto 20px',
    boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
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
  },
  body: {
    padding: '32px',
  },
  alert: {
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  alertError: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
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
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '14px',
  },
  switchContainer: {
    textAlign: 'center',
    marginTop: '24px',
  },
  switchText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    cursor: 'pointer',
    marginLeft: '8px',
    fontWeight: '600',
    fontSize: '14px',
  },
  footer: {
    padding: '20px 32px',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '12px',
  },
}

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const login = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const uid = cred.user.uid
      const userDoc = await getDoc(doc(db, 'users', uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.disabled) {
          await auth.signOut()
          setError('Tu cuenta ha sido bloqueada. Contacta al administrador.')
          return
        }
        if (userData.tenantId) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
      } else {
        navigate('/onboarding')
      }
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email')
      } else if (e.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta')
      } else if (e.code === 'auth/invalid-email') {
        setError('Email inválido')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/onboarding')
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado')
      } else if (e.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async () => {
    if (!email) {
      setError('Ingresa tu email primero')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      alert('Se ha enviado un email para restablecer tu contraseña')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>📊</div>
          <h1 style={styles.title}>VentasPro</h1>
          <p style={styles.subtitle}>Sistema de Gestión de Ventas</p>
        </div>

        <div style={styles.body}>
          {error && (
            <div style={{ ...styles.alert, ...styles.alertError, animation: 'shake 0.3s ease' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={isRegister ? register : login}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email</label>
              <input
                type="email"
                style={styles.input}
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Contraseña</label>
              <input
                type="password"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {!isRegister && (
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button type="button" onClick={forgotPassword} style={styles.forgotLink}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              style={{ ...styles.btn, ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? '⏳ Cargando...' : (isRegister ? '🚀 Crear cuenta' : '🔓 Iniciar sesión')}
            </button>
          </form>

          <div style={styles.switchContainer}>
            <span style={styles.switchText}>
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            </span>
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              style={styles.switchBtn}
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          Sistema POS para PYMES • Hecho con ❤️
        </div>
      </div>
    </div>
  )
}
