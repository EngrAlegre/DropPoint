import React, { useState } from 'react';
import './Modal.css';

function RedemptionSuccessModal({ item, verificationCode, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-icon success-large">
          <div className="icon-circle-large">
            <div className="shield-icon">🛡️</div>
            <div className="checkmark">✓</div>
          </div>
        </div>

        <h2 className="modal-title success-title">Redemption Successful!</h2>

        <div className="modal-item-info">
          <h3 className="item-name">{item.name}</h3>
          <span className="item-status-badge">Redeemed</span>
        </div>

        <div className="verification-code-box">
          <div className="code-header">
            <span className="shield-icon-small">🛡️</span>
            <span>Verification Code</span>
          </div>
          <div className="code-value">{verificationCode}</div>
          <p className="code-instruction">Show this code to collect your item</p>
          <button className="copy-code-button" onClick={handleCopyCode}>
            <span className="copy-icon">📋</span>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="warning-box">
          <span className="warning-icon">⚠️</span>
          <div>
            <div className="warning-title">One-Time Use Only</div>
            <p className="warning-text">
              This verification code can only be used once. Please save it or take a screenshot.
            </p>
          </div>
        </div>

        <button className="button-done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

export default RedemptionSuccessModal;

