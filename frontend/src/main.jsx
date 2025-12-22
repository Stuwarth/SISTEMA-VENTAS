import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Clients from './pages/Clients'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Providers from './pages/Providers'
import Purchases from './pages/Purchases'
import StockAlerts from './pages/StockAlerts'
import AccountsReceivable from './pages/AccountsReceivable'
import Settings from './pages/Settings'

import Cashbox from './pages/Cashbox'
import PendingDifferences from './pages/PendingDifferences'
import ActivityLog from './pages/ActivityLog'

import './tailwind.css'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Login />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="providers" element={<Providers />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="stock-alerts" element={<StockAlerts />} />
          <Route path="clients" element={<Clients />} />
          <Route path="sales" element={<Sales />} />
          <Route path="accounts-receivable" element={<AccountsReceivable />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="cashbox" element={<Cashbox />} />
          <Route path="pending-differences" element={<PendingDifferences />} />
          <Route path="activity-log" element={<ActivityLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

