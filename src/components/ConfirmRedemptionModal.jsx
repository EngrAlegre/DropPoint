import React from 'react';
import './Modal.css';

function ConfirmRedemptionModal({ item, currentPoints, onConfirm, onCancel, loading = false }) {
  const afterRedemption = currentPoints - item.points;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}>×</button>
        
        <div className="modal-icon success">
          <div className="icon-circle">
            ✓
          </div>
        </div>

        <h2 className="modal-title">Confirm Redemption</h2>

        <div className="modal-item-info">
          <h3 className="item-name">{item.name}</h3>
          <span className="item-category-tag">{item.category}</span>
        </div>

        <div className="points-breakdown">
          <div className="points-row">
            <span className="points-label">
              <span className="points-icon-small">🍃</span>
              Cost:
            </span>
            <span className="points-value-cost">{item.points} points</span>
          </div>
          <div className="points-row">
            <span className="points-label">Current Balance:</span>
            <span className="points-value-normal">{currentPoints} points</span>
          </div>
          <div className="points-row">
            <span className="points-label">After Redemption:</span>
            <span className="points-value-normal">{afterRedemption} points</span>
          </div>
        </div>

        <p className="confirmation-question">
          Are you sure you want to redeem this item?
        </p>

        <div className="modal-buttons">
          <button className="button-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="button-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Redemption'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmRedemptionModal;

