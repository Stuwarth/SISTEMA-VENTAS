import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { auth, db } from './firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { resolveStockAlert } from './utils/notifications'

// Importamos estilos globales pero añadiremos overrides para responsive crítico aquí
import './styles.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stockAlerts, setStockAlerts] = useState([])
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Detection for mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false) // Reset on desktop
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          setUserData(snap.data())
        }
      } else {
        setUserData(null)
      }
    })
    return () => unsub()
  }, [])

  // Subscribe to stock alerts
  useEffect(() => {
    if (!userData?.tenantId) return
    const q = query(collection(db, 'stock_alerts'), where('tenantId', '==', userData.tenantId), where('resolved', '==', false))
    const unsub = onSnapshot(q, snap => {
      const arr = []
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }))
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setStockAlerts(arr)
      if (arr.length > 0) setShowAlertsModal(true)
    })
    return () => unsub()
  }, [userData])

  // Fetch Business Settings
  const [business, setBusiness] = useState(null)
  useEffect(() => {
    if (!userData?.tenantId) return
    const unsub = onSnapshot(doc(db, 'settings', userData.tenantId), docSnap => {
      if (docSnap.exists()) {
        setBusiness(docSnap.data())
      } else {
        setBusiness({})
      }
    })
    return () => unsub()
  }, [userData])

  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/' || location.pathname === '/onboarding') {
    return <Outlet />
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const userInitials = userData?.email?.substring(0, 2).toUpperCase() || 'US'
  const userRole = userData?.role || 'usuario'
  const isAdmin = userRole === 'owner' || userRole === 'admin'

  // Styles Injection for Critical Responsive Behavior
  const responsiveStyles = {
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '260px',
      background: '#0f172a', // Dark theme consistent
      zIndex: 2000, // SUPER HIGH PRIORITY
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      boxShadow: (isMobile && sidebarOpen) ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.05)'
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : '260px', // Push content only on desktop
      minHeight: '100vh',
      width: '100%',
      transition: 'margin-left 0.3s ease'
    },
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 1900, // Below sidebar, above content
      opacity: sidebarOpen ? 1 : 0,
      pointerEvents: sidebarOpen ? 'auto' : 'none',
      transition: 'opacity 0.3s ease'
    },
    menuBtn: {
      display: isMobile ? 'flex' : 'none', // Force flex on mobile
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '8px',
      width: '40px',
      height: '40px',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#334155',
      marginRight: '16px',
      zIndex: 101 // Ensure clickable
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* Mobile Overlay */}
      <div style={responsiveStyles.overlay} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside style={responsiveStyles.sidebar} className="custom-scrollbar">
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
          <div>
            <h1 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 'bold' }}>VentasPro</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '1px' }}>POS SYSTEM</p>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div className="nav-section">
            <div className="nav-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Principal</div>
            <NavItem to="/dashboard" icon="🏠" label="Dashboard" onClick={() => setSidebarOpen(false)} />
          </div>

          <div className="nav-section" style={{ marginTop: '24px' }}>
            <div className="nav-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Inventario</div>
            <NavItem to="/products" icon="📦" label="Productos" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/providers" icon="🏷️" label="Proveedores" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/stock-alerts" icon="⚠️" label="Alertas Stock" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/purchases" icon="📥" label="Compras" onClick={() => setSidebarOpen(false)} />
          </div>

          <div className="nav-section" style={{ marginTop: '24px' }}>
            <div className="nav-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Ventas</div>
            <NavItem to="/sales" icon="🛒" label="Terminal Ventas" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/clients" icon="👥" label="Clientes" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/accounts-receivable" icon="💼" label="Ctas. por Cobrar" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/reports" icon="📈" label="Reportes" onClick={() => setSidebarOpen(false)} />
          </div>

          {isAdmin && (
            <div className="nav-section" style={{ marginTop: '24px' }}>
              <div className="nav-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>Admin</div>
              <NavItem to="/cashbox" icon="💵" label="Caja" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/pending-differences" icon="⚖️" label="Pendientes" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/users" icon="👤" label="Usuarios" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/settings" icon="⚙️" label="Configuración" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/activity-log" icon="📜" label="Auditoría" onClick={() => setSidebarOpen(false)} />
            </div>
          )}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{userInitials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData?.email}</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'capitalize' }}>{userRole}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px', color: '#ef4444' }} title="Salir">🚪</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={responsiveStyles.mainContent}>
        <header style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button style={responsiveStyles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{getPageTitle(location.pathname)}</h1>
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', display: isMobile ? 'none' : 'block' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Alertas Modal (Stock) */}
        {showAlertsModal && stockAlerts.length > 0 && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Alertas de Stock <span style={{ fontSize: '12px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>{stockAlerts.length}</span></h3>
                <button onClick={() => setShowAlertsModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {stockAlerts.map(a => (
                  <div key={a.id} style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontWeight: '600', color: '#b91c1c' }}>{a.productName}</div><div style={{ fontSize: '12px', color: '#7f1d1d' }}>Stock Actual: {a.newStock} (Min: {a.stockMin})</div></div>
                    <button onClick={() => resolveStockAlert({ alertId: a.id })} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #b91c1c', color: '#b91c1c', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Resolver</button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowAlertsModal(false); navigate('/stock-alerts') }} style={{ marginTop: '16px', width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Ver todas las alertas</button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
          <Outlet context={{ user, userData, business }} />
        </div>
      </main>
    </div>
  )
}

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        borderRadius: '8px', marginBottom: '4px', textDecoration: 'none',
        transition: 'all 0.2s',
        background: isActive ? '#2563eb' : 'transparent',
        color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
        fontWeight: isActive ? '600' : '500'
      })}
    >
      <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{icon}</span>
      {label}
    </NavLink>
  )
}

function getPageTitle(pathname) {
  const map = {
    '/dashboard': 'Resumen', '/products': 'Productos', '/clients': 'Clientes',
    '/sales': 'Punto de Venta', '/accounts-receivable': 'Cuentas x Cobrar',
    '/reports': 'Reportes', '/users': 'Usuarios', '/settings': 'Configuración',
    '/cashbox': 'Caja Chica', '/providers': 'Proveedores', '/purchases': 'Compras',
    '/stock-alerts': 'Alertas', '/pending-differences': 'Ajustes Pendientes',
    '/activity-log': 'Auditoría'
  }
  return map[pathname] || 'Dashboard'
}
