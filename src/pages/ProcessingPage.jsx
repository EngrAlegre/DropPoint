import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProcessingPage.css';

function ProcessingPage() {
  const navigate = useNavigate();

  return (
    <div className="processing-page">
      <header className="page-header">
        <div className="header-info">
          <div className="header-avatar">👤</div>
          <div>
            <h2>Processing</h2>
            <p>Please wait while we process your request</p>
          </div>
        </div>
      </header>

      <div className="processing-content">
        <div className="processing-icon">⏳</div>
        
        <div className="processing-info">
          <h3>Processing Your Request</h3>
          <p>This may take a few moments...</p>
        </div>

        <div className="processing-status">
          <div className="status-item">
            <span className="status-icon">✓</span>
            <span>Step 1 Complete</span>
          </div>
          <div className="status-item">
            <span className="status-icon">⏳</span>
            <span>Step 2 Processing...</span>
          </div>
          <div className="status-item">
            <span className="status-icon">○</span>
            <span>Step 3 Pending</span>
          </div>
        </div>

        <div className="processing-buttons">
          <button className="button-primary" onClick={() => navigate('/store')}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProcessingPage;

