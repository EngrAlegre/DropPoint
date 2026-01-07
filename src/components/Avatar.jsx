import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import './Avatar.css';

function Avatar() {
  const { currentUser, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch user name from database
  useEffect(() => {
    if (!currentUser) {
      setUserName(null);
      return;
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserName(userData.name || userData.displayName || null);
      } else {
        setUserName(null);
      }
    });

    return () => {
      off(userRef);
    };
  }, [currentUser]);

  // Get user initials for avatar
  const getInitials = () => {
    if (userName) {
      return userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (currentUser?.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="avatar-container" ref={dropdownRef}>
      <button
        className="avatar-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className="avatar-circle">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Avatar" className="avatar-image" />
          ) : (
            <span className="avatar-initials">{getInitials()}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="avatar-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <div className="dropdown-avatar">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div className="dropdown-user-details">
                <div className="dropdown-name">
                  {isAdmin ? 'Admin' : (userName || currentUser?.displayName || 'User')}
                </div>
                <div className="dropdown-email">
                  {currentUser?.email}
                </div>
              </div>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={handleSettings}>
            <span className="dropdown-icon">⚙️</span>
            Settings
          </button>
          <button className="dropdown-item" onClick={handleLogout}>
            <span className="dropdown-icon">🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Avatar;

