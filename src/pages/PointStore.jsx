import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, push, get, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useStoreItems } from '../hooks/useStoreItems';
import { useAdmin } from '../hooks/useAdmin';
import { useAllUsers } from '../hooks/useAllUsers';
import { useAllRedemptions } from '../hooks/useAllRedemptions';
import Avatar from '../components/Avatar';
import './PointStore.css';
import ConfirmRedemptionModal from '../components/ConfirmRedemptionModal';
import RedemptionSuccessModal from '../components/RedemptionSuccessModal';

function PointStore() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { points, earnedToday, loading: userLoading } = useUserData();
  const { items, loading: itemsLoading } = useStoreItems();
  const { isAdmin } = useAdmin();
  const { users: allUsers, loading: usersLoading } = useAllUsers();
  const { redemptions: allRedemptions, loading: redemptionsLoading } = useAllRedemptions();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingUser, setEditingUser] = useState(null);
  const [userPointsEdit, setUserPointsEdit] = useState('');
  const [editingRfidUser, setEditingRfidUser] = useState(null);
  const [rfidUidEdit, setRfidUidEdit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState('all');
  const [redemptionSearch, setRedemptionSearch] = useState('');
  const [itemForm, setItemForm] = useState({
    name: '',
    points: '',
    stock: '',
    icon: '📦'
  });

  const handleRedeem = (item) => {
    if (!item.stock || item.stock === 'out') return;
    if (points < item.points) {
      alert('Insufficient points!');
      return;
    }
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const handleRefresh = async () => {
    if (!currentUser || refreshing) return;
    
    setRefreshing(true);
    try {
      const userId = currentUser.uid;
      const pointsRef = ref(database, `users/${userId}/points`);
      const snapshot = await get(pointsRef);
      // The real-time listener will automatically update when we read this
      // This forces a fresh read from the database
    } catch (error) {
      console.error('Error refreshing points:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleManageStore = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      points: '',
      stock: '',
      icon: '📦'
    });
    setShowManageModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      points: item.points || '',
      stock: item.stock === 'unlimited' ? 'unlimited' : (item.stock || ''),
      icon: item.icon || '📦'
    });
    setShowManageModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await remove(ref(database, `storeItems/${itemId}`));
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const itemData = {
        name: itemForm.name,
        points: parseInt(itemForm.points),
        stock: itemForm.stock === 'unlimited' ? 'unlimited' : parseInt(itemForm.stock),
        icon: itemForm.icon
      };

      if (editingItem) {
        // Update existing item
        await set(ref(database, `storeItems/${editingItem.id}`), itemData);
        alert('Item updated successfully!');
      } else {
        // Create new item
        const newItemRef = push(ref(database, 'storeItems'));
        await set(newItemRef, itemData);
        alert('Item added successfully!');
      }

      setShowManageModal(false);
      setEditingItem(null);
      setItemForm({
        name: '',
        points: '',
        stock: '',
        icon: '📦'
      });
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    }
  };

  const handleConfirmRedemption = async () => {
    if (!selectedItem || !currentUser) return;
    
    setRedeeming(true);
    
    try {
      const userId = currentUser.uid;
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      setVerificationCode(code);
      
      // Update user points
      const newPoints = points - selectedItem.points;
      await set(ref(database, `users/${userId}/points`), newPoints);
      
      // Create redemption record
      const redemptionRef = push(ref(database, `redemptions/${userId}`));
      await set(redemptionRef, {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        points: selectedItem.points,
        verificationCode: code,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      // Update item stock if needed
      if (selectedItem.stock !== 'unlimited') {
        const newStock = (selectedItem.stock || 0) - 1;
        await set(ref(database, `storeItems/${selectedItem.id}/stock`), newStock);
      }
      
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Redemption error:', error);
      alert('Failed to process redemption. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };


  // Redirect to login if not authenticated (fallback, PrivateRoute should handle this)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  // Admin management functions
  const handleEditUserPoints = (user) => {
    setEditingUser(user);
    setUserPointsEdit(user.points || 0);
  };

  const handleSaveUserPoints = async () => {
    if (!editingUser) return;
    const newPoints = parseInt(userPointsEdit);
    if (isNaN(newPoints) || newPoints < 0) {
      alert('Please enter a valid number');
      return;
    }
    try {
      await set(ref(database, `users/${editingUser.uid}/points`), newPoints);
      setEditingUser(null);
      setUserPointsEdit('');
      alert('Points updated successfully!');
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Failed to update points. Please try again.');
    }
  };

  const handleEditRfidUid = (user) => {
    setEditingRfidUser(user);
    setRfidUidEdit(user.rfidUid || '');
  };

  const handleSaveRfidUid = async () => {
    if (!editingRfidUser) return;
    try {
      const previousUid = (editingRfidUser.rfidUid || '').trim().toUpperCase();
      const nextUid = rfidUidEdit.trim() ? rfidUidEdit.trim().toUpperCase() : '';

      if (nextUid) {
        await set(ref(database, `users/${editingRfidUser.uid}/rfidUid`), nextUid);

        // Maintain UID -> userId index for the ESP32
        if (previousUid && previousUid !== nextUid) {
          await set(ref(database, `rfidIndex/${previousUid}`), null);
        }
        await set(ref(database, `rfidIndex/${nextUid}`), editingRfidUser.uid);
        alert('RFID UID updated successfully!');
      } else {
        // Remove RFID UID if empty
        await remove(ref(database, `users/${editingRfidUser.uid}/rfidUid`));

        // Remove old index mapping if present
        if (previousUid) {
          await set(ref(database, `rfidIndex/${previousUid}`), null);
        }
        alert('RFID UID removed successfully!');
      }
      setEditingRfidUser(null);
      setRfidUidEdit('');
    } catch (error) {
      console.error('Error updating RFID UID:', error);
      alert('Failed to update RFID UID. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await remove(ref(database, `users/${userId}`));
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const getUserRedemptions = (userId) => {
    return allRedemptions.filter(r => r.userId === userId);
  };

  const handleMarkAsCollected = async (redemption) => {
    if (!window.confirm(`Mark redemption for "${redemption.itemName}" as collected?`)) return;
    
    try {
      await set(ref(database, `redemptions/${redemption.userId}/${redemption.id}/status`), 'collected');
      alert('Redemption marked as collected!');
    } catch (error) {
      console.error('Error updating redemption status:', error);
      alert('Failed to update redemption status. Please try again.');
    }
  };

  // Filter redemptions
  const getFilteredRedemptions = () => {
    let filtered = selectedUserId 
      ? allRedemptions.filter(r => r.userId === selectedUserId)
      : allRedemptions;

    // Filter by status
    if (redemptionStatusFilter !== 'all') {
      filtered = filtered.filter(r => (r.status || 'pending') === redemptionStatusFilter);
    }

    // Filter by search (name, email or verification code)
    if (redemptionSearch) {
      const searchLower = redemptionSearch.toLowerCase();
      filtered = filtered.filter(r => {
        const user = allUsers.find(u => u.uid === r.userId);
        const userName = user?.name || user?.displayName || '';
        const nameMatch = userName.toLowerCase().includes(searchLower);
        const emailMatch = user?.email?.toLowerCase().includes(searchLower);
        const codeMatch = r.verificationCode?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch || codeMatch;
      });
    }

    return filtered;
  };

  // Calculate statistics
  const totalUsers = allUsers.length;
  const totalRedemptions = allRedemptions.length;

  // Filter users by search query
  const filteredUsers = allUsers.filter(user => {
    const userName = user.name || user.displayName || '';
    return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uid?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authLoading || userLoading || itemsLoading) {
    return (
      <div className="point-store">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading...</p>
          {process.env.NODE_ENV === 'development' && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Auth: {authLoading ? 'Loading' : 'Ready'} | 
              User: {userLoading ? 'Loading' : 'Ready'} | 
              Items: {itemsLoading ? 'Loading' : 'Ready'}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="point-store">
      <header className="store-header">
        <div className="header-left">
          <span className="header-icon">🎓</span>
          <div>
            <h1>{isAdmin ? 'Admin Dashboard' : 'School Supply Store'}</h1>
            <p>RFID Point Redemption System</p>
          </div>
        </div>
        <div className="header-right">
          {isAdmin && activeTab === 'store' && (
            <button className="manage-button" onClick={handleManageStore}>
              ⚙️ Manage Store
            </button>
          )}
          <Avatar />
        </div>
      </header>

      {!isAdmin && (
        <div className="store-content">
          <div className="points-section">
            <div className="points-card">
              <div className="points-header">
                <span className="points-icon">👁️</span>
                <h3>Available Points</h3>
              </div>
              <div className="points-value">{points}</div>
              {earnedToday > 0 && (
                <div className="points-earned">
                  <span className="earned-icon">↑</span>
                  <span>+{earnedToday} earned today</span>
                </div>
              )}
              <div 
                className={`refresh-icon ${refreshing ? 'spinning' : ''}`}
                onClick={handleRefresh}
                title="Refresh points"
              >
                🔄
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="admin-dashboard">
          <div className="dashboard-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 Users
            </button>
            <button 
              className={`tab-button ${activeTab === 'redemptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('redemptions')}
            >
              🎁 Redemptions
            </button>
            <button 
              className={`tab-button ${activeTab === 'store' ? 'active' : ''}`}
              onClick={() => setActiveTab('store')}
            >
              🏪 Store
            </button>
          </div>

          <div className="dashboard-content">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎁</div>
                    <div className="stat-value">{totalRedemptions}</div>
                    <div className="stat-label">Total Redemptions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{items.length}</div>
                    <div className="stat-label">Store Items</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-section">
                <div className="section-header">
                  <h2>Users Management</h2>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                </div>
                {usersLoading ? (
                  <div className="loading-message">Loading users...</div>
                ) : (
                  <div className="users-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Points</th>
                          <th>RFID UID</th>
                          <th>Account Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.uid}>
                            <td>{user.name || user.displayName || 'N/A'}</td>
                            <td>{user.email || 'N/A'}</td>
                            <td>
                              {editingUser?.uid === user.uid ? (
                                <div className="edit-points-form">
                                  <input
                                    type="number"
                                    value={userPointsEdit}
                                    onChange={(e) => setUserPointsEdit(e.target.value)}
                                    min="0"
                                    style={{ width: '80px', padding: '5px' }}
                                  />
                                  <button onClick={handleSaveUserPoints} className="save-btn">Save</button>
                                  <button onClick={() => setEditingUser(null)} className="cancel-btn">Cancel</button>
                                </div>
                              ) : (
                                user.points || 0
                              )}
                            </td>
                            <td>
                              {editingRfidUser?.uid === user.uid ? (
                                <div className="edit-points-form">
                                  <input
                                    type="text"
                                    value={rfidUidEdit}
                                    onChange={(e) => setRfidUidEdit(e.target.value)}
                                    placeholder="Enter RFID UID"
                                    style={{ width: '150px', padding: '5px' }}
                                  />
                                  <button onClick={handleSaveRfidUid} className="save-btn">Save</button>
                                  <button onClick={() => setEditingRfidUser(null)} className="cancel-btn">Cancel</button>
                                </div>
                              ) : (
                                user.rfidUid || 'Not linked'
                              )}
                            </td>
                            <td>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <div className="user-actions">
                                <button 
                                  className="edit-user-btn"
                                  onClick={() => handleEditUserPoints(user)}
                                >
                                  ✏️ Edit Points
                                </button>
                                <button 
                                  className="edit-rfid-btn"
                                  onClick={() => handleEditRfidUid(user)}
                                >
                                  🏷️ Edit RFID
                                </button>
                                <button 
                                  className="view-redemptions-btn"
                                  onClick={() => {
                                    setSelectedUserId(user.uid);
                                    setActiveTab('redemptions');
                                  }}
                                >
                                  📋 Redemptions
                                </button>
                                <button 
                                  className="delete-user-btn"
                                  onClick={() => handleDeleteUser(user.uid)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'redemptions' && (
              <div className="redemptions-section">
                <div className="section-header">
                  <h2>Redemptions Management</h2>
                  <div className="redemption-filters">
                    {selectedUserId && (
                      <button 
                        className="clear-filter-btn"
                        onClick={() => setSelectedUserId(null)}
                      >
                        Clear User Filter
                      </button>
                    )}
                  </div>
                </div>
                <div className="redemption-controls">
                  <div className="filter-group">
                    <label>Filter by Status:</label>
                    <select 
                      value={redemptionStatusFilter}
                      onChange={(e) => setRedemptionStatusFilter(e.target.value)}
                      className="status-filter"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="collected">Collected</option>
                    </select>
                  </div>
                  <div className="search-group">
                    <input
                      type="text"
                      placeholder="Search by email or verification code..."
                      value={redemptionSearch}
                      onChange={(e) => setRedemptionSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
                {redemptionsLoading ? (
                  <div className="loading-message">Loading redemptions...</div>
                ) : (
                  <div className="redemptions-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Item</th>
                          <th>Points</th>
                          <th>Verification Code</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredRedemptions().length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                              No redemptions found
                            </td>
                          </tr>
                        ) : (
                          getFilteredRedemptions().map(redemption => {
                            const user = allUsers.find(u => u.uid === redemption.userId);
                            const status = redemption.status || 'pending';
                            return (
                              <tr key={redemption.id}>
                                <td>{user?.name || user?.displayName || 'N/A'}</td>
                                <td>{redemption.itemName || 'N/A'}</td>
                                <td>{redemption.points || 0}</td>
                                <td>{redemption.verificationCode || 'N/A'}</td>
                                <td>
                                  {redemption.timestamp 
                                    ? new Date(redemption.timestamp).toLocaleString() 
                                    : 'N/A'
                                  }
                                </td>
                                <td>
                                  <span className={`status-badge ${status}`}>
                                    {status}
                                  </span>
                                </td>
                                <td>
                                  {status === 'pending' && (
                                    <button
                                      className="mark-collected-btn"
                                      onClick={() => handleMarkAsCollected(redemption)}
                                    >
                                      ✓ Mark Collected
                                    </button>
                                  )}
                                  {status === 'collected' && (
                                    <span className="collected-text">Collected</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'store' && (
              <div className="store-section">
                <h2 className="section-title">School Supplies Store</h2>
                <p className="section-subtitle">Manage store items</p>
                
                {items.length === 0 && (
                  <div className="no-items">
                    <p>No items available. Add items using the "Manage Store" button.</p>
                  </div>
                )}
                
                <div className="items-grid">
                  {items.length > 0 && items.map(item => {
                    const isOutOfStock = item.stock === 0 || item.stock === 'out';
                    const isInStock = item.stock === 'unlimited' || item.stock > 0 || item.stock === 'in';
                    
                    return (
                      <div key={item.id} className="item-card">
                        {isOutOfStock && (
                          <span className="stock-badge out">Out of Stock</span>
                        )}
                        {isInStock && !isOutOfStock && (
                          <span className="stock-badge in">In Stock</span>
                        )}
                        
                        <div className="item-icon">{item.icon || '📦'}</div>
                        <h3 className="item-name">{item.name}</h3>
                        <div className="item-points">
                          <span className="points-icon">🍃</span>
                          {item.points || 0} points
                        </div>
                        <div className="admin-actions">
                          <button
                            className="edit-button"
                            onClick={() => handleEditItem(item)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="store-section">
          <h2 className="section-title">School Supplies Store</h2>
          <p className="section-subtitle">Redeem your points for essential school supplies</p>
          
          {items.length === 0 && (
            <div className="no-items">
              <p>No items available. Please add items in Firebase database.</p>
            </div>
          )}
          
          <div className="items-grid">
            {items.length > 0 && items.map(item => {
              const isOutOfStock = item.stock === 0 || item.stock === 'out';
              const isInStock = item.stock === 'unlimited' || item.stock > 0 || item.stock === 'in';
              
              return (
                <div key={item.id} className="item-card">
                  {isOutOfStock && (
                    <span className="stock-badge out">Out of Stock</span>
                  )}
                  {isInStock && !isOutOfStock && (
                    <span className="stock-badge in">In Stock</span>
                  )}
                  
                  <div className="item-icon">{item.icon || '📦'}</div>
                  <h3 className="item-name">{item.name}</h3>
                  <div className="item-points">
                    <span className="points-icon">🍃</span>
                    {item.points || 0} points
                  </div>
                  <button
                    className={`redeem-button ${isOutOfStock ? 'disabled' : ''}`}
                    onClick={() => handleRedeem(item)}
                    disabled={isOutOfStock || points < (item.points || 0)}
                  >
                    {isOutOfStock ? 'Out of Stock' : 'Redeem Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showManageModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button className="modal-close" onClick={() => setShowManageModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveItem} className="item-form">
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Points</label>
                <input
                  type="number"
                  min="1"
                  value={itemForm.points}
                  onChange={(e) => setItemForm({...itemForm, points: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock (number or "unlimited")</label>
                <input
                  type="text"
                  value={itemForm.stock}
                  onChange={(e) => setItemForm({...itemForm, stock: e.target.value})}
                  placeholder="10 or unlimited"
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  value={itemForm.icon}
                  onChange={(e) => setItemForm({...itemForm, icon: e.target.value})}
                  maxLength="2"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowManageModal(false)}>Cancel</button>
                <button type="submit">{editingItem ? 'Update' : 'Add'} Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && selectedItem && (
        <ConfirmRedemptionModal
          item={selectedItem}
          currentPoints={points}
          onConfirm={handleConfirmRedemption}
          onCancel={() => setShowConfirmModal(false)}
          loading={redeeming}
        />
      )}

      {showSuccessModal && selectedItem && (
        <RedemptionSuccessModal
          item={selectedItem}
          verificationCode={verificationCode}
          onClose={() => {
            setShowSuccessModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}

export default PointStore;

