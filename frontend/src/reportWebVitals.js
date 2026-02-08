import React, { useState, useEffect } from 'react';

const Profile = ({ user, navigateTo, onLogout }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/purchases', {
        method: 'GET',
        credentials: 'include', 
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases);
      } else {
        setError('Failed to fetch purchase history');
      }
    } catch (err) {
      console.error('Fetch purchases error:', err);
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      onLogout(); // Still logout even if request fails
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        <div style={styles.header}>
          <div style={styles.profileInfo}>
            <div style={styles.avatar}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={styles.userDetails}>
              <h2 style={styles.userName}>My Account</h2>
              <p style={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button 
            style={styles.logoutButton}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc3545';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6c757d';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Logout
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Purchase History</h3>
            <button 
              style={styles.dropdownToggle}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {isDropdownOpen ? '▼' : '▶'} View Purchases ({purchases.length})
            </button>
          </div>

          {isDropdownOpen && (
            <div style={styles.dropdown}>
              {loading ? (
                <div style={styles.loading}>
                  <div style={styles.spinner}></div>
                  <span>Loading purchases...</span>
                </div>
              ) : error ? (
                <div style={styles.error}>
                  <p>{error}</p>
                  <button 
                    style={styles.retryButton}
                    onClick={fetchPurchases}
                  >
                    Retry
                  </button>
                </div>
              ) : purchases.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No purchases found</p>
                  <button 
                    style={styles.shopButton}
                    onClick={() => navigateTo('policies')}
                  >
                    Browse Policies
                  </button>
                </div>
              ) : (
                <div style={styles.purchasesList}>
                  {purchases.map((purchase) => (
                    <div key={purchase.id} style={styles.purchaseItem}>
                      <div style={styles.purchaseHeader}>
                        <h4 style={styles.policyName}>{purchase.policy_name}</h4>
                        <span style={styles.premium}>
                          {formatCurrency(purchase.premium)}
                        </span>
                      </div>
                      <div style={styles.purchaseDetails}>
                        <p style={styles.policyId}>
                          <strong>Policy ID:</strong> {purchase.policy_id}
                        </p>
                        <p style={styles.purchaseDate}>
                          <strong>Purchased:</strong> {formatDate(purchase.purchased_at)}
                        </p>
                      </div>
                      <div style={styles.purchaseActions}>
                        <button style={styles.actionButton}>View Details</button>
                        <button style={styles.actionButton}>Download Certificate</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
          <div style={styles.actionGrid}>
            <button 
              style={styles.quickAction}
              onClick={() => navigateTo('policies')}
            >
              <span style={styles.actionIcon}>🛒</span>
              Buy New Policy
            </button>
            <button style={styles.quickAction}>
              <span style={styles.actionIcon}>📄</span>
              File a Claim
            </button>
            <button style={styles.quickAction}>
              <span style={styles.actionIcon}>🔄</span>
              Renew Policy
            </button>
            <button style={styles.quickAction}>
              <span style={styles.actionIcon}>💬</span>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  profileCard: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '30px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    border: '3px solid rgba(255,255,255,0.3)',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    margin: '0 0 5px 0',
    fontSize: '28px',
    fontWeight: '700',
  },
  userEmail: {
    margin: '0',
    fontSize: '16px',
    opacity: '0.9',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  section: {
    padding: '30px',
    borderBottom: '1px solid #e9ecef',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0',
    fontSize: '22px',
    color: '#333',
    fontWeight: '600',
  },
  dropdownToggle: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  dropdown: {
    marginTop: '15px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '30px',
    color: '#6c757d',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #e9ecef',
    borderTop: '2px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    textAlign: 'center',
    color: '#dc3545',
    padding: '20px',
  },
  retryButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6c757d',
  },
  shopButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  purchasesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  purchaseItem: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    transition: 'all 0.3s ease',
  },
  purchaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  policyName: {
    margin: '0',
    fontSize: '18px',
    color: '#333',
    fontWeight: '600',
  },
  premium: {
    fontSize: '18px',
    color: '#28a745',
    fontWeight: '700',
  },
  purchaseDetails: {
    marginBottom: '15px',
  },
  policyId: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#6c757d',
  },
  purchaseDate: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#6c757d',
  },
  purchaseActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
    marginTop: '20px',
  },
  quickAction: {
    padding: '20px',
    backgroundColor: '#fff',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  actionIcon: {
    display: 'block',
    fontSize: '24px',
    marginBottom: '8px',
  },
};

// CSS animation for spinner
const spinKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default Profile;