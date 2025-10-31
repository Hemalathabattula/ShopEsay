import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'

// Admin-only components
import AdminPortalLogin from './pages/AdminPortalLogin'
import AdminPortalDashboard from './pages/AdminPortalDashboard'
import { useAuthStore } from './store/authStore'

// Admin Portal App Component
const AdminPortalApp = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
        <Routes>
          {/* Admin Login Route */}
          <Route 
            path="/admin-portal-login" 
            element={
              isAuthenticated && user?.role?.includes('ADMIN') ? 
                <Navigate to="/admin-portal" replace /> : 
                <AdminPortalLogin />
            } 
          />
          
          {/* Admin Dashboard Route */}
          <Route 
            path="/admin-portal" 
            element={
              isAuthenticated && user?.role?.includes('ADMIN') ? 
                <AdminPortalDashboard /> : 
                <Navigate to="/admin-portal-login" replace />
            } 
          />
          
          {/* Default Route - Redirect to Login */}
          <Route path="/" element={<Navigate to="/admin-portal-login" replace />} />
          
          {/* Catch All - Redirect to Login */}
          <Route path="*" element={<Navigate to="/admin-portal-login" replace />} />
        </Routes>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#fbbf24',
                secondary: '#581c87',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

// Initialize the admin portal
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminPortalApp />
  </React.StrictMode>,
)
