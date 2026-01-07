import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, currentUser, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/store', { replace: true });
    }
  }, [currentUser, loading, navigate]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        // Signup validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        if (!formData.name.trim()) {
          setError('Please enter your name');
          setIsSubmitting(false);
          return;
        }
        await signup(formData.email, formData.password, { name: formData.name.trim() });
        // Success - user will be automatically logged in and redirected
      } else {
        await login(formData.email, formData.password);
        // Wait for auth state to update, then navigate
        // The useEffect will handle navigation when currentUser is set
      }
    } catch (err) {
      setError(isSignup ? 'Failed to sign up: ' + err.message : 'Failed to login: ' + err.message);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>

        <div className="login-logo">
          <div className="logo-circle">
            <span className="logo-icon">🎓</span>
          </div>
        </div>

        <h1 className="login-title">{isSignup ? 'Sign Up' : 'Login'}</h1>
        <p className="login-subtitle">
          {isSignup ? 'Create your DropPoint account' : 'Welcome back to DropPoint'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-group">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 6 : undefined}
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting 
              ? (isSignup ? 'Creating account...' : 'Logging in...') 
              : (isSignup ? 'Sign Up' : 'Login')
            }
          </button>
        </form>

        <p className="login-footer">
          {isSignup ? (
            <>
              Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); toggleMode(); }}>Login</a>
            </>
          ) : (
            <>
              Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); toggleMode(); }}>Sign up</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

