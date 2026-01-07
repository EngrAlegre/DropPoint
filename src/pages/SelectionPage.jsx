import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectionPage.css';

function SelectionPage() {
  const navigate = useNavigate();

  const options = [
    { id: 1, title: 'Option 1', description: 'Description for option 1' },
    { id: 2, title: 'Option 2', description: 'Description for option 2' },
    { id: 3, title: 'Option 3', description: 'Description for option 3' },
    { id: 4, title: 'Option 4', description: 'Description for option 4' },
  ];

  const handleSelect = (option, needsVerification) => {
    if (needsVerification) {
      navigate('/verification');
    } else {
      navigate('/processing');
    }
  };

  return (
    <div className="selection-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate('/login')}>
          ← Back
        </button>
        <div className="header-info">
          <div className="header-avatar">👤</div>
          <div>
            <h2>Header Title</h2>
            <p>Subtitle</p>
          </div>
        </div>
      </header>

      <div className="selection-content">
        <div className="options-grid">
          {options.map((option, index) => (
            <div 
              key={option.id} 
              className="option-card"
              onClick={() => handleSelect(option, index >= 2)}
            >
              <div className="option-icon">●</div>
              <h3>{option.title}</h3>
              <p>{option.description}</p>
              <div className="select-indicator">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelectionPage;

