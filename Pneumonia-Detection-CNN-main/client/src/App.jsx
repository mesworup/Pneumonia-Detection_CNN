import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import StatsTicker from './components/StatsTicker';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Component to handle /login and /register redirects
const AuthRedirect = ({ mode }) => {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    openAuthModal(mode);
    navigate('/', { replace: true });
  }, [mode, openAuthModal, navigate]);

  return null;
};

function AppContent() {
  const location = useLocation();
  // We no longer need to hide navbar since these pages redirect, but keeping logic just in case
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="app">
      {!hideNavbar && <Navbar />}
      <AuthModal />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <StatsTicker />
            <Services />
          </>
        } />
        <Route path="/login" element={<AuthRedirect mode="login" />} />
        <Route path="/register" element={<AuthRedirect mode="register" />} />

        {/* Protected Routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor-dashboard" element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/patient-dashboard" element={
          <ProtectedRoute roles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute roles={['admin', 'doctor', 'patient']}>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>

      {/* Footer Placeholder */}
      <footer style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', textAlign: 'center', marginTop: 'auto' }}>
        <p>© {new Date().getFullYear()} PneumoDetect. All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;