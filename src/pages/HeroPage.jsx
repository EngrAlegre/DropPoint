import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroPage.css';

function HeroPage() {
  const navigate = useNavigate();

  return (
    <div className="hero-page">
      <div className="hero-container">
        <div className="hero-image-placeholder">
          <img src="/logo.jpg" alt="DropPoint Logo" className="hero-logo" />
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">Welcome to DropPoint</h1>
          <p className="hero-subtitle">Smart Waste Management System</p>
          <p className="hero-description">
            Earn points by properly disposing of waste. Redeem points for school supplies and more!
          </p>
        </div>

        <div className="hero-cta">
          <button 
            className="cta-button"
            onClick={() => navigate('/login')}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeroPage;

