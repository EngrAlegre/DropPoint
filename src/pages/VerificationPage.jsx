import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VerificationPage.css';

function VerificationPage() {
  const navigate = useNavigate();

  return (
    <div className="verification-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/selection')}>
          ← Back
        </button>
        <div className="header-info">
          <div className="header-avatar">👤</div>
          <div>
            <h2>Verification</h2>
            <p>Please verify your information</p>
          </div>
        </div>
      </header>

      <div className="verification-content">
        <div className="verification-icon">📋</div>
        
        <div className="verification-form">
          <div className="form-group">
            <label>Field 1</label>
            <input type="text" placeholder="Enter information" />
          </div>
          
          <div className="form-group">
            <label>Field 2</label>
            <input type="text" placeholder="Enter information" />
          </div>

          <div className="upload-section">
            <div className="upload-placeholder">
              <p>Upload Document</p>
              <span>Click to upload</span>
            </div>
          </div>
        </div>

        <div className="verification-buttons">
          <button className="button-secondary" onClick={() => navigate('/selection')}>
            Cancel
          </button>
          <button className="button-primary" onClick={() => navigate('/processing')}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;

