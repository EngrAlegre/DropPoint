import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HeroPage from './pages/HeroPage';
import LoginPage from './pages/LoginPage';
import SelectionPage from './pages/SelectionPage';
import VerificationPage from './pages/VerificationPage';
import ProcessingPage from './pages/ProcessingPage';
import PointStore from './pages/PointStore';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>Loading...</div>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HeroPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/selection" element={<PrivateRoute><SelectionPage /></PrivateRoute>} />
      <Route path="/verification" element={<PrivateRoute><VerificationPage /></PrivateRoute>} />
      <Route path="/processing" element={<PrivateRoute><ProcessingPage /></PrivateRoute>} />
      <Route path="/store" element={<PrivateRoute><PointStore /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

