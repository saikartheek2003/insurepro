import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './ClaimRenewal.css';

const ClaimRenewal = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingPolicy, setClaimingPolicy] = useState(null);
  const [claimForm, setClaimForm] = useState({
    claimAmount: '',
    claimReason: '',
    customReason: ''
  });
  const [claimDocuments, setClaimDocuments] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [processingRenewal, setProcessingRenewal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolicies();
    
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const renewalId = urlParams.get('renewalId');
    
    if (paymentStatus === 'success' && renewalId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast("Policy renewed successfully! Your new policy is now active.", "success");
    } else if (paymentStatus === 'failed') {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast("Renewal payment failed. Please try again.", "error");
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.get("http://localhost:5000/api/user-policies", { 
        withCredentials: true 
      });
      
      console.log("ClaimRenewal API response:", response.data);
      
      const policies = response.data.policies || [];
      setPolicies(policies);
      
    } catch (err) {
      console.error("Error fetching policies:", err);
      if (err.response?.status === 401) {
        setError("Please log in again to view your policies");
        navigate("/login");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to fetch policies. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB per file
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} is not a supported file type. Please upload JPG, PNG, or PDF files.`, "error");
        return false;
      }
      if (file.size > maxSize) {
        showToast(`${file.name} is too large. Please upload files smaller than 5MB.`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length + claimDocuments.length > 5) {
      showToast("You can upload maximum 5 documents per claim.", "error");
      return;
    }

    const newDocuments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    }));

    setClaimDocuments(prev => [...prev, ...newDocuments]);
  };

  const removeDocument = (documentId) => {
    setClaimDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const uploadDocuments = async () => {
    if (claimDocuments.length === 0) {
      showToast("Please upload at least one document to support your claim.", "error");
      return false;
    }

    try {
      setUploadingDocuments(true);
      
      // Simulate document upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark all documents as uploaded
      setClaimDocuments(prev => prev.map(doc => ({ ...doc, uploaded: true })));
      
      showToast("Documents uploaded successfully!", "success");
      return true;
    } catch (err) {
      console.error("Document upload error:", err);
      showToast("Failed to upload documents. Please try again.", "error");
      return false;
    } finally {
      setUploadingDocuments(false);
    }
  };



const handleClaim = async (policy) => {
  const finalReason = claimForm.claimReason === 'other' ? claimForm.customReason : claimForm.claimReason;
  
  // --- (Your existing validation logic is good and remains the same) ---
  if (!claimForm.claimAmount || !finalReason) {
    showToast("Please fill in all claim details", "error");
    return;
  }
  if (parseFloat(claimForm.claimAmount) <= 0) {
    showToast("Claim amount must be greater than 0", "error");
    return;
  }
  if (parseFloat(claimForm.claimAmount) > parseFloat(policy.coverage_amount)) {
    showToast("Claim amount cannot exceed coverage amount", "error");
    return;
  }

  setSubmittingClaim(true);
  try {
    // 1. Create a FormData object to send files and data together.
    const formData = new FormData();

    
    formData.append("policy_id", policy.id);
    formData.append("claim_amount", parseFloat(claimForm.claimAmount));
    formData.append("claim_reason", finalReason);
    formData.append("claim_type", 'General'); // Add claim_type as well

    // 3. Append each file from your state to the FormData object.
    claimDocuments.forEach(file => {
      formData.append("documents", file); 
    });
    
    // 4. Send the FormData object. Axios will automatically set the correct headers.
    const response = await axios.post(
      "http://localhost:5000/api/user/claims",
      formData,
      { withCredentials: true }
    );

    if (response.data.success) {
      
      setPolicies(prev => prev.map(p => 
        p.id === policy.id 
          ? { ...p, status: 'Under Claim Review', claim_status: 'Submitted' }
          : p
      ));
      showToast(`Claim submitted successfully! Claim Number: ${response.data.claim.claim_number}`, "success");
      setClaimingPolicy(null);
      setClaimForm({ claimAmount: '', claimReason: '', customReason: '' });
      setClaimDocuments([]);
    } else {
      showToast(response.data.message || "Failed to submit claim", "error");
    }
  } catch (err) {
    console.error("Claim submission error:", err);
    const errorMessage = err.response?.data?.message || "Failed to submit claim. Please try again.";
    showToast(errorMessage, "error");
  } finally {
    setSubmittingClaim(false);
  }
};
  const handleRenew = async (policy) => {
    try {
      setProcessingRenewal(policy.id);
      
      const response = await axios.get(
        `http://localhost:5000/api/policy-renewal/${policy.id}`,
        { withCredentials: true }
      );

      if (response.data?.success && response.data?.renewalData) {
        const renewalData = response.data.renewalData;
        
        navigate("/payment", {
          state: {
            policy: {
              id: renewalData.newPolicyId,
              name: renewalData.policyName,
              type: renewalData.policyType,
              premium: renewalData.premium,
              coverageAmount: renewalData.coverageAmount,
              policyTerm: renewalData.policyTerm,
              amount: renewalData.premium,
              isRenewal: true,
              installmentNumber: renewalData.installmentNumber,
              originalPolicyId: renewalData.originalPolicyId,
              renewalId: renewalData.renewalId,
              newExpiryDate: renewalData.newExpiryDate
            },
            isRenewal: true,
            paymentType: 'policy_renewal',
            successRedirect: '/claim-renewal?payment=success&renewalId=' + renewalData.renewalId
          }
        });
        
        showToast(`Redirecting to payment for installment #${renewalData.installmentNumber}...`, "success");
        
      } else {
        const errorMsg = response.data?.message || "Policy is not eligible for renewal at this time";
        showToast(errorMsg, "error");
      }
      
    } catch (err) {
      console.error("Renewal error:", err);
      
      let errorMessage = "Failed to process renewal. Please try again.";
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || "Policy not eligible for renewal yet";
      } else if (err.response?.status === 404) {
        errorMessage = "Policy not found";
      } else if (err.response?.status === 401) {
        errorMessage = "Please log in to renew your policy";
        navigate("/login");
        return;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setProcessingRenewal(null);
    }
  };

  const handleDelete = async (policy) => {
    const isExpired = new Date(policy.expiry_date) <= new Date();
    
    if (policy.status === 'Active' && !isExpired) {
      showToast("Cannot delete active policies. Please wait for expiry.", "error");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the policy "${policy.policy_name}"? This action cannot be undone.`)) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/policy/${policy.id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setPolicies(prev => prev.filter(p => p.id !== policy.id));
          showToast("Policy deleted successfully", "success");
        } else {
          showToast(response.data.message || "Failed to delete policy", "error");
        }
      } catch (err) {
        console.error("Delete error:", err);
        const errorMessage = err.response?.data?.message || "Failed to delete policy. Please try again.";
        showToast(errorMessage, "error");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#28a745';
      case 'Expired': return '#dc3545';
      case 'Claimed': return '#fd7e14';
      case 'Under Claim Review': return '#17a2b8';
      case 'Pending': return '#ffc107';
      case 'Cancelled': return '#6f42c1';
      case 'Renewed': return '#6610f2';
      default: return '#6c757d';
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  };

  const canRenewPolicy = (policy) => {
    const daysUntilExpiry = getDaysUntilExpiry(policy.expiry_date);
    return daysUntilExpiry <= 30;
  };

  const getRealisticClaimReasons = (policyType) => {
    const type = policyType ? policyType.toLowerCase() : '';
    
    if (type.includes('health') || type.includes('medical')) {
      return [
        "Hospitalization for accident treatment",
        "Surgery for appendicitis", 
        "Emergency room visit for chest pain",
        "Treatment for diabetes complications",
        "Medical tests and consultation fees",
        "Physiotherapy treatment",
        "Prescription medication costs"
      ];
    }
    
    if (type.includes('auto') || type.includes('vehicle') || type.includes('car')) {
      return [
        "Vehicle collision damage repair",
        "Theft of vehicle parts",
        "Natural disaster damage (flood/hail)",
        "Third-party property damage",
        "Engine failure due to accident",
        "Windshield replacement",
        "Tire damage from road hazards"
      ];
    }
    
    if (type.includes('life')) {
      return [
        "Accidental death benefit claim",
        "Terminal illness benefit",
        "Disability benefit claim", 
        "Critical illness coverage",
        "Maturity benefit claim",
        "Partial withdrawal benefit"
      ];
    }
    
    if (type.includes('travel')) {
      return [
        "Medical emergency abroad",
        "Trip cancellation due to illness",
        "Lost baggage compensation",
        "Flight delay compensation",
        "Emergency evacuation costs",
        "Trip interruption coverage"
      ];
    }
    
    return [
      "Property damage due to natural disaster",
      "Theft or burglary claim",
      "Fire damage compensation",
      "General insurance claim",
      "Equipment failure coverage"
    ];
  };

  if (loading) {
    return (
      <div className="claim-renewal-container">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <span className="back-arrow">←</span>
          Back
        </button>

        <div className="main-card">
          <div className="loading-container">
            <div className="spinner"></div>
            <div>Loading your policies...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="claim-renewal-container">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <span className="back-arrow">←</span>
          Back
        </button>

        <div className="main-card">
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button 
              onClick={fetchPolicies}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-renewal-container">
      <button
        onClick={() => navigate(-1)}
        className="back-button"
      >
        <span className="back-arrow">←</span>
        Back
      </button>

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

      <div className="main-card">
        <div className="header">
          <h2 className="title">Policy Management</h2>
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {policies.length === 0 ? (
          <div className="no-policies-container">
            <h3>No Policies Found</h3>
            <p>You haven't purchased any policies yet.</p>
            <button
              onClick={() => navigate("/policy-form")}
              className="browse-button"
            >
              Browse Policies
            </button>
          </div>
        ) : (
          <div className="policies-container">
            {policies.map((policy) => {
              const expiryDate = new Date(policy.expiry_date);
              const daysUntilExpiry = getDaysUntilExpiry(policy.expiry_date);
              const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              const isExpired = daysUntilExpiry <= 0;
              const canRenew = canRenewPolicy(policy);

              return (
                <div 
                  key={policy.id} 
                  className={`policy-card ${isExpired ? 'policy-card-expired' : ''}`}
                  style={{
                    opacity: processingRenewal === policy.id ? 0.7 : 1
                  }}
                >
                  <div 
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(policy.status)
                    }}
                  >
                    {policy.status}
                  </div>

                  {processingRenewal === policy.id && (
                    <div className="processing-overlay">
                      <div className="processing-spinner"></div>
                      <div>Processing renewal...</div>
                    </div>
                  )}

                  <div className="policy-header">
                    <h3 className="policy-name">
                      {policy.policy_name}
                    </h3>
                    <div className="policy-details">
                      <div className="detail-item">
                        <div className="detail-label">Policy ID:</div>
                        <div className="detail-value">{policy.policy_id}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Policy Type:</div>
                        <div className="detail-value">{policy.policy_type}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Coverage:</div>
                        <div className="detail-value">{formatCurrency(policy.coverage_amount)}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Premium:</div>
                        <div className="detail-value">{formatCurrency(policy.premium)}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Policy Term:</div>
                        <div className="detail-value">{policy.policy_term} year(s)</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Purchased:</div>
                        <div className="detail-value">{new Date(policy.purchased_at).toLocaleDateString()}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Expires:</div>
                        <div className="detail-value">
                          {expiryDate.toLocaleDateString()}
                          {isExpiringSoon && (
                            <span className="expiry-warning">
                              (Expires in {daysUntilExpiry} days)
                            </span>
                          )}
                          {isExpired && (
                            <span className="expiry-expired">
                              (Expired)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Installment:</div>
                        <div className="detail-value">
                          #{policy.installment_no}
                          {policy.is_renewal && (
                            <span className="renewal-badge">(Renewal)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button
                      onClick={() => {
                        setClaimingPolicy(policy);
                        setClaimForm({ claimAmount: '', claimReason: '', customReason: '' });
                        setClaimDocuments([]);
                      }}
                      disabled={policy.status !== 'Active' || isExpired || processingRenewal === policy.id}
                      className={`button ${(policy.status === 'Active' && !isExpired) ? 'claim-button' : 'claim-button-disabled'}`}
                      title={isExpired ? "Cannot claim expired policy" : policy.status === 'Claimed' ? "Policy already claimed" : "File insurance claim"}
                    >
                      {policy.status === 'Claimed' ? 'Claimed' : 'File Claim'}
                    </button>

                    <button
                      onClick={() => handleRenew(policy)}
                      disabled={processingRenewal === policy.id || !canRenew}
                      className={`button ${canRenew ? 'renew-button' : 'renew-button-disabled'}`}
                      title={canRenew ? "Renew policy" : "Policy can only be renewed 30 days before expiry"}
                    >
                      {processingRenewal === policy.id ? 'Processing...' : 'Renew Now'}
                    </button>

                    <button
                      onClick={() => handleDelete(policy)}
                      className="button delete-button"
                    >
                      Delete
                    </button>
                  </div>

                  {claimingPolicy?.id === policy.id && (
                    <div className="claim-form">
                      <h4 className="claim-form-title">Submit a Claim</h4>
                      <div className="form-group">
                        <input
                          type="number"
                          placeholder="Claim Amount"
                          value={claimForm.claimAmount}
                          onChange={(e) => setClaimForm({ ...claimForm, claimAmount: e.target.value })}
                          className="input"
                        />
                        <select
                          value={claimForm.claimReason}
                          onChange={(e) => setClaimForm({ ...claimForm, claimReason: e.target.value })}
                          className="select"
                        >
                          <option value="">Select Claim Reason</option>
                          {getRealisticClaimReasons(policy.policy_type).map((reason, idx) => (
                            <option key={idx} value={reason}>{reason}</option>
                          ))}
                          <option value="other">Other</option>
                        </select>

                        {claimForm.claimReason === "other" && (
                          <input
                            type="text"
                            placeholder="Enter custom reason"
                            value={claimForm.customReason || ""}
                            onChange={(e) =>
                              setClaimForm({ ...claimForm, customReason: e.target.value })
                            }
                            className="input"
                          />
                        )}

                        <div className="document-upload-section">
                          <label className="upload-label">Upload Supporting Documents</label>
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleDocumentUpload}
                            className="file-input"
                          />
                          <div className="upload-info">
                            Accepted formats: JPG, PNG, PDF. Maximum 5MB per file, 5 files total.
                          </div>

                          {claimDocuments.length > 0 && (
                            <div className="uploaded-documents">
                              <h5>Uploaded Documents:</h5>
                              {claimDocuments.map((doc) => (
                                <div key={doc.id} className="document-item">
                                  <div className="document-info">
                                    <div className="document-name">{doc.name}</div>
                                    <div className="document-size">{formatFileSize(doc.size)}</div>
                                    <div className={`document-status ${doc.uploaded ? 'document-uploaded' : 'document-pending'}`}>
                                      {doc.uploaded ? '✓ Uploaded' : 'Pending upload'}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeDocument(doc.id)}
                                    className="remove-document"
                                    title="Remove document"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {uploadingDocuments && (
                            <div className="upload-progress">
                              <div className="upload-spinner"></div>
                              <span>Uploading documents...</span>
                            </div>
                          )}
                        </div>

                        <div className="form-actions">
                          <button
                            onClick={() => handleClaim(policy)}
                            disabled={submittingClaim || uploadingDocuments}
                            className={`submit-button ${(submittingClaim || uploadingDocuments) ? 'submit-button-disabled' : ''}`}
                          >
                            {submittingClaim ? "Submitting..." : uploadingDocuments ? "Uploading..." : "Submit Claim"}
                          </button>
                          <button
                            onClick={() => {
                              setClaimingPolicy(null);
                              setClaimDocuments([]);
                            }}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimRenewal;