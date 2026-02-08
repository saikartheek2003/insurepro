import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './AdminPanel.css';

const AdminPanel = () => {
  const [claims, setClaims] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [rejectedClaims, setRejectedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingClaim, setProcessingClaim] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [adminInfo, setAdminInfo] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', or 'rejected'
  const navigate = useNavigate(); 

  useEffect(() => {
    verifyAdminSession();
  }, []);
  const verifyAdminSession = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/verify", { 
        withCredentials: true 
      });
      
      if (response.data.authenticated) {
        setAdminInfo(response.data.admin);
        await fetchAllClaims(); // <--- ADD THIS LINE
      } else {
        navigate("/admin-login");
      }
    } catch (err) {
      console.error("Admin session verification failed:", err);
      navigate("/admin-login");
    }
  };

const fetchAllClaims = async () => {
  try {
    setLoading(true);
    setError("");
    
    // STEP 1: Call the single endpoint that exists on your server.
    const response = await axios.get("http://localhost:5000/api/admin/claims", { 
      withCredentials: true 
    });

    console.log("All Claims API response:", response.data);

    if (response.data.success) {
      const allClaims = response.data.claims || [];

      // STEP 2: Filter the results into the different state arrays.
      setClaims(allClaims.filter(claim => 
        ['Submitted', 'Pending', 'Under Review'].includes(claim.status)
      ));
      setApprovedClaims(allClaims.filter(claim => claim.status === 'Approved'));
      setRejectedClaims(allClaims.filter(claim => claim.status === 'Rejected'));

    } else {
      setError("Failed to fetch claims data.");
    }
    
  } catch (err) {
    console.error("Error fetching claims:", err);
    if (err.response?.status === 401) {
      setError("Unauthorized access");
      navigate("/admin-login");
    } else {
      setError("Failed to fetch claims. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

 // In AdminPanel.js

const handleClaimAction = async (claimId, action, rejectionReason = null) => {
  try {
    setProcessingClaim(claimId);

    // 1. Construct the correct URL with the claim ID
    const url = `http://localhost:5000/api/admin/claims/${claimId}`;

    // 2. Prepare the data payload with the new status
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const payload = {
      status: newStatus,
      rejectionReason: rejectionReason
    };

    // 3. Use the correct HTTP method (PUT) and send the payload
    const response = await axios.put(url, payload, { withCredentials: true });

    if (response.data.success) {
      // Refresh all claims to get updated data from the database
      await fetchAllClaims();
      showToast(`Claim has been ${newStatus.toLowerCase()}.`, "success");
      setSelectedClaim(null);
    } else {
      showToast(response.data.message || `Failed to update claim`, "error");
    }
  } catch (err) {
    console.error(`Claim action error:`, err);
    showToast(`Failed to update claim. Please try again.`, "error");
  } finally {
    setProcessingClaim(null);
  }
};
  const handleApprove = (claimId) => {
    if (window.confirm("Are you sure you want to approve this claim? An email notification will be sent to the customer.")) {
      handleClaimAction(claimId, 'approve');
    }
  };

  const handleReject = (claimId) => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason && reason.trim()) {
      handleClaimAction(claimId, 'reject', reason.trim());
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/admin/logout", {}, { 
        withCredentials: true 
      });
      navigate("/admin-login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/admin-login");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
      case 'Submitted': return '#ffc107';
      case 'Approved': return '#28a745';
      case 'Rejected': return '#dc3545';
      case 'Under Review': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderClaimCard = (claim, showActions = true) => (
    <div 
      key={claim.id} 
      className={`claim-card ${processingClaim === claim.id ? 'processing' : ''}`}
    >
      <div 
        className="claim-status-badge"
        style={{
          backgroundColor: getStatusColor(claim.status)
        }}
      >
        {claim.status}
      </div>

      <div className="claim-header">
        <h3>Claim #{claim.claim_number}</h3>
        <div className="claim-date">
          Submitted: {new Date(claim.submitted_date).toLocaleDateString()}
        </div>
      </div>

      <div className="claim-details-grid">
        <div className="detail-section">
          <h4>Policy Information</h4>
          <div className="detail-item">
            <span className="label">Policy ID:</span>
            <span className="value">{claim.policy_id}</span>
          </div>
          <div className="detail-item">
            <span className="label">Policy Name:</span>
            <span className="value">{claim.policy_name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Policy Type:</span>
            <span className="value">{claim.policy_type}</span>
          </div>
          <div className="detail-item">
            <span className="label">Coverage:</span>
            <span className="value">{formatCurrency(claim.coverage_amount)}</span>
          </div>
        </div>

        <div className="detail-section">
          <h4>Customer Information</h4>
          <div className="detail-item">
            <span className="label">Customer:</span>
            <span className="value">{claim.customer_name}</span>
          </div>
          <div className="detail-item">
            <span className="label">Email:</span>
            <span className="value">{claim.customer_email}</span>
          </div>
          <div className="detail-item">
            <span className="label">Phone:</span>
            <span className="value">{claim.customer_phone || 'N/A'}</span>
          </div>
        </div>

        <div className="detail-section">
          <h4>Claim Information</h4>
          <div className="detail-item">
            <span className="label">Claim Amount:</span>
            <span className="value claim-amount">{formatCurrency(claim.claim_amount)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Claim Type:</span>
            <span className="value">{claim.claim_type}</span>
          </div>
          <div className="detail-item">
            <span className="label">Reason:</span>
            <span className="value">{claim.claim_reason}</span>
          </div>
        </div>
      </div>

      {claim.documents && claim.documents.length > 0 && (
        <div className="claim-documents">
          <h4>Supporting Documents ({claim.documents.length})</h4>
          <div className="documents-list">
            {claim.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <div className="document-name">{doc.name}</div>
                  <div className="document-size">{formatFileSize(doc.size)}</div>
                </div>
                <div className="document-status">
                  {doc.uploaded ? '✓ Uploaded' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {claim.admin_comments && (
        <div className="admin-comments">
          <h4>Admin Comments</h4>
          <p>{claim.admin_comments}</p>
        </div>
      )}

      {claim.rejection_reason && (
        <div className="rejection-reason">
          <h4>Rejection Reason</h4>
          <p>{claim.rejection_reason}</p>
        </div>
      )}

      {claim.settlement_amount && (
        <div className="settlement-amount">
          <h4>Settlement Amount</h4>
          <p>{formatCurrency(claim.settlement_amount)}</p>
        </div>
      )}

      {showActions && (claim.status === 'Pending' || claim.status === 'Submitted') && (
        <div className="claim-actions">
          <button
            onClick={() => handleApprove(claim.id)}
            disabled={processingClaim === claim.id}
            className="approve-button"
          >
            {processingClaim === claim.id ? 'Processing...' : 'Approve Claim'}
          </button>
          <button
            onClick={() => handleReject(claim.id)}
            disabled={processingClaim === claim.id}
            className="reject-button"
          >
            {processingClaim === claim.id ? 'Processing...' : 'Reject Claim'}
          </button>
          <button
            onClick={() => setSelectedClaim(selectedClaim === claim.id ? null : claim.id)}
            className="view-details-button"
          >
            {selectedClaim === claim.id ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      )}

      {claim.admin_action_date && (
        <div className="action-date">
          Action taken: {new Date(claim.admin_action_date).toLocaleString()}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="admin-panel-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Loading claims...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
        </div>
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchAllClaims} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      {toast.show && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            className="toast-close"
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-header">
        <div className="admin-title">
          <h1>Insurance Claims Admin Panel</h1>
          {adminInfo && (
            <div className="admin-info">
              <span>Welcome, {adminInfo.email}</span>
            </div>
          )}
        </div>
        <div className="admin-actions">
          <button
            onClick={fetchAllClaims}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Refreshing...' : 'Refresh Claims'}
          </button>
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Claims ({claims.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Claims ({approvedClaims.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Claims ({rejectedClaims.length})
        </button>
      </div>

      {/* Claims Summary */}
      <div className="claims-summary">
        <div className="summary-card">
          <h3>Total Claims</h3>
          <div className="summary-number">{claims.length + approvedClaims.length + rejectedClaims.length}</div>
        </div>
        <div className="summary-card">
          <h3>Pending</h3>
          <div className="summary-number pending">{claims.length}</div>
        </div>
        <div className="summary-card">
          <h3>Approved</h3>
          <div className="summary-number approved">{approvedClaims.length}</div>
        </div>
        <div className="summary-card">
          <h3>Rejected</h3>
          <div className="summary-number rejected">{rejectedClaims.length}</div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div className="claims-container">
          {claims.length === 0 ? (
            <div className="no-claims-container">
              <h3>No Pending Claims</h3>
              <p>There are currently no pending insurance claims to review.</p>
            </div>
          ) : (
            claims.map((claim) => renderClaimCard(claim, true))
          )}
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="approved-claims-container">
          {approvedClaims.length === 0 ? (
            <div className="no-claims-container">
              <h3>No Approved Claims</h3>
              <p>There are currently no approved insurance claims.</p>
            </div>
          ) : (
            <div className="approved-claims-table">
              <h3>Approved Claims History</h3>
              <div className="table-container">
                <table className="claims-table">
                  <thead>
                    <tr>
                      <th>Claim #</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Policy ID</th>
                      <th>Claim Amount</th>
                      <th>Settlement Amount</th>
                      <th>Claim Reason</th>
                      <th>Approved Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedClaims.map((claim) => (
                      <tr key={claim.id}>
                        <td>{claim.claim_number}</td>
                        <td>{claim.customer_name}</td>
                        <td>{claim.customer_email}</td>
                        <td>{claim.policy_id}</td>
                        <td>{formatCurrency(claim.claim_amount)}</td>
                        <td>{formatCurrency(claim.settlement_amount || claim.claim_amount)}</td>
                        <td>{claim.claim_reason}</td>
                        <td>{new Date(claim.admin_action_date).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => setSelectedClaim(selectedClaim === claim.id ? null : claim.id)}
                            className="view-details-button-small"
                          >
                            {selectedClaim === claim.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {selectedClaim && (
                <div className="selected-claim-details">
                  <h4>Claim Details</h4>
                  {approvedClaims
                    .filter(claim => claim.id === selectedClaim)
                    .map(claim => renderClaimCard(claim, false))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rejected' && (
        <div className="rejected-claims-container">
          {rejectedClaims.length === 0 ? (
            <div className="no-claims-container">
              <h3>No Rejected Claims</h3>
              <p>There are currently no rejected insurance claims.</p>
            </div>
          ) : (
            <div className="rejected-claims-table">
              <h3>Rejected Claims History</h3>
              <div className="table-container">
                <table className="claims-table">
                  <thead>
                    <tr>
                      <th>Claim #</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Policy ID</th>
                      <th>Claim Amount</th>
                      <th>Rejection Reason</th>
                      <th>Rejected Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedClaims.map((claim) => (
                      <tr key={claim.id}>
                        <td>{claim.claim_number}</td>
                        <td>{claim.customer_name}</td>
                        <td>{claim.customer_email}</td>
                        <td>{claim.policy_id}</td>
                        <td>{formatCurrency(claim.claim_amount)}</td>
                        <td>{claim.rejection_reason || 'No reason provided'}</td>
                        <td>{new Date(claim.admin_action_date).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => setSelectedClaim(selectedClaim === claim.id ? null : claim.id)}
                            className="view-details-button-small"
                          >
                            {selectedClaim === claim.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {selectedClaim && (
                <div className="selected-claim-details">
                  <h4>Claim Details</h4>
                  {rejectedClaims
                    .filter(claim => claim.id === selectedClaim)
                    .map(claim => renderClaimCard(claim, false))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;