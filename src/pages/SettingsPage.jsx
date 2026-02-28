import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, set, update, onValue, off } from 'firebase/database';
import { updatePassword, updateProfile } from 'firebase/auth';
import { database, auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.css';

function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // RFID Link state
  const [rfidLinking, setRfidLinking] = useState(false);
  const [rfidLinked, setRfidLinked] = useState(false);
  const [currentRfidUid, setCurrentRfidUid] = useState('');
  const rfidLinkTimeoutRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      // Load user profile data
      loadUserProfile();
      // Check for existing RFID
      checkExistingRfid();
    }
  }, [currentUser]);

  useEffect(() => {
    if (rfidLinking && currentUser) {
      // Listen for RFID scan result
      const rfidLinkRef = ref(database, `rfidLinking/${currentUser.uid}`);
      const unsubscribe = onValue(rfidLinkRef, async (snapshot) => {
        const linkData = snapshot.val();
        const rfidUid = linkData?.rfidUid;
        if (rfidUid && rfidLinking) {
          const normalizedUid = String(rfidUid).trim().toUpperCase();
          const previousUid = (currentRfidUid || '').trim().toUpperCase();

          try {
            await update(ref(database, `users/${currentUser.uid}`), { rfidUid: normalizedUid });

            if (previousUid && previousUid !== normalizedUid) {
              await set(ref(database, `rfidIndex/${previousUid}`), null);
            }
            await set(ref(database, `rfidIndex/${normalizedUid}`), currentUser.uid);

            setCurrentRfidUid(normalizedUid);
            setRfidLinked(true);
            if (rfidLinkTimeoutRef.current) {
              clearTimeout(rfidLinkTimeoutRef.current);
              rfidLinkTimeoutRef.current = null;
            }
            setRfidLinking(false);
            setMessage({ type: 'success', text: 'RFID linked successfully!' });
            await set(ref(database, `rfidLinking/${currentUser.uid}`), null);
          } catch (error) {
            setMessage({ type: 'error', text: 'Failed to finalize RFID linking: ' + error.message });
            setRfidLinking(false);
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [rfidLinking, currentUser, currentRfidUid]);

  useEffect(() => {
    if (!rfidLinking && rfidLinkTimeoutRef.current) {
      clearTimeout(rfidLinkTimeoutRef.current);
      rfidLinkTimeoutRef.current = null;
    }
  }, [rfidLinking]);

  useEffect(() => {
    return () => {
      if (rfidLinkTimeoutRef.current) {
        clearTimeout(rfidLinkTimeoutRef.current);
        rfidLinkTimeoutRef.current = null;
      }
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setProfileData({
            displayName: userData.displayName || currentUser.displayName || '',
            email: currentUser.email || ''
          });
        } else {
          setProfileData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkExistingRfid = async () => {
    try {
      if (currentUser) {
        const rfidRef = ref(database, `users/${currentUser.uid}/rfidUid`);
        const snapshot = await get(rfidRef);
        if (snapshot.exists()) {
          const normalizedUid = String(snapshot.val()).trim().toUpperCase();
          setCurrentRfidUid(normalizedUid);
          setRfidLinked(true);

          // Ensure UID -> userId index exists (helps ESP32 verification)
          set(ref(database, `rfidIndex/${normalizedUid}`), currentUser.uid);
        }
      }
    } catch (error) {
      console.error('Error checking RFID:', error);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update Firebase Auth profile
      if (profileData.displayName !== currentUser.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.displayName
        });
      }

      // Update database
      await update(ref(database, `users/${currentUser.uid}`), {
        displayName: profileData.displayName,
        email: currentUser.email
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      await updatePassword(auth.currentUser, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRfidLink = async () => {
    if (!currentUser) return;

    if (rfidLinkTimeoutRef.current) {
      clearTimeout(rfidLinkTimeoutRef.current);
      rfidLinkTimeoutRef.current = null;
    }

    setRfidLinking(true);
    setRfidLinked(false);
    setMessage({ type: 'info', text: 'Please scan your RFID card on the device...' });

    try {
      // Trigger ESP32 to show LCD message
      await set(ref(database, `rfidLinking/${currentUser.uid}`), {
        requested: true,
        timestamp: Date.now()
      });

      rfidLinkTimeoutRef.current = setTimeout(async () => {
        try {
          await set(ref(database, `rfidLinking/${currentUser.uid}`), null);
        } catch (e) {
        }
        setRfidLinking(false);
        setMessage({ type: 'error', text: 'RFID linking timed out. Please try again.' });
      }, 50000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start RFID linking: ' + error.message });
      setRfidLinking(false);
    }
  };

  const handleCancelRfidLink = async () => {
    if (rfidLinkTimeoutRef.current) {
      clearTimeout(rfidLinkTimeoutRef.current);
      rfidLinkTimeoutRef.current = null;
    }
    if (currentUser) {
      await set(ref(database, `rfidLinking/${currentUser.uid}`), null);
    }
    setRfidLinking(false);
    setMessage({ type: '', text: '' });
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <button className="back-button" onClick={() => navigate('/store')}>
            ← Back
          </button>
          <h1>Settings</h1>
        </header>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
          <button
            className={`tab-button ${activeTab === 'rfid' ? 'active' : ''}`}
            onClick={() => setActiveTab('rfid')}
          >
            RFID Link
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'rfid' && (
            <div className="rfid-link-section">
              <div className="rfid-info">
                <h3>Link Your RFID Card</h3>
                <p>Connect your RFID card to your account for easy access to the DropPoint system.</p>
              </div>

              {rfidLinked && currentRfidUid && (
                <div className="rfid-status">
                  <div className="status-badge success">
                    <span className="status-icon">✓</span>
                    RFID Linked
                  </div>
                  <div className="rfid-uid">
                    <strong>Card UID:</strong> {currentRfidUid}
                  </div>
                </div>
              )}

              {rfidLinking ? (
                <div className="rfid-linking">
                  <div className="linking-indicator">
                    <div className="spinner"></div>
                    <p>Waiting for RFID scan...</p>
                    <p className="linking-hint">Please scan your card on the DropPoint device</p>
                  </div>
                  <button
                    className="cancel-button"
                    onClick={handleCancelRfidLink}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="link-rfid-button"
                  onClick={handleStartRfidLink}
                >
                  {rfidLinked ? 'Link New RFID Card' : 'Link RFID Card'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

