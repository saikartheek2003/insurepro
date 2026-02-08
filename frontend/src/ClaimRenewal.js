import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './ClaimRenewal.css';

// Centralized API URL for production and local development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
      
      // Updated to use dynamic API_BASE_URL
      const response = await axios.get(`${API_BASE_URL}/user-policies`, { 
        withCredentials: true 
      });
      
      const policies = response.data.policies || [];
      setPolicies(policies);
      
    } catch (err) {
      console.error("Error fetching policies:", err);
      if (err.response?.status === 401) {
        setError("Please log in again to view your policies");
        navigate("/login");
      } else {
        setError("Failed to fetch policies. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024; 
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} is not a supported file type.`, "error");
        return false;
      }
      if (file.size > maxSize) {
        showToast(`${file.name} is too large (Max 5MB).`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length + claimDocuments.length > 5) {
      showToast("Maximum 5 documents per claim.", "error");
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

  const handleClaim = async (policy) => {
    const finalReason = claimForm.claimReason === 'other' ? claimForm.customReason : claimForm.claimReason;
    
    if (!claimForm.claimAmount || !finalReason) {
      showToast("Please fill in all claim details", "error");
      return;
    }
    if (parseFloat(claimForm.claimAmount) > parseFloat(policy.coverage_amount)) {
      showToast("Claim amount cannot exceed coverage amount", "error");
      return;
    }

    setSubmittingClaim(true);
    try {
      const formData = new FormData();
      formData.append("policy_id", policy.id);
      formData.append("claim_amount", parseFloat(claimForm.claimAmount));
      formData.append("claim_reason", finalReason);
      formData.append("claim_type", 'General');

      claimDocuments.forEach(doc => {
        formData.append("documents", doc.file); 
      });
      
      // Updated to use dynamic API_BASE_URL
      const response = await axios.post(
        `${API_BASE_URL}/user/claims`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setPolicies(prev => prev.map(p => 
          p.id === policy.id 
            ? { ...p, status: 'Under Claim Review' }
            : p
        ));
        showToast(`Claim submitted! Number: ${response.data.claim.claim_number}`, "success");
        setClaimingPolicy(null);
        setClaimForm({ claimAmount: '', claimReason: '', customReason: '' });
        setClaimDocuments([]);
      } else {
        showToast(response.data.message || "Failed to submit claim", "error");
      }
    } catch (err) {
      console.error("Claim submission error:", err);
      showToast(err.response?.data?.message || "Failed to submit claim.", "error");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleRenew = async (policy) => {
    try {
      setProcessingRenewal(policy.id);
      
      // Updated to use dynamic API_BASE_URL
      const response = await axios.get(
        `${API_BASE_URL}/policy-renewal/${policy.id}`,
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
            successRedirect: `/claim-renewal?payment=success&renewalId=${renewalData.renewalId}`
          }
        });
        
        showToast(`Redirecting to payment...`, "success");
        
      } else {
        showToast(response.data?.message || "Not eligible for renewal", "error");
      }
      
    } catch (err) {
      console.error("Renewal error:", err);
      showToast("Failed to process renewal.", "error");
    } finally {
      setProcessingRenewal(null);
    }
  };

  const handleDelete = async (policy) => {
    const isExpired = new Date(policy.expiry_date) <= new Date();
    if (policy.status === 'Active' && !isExpired) {
      showToast("Cannot delete active policies.", "error");
      return;
    }

    if (window.confirm(`Delete policy "${policy.policy_name}"?`)) {
      try {
        // Updated to use dynamic API_BASE_URL
        const response = await axios.delete(`${API_BASE_URL}/policy/${policy.id}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setPolicies(prev => prev.filter(p => p.id !== policy.id));
          showToast("Policy deleted successfully", "success");
        }
      } catch (err) {
        showToast("Failed to delete policy.", "error");
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
      case 'Under Claim Review': return '#17a2b8';
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
    if (type.includes('health')) return ["Hospitalization", "Surgery", "Medical Tests"];
    if (type.includes('auto')) return ["Accident Repair", "Theft", "Natural Disaster"];
    return ["General damage", "Theft", "Fire damage"];
  };

  // Rendering logic stays the same...
  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="claim-renewal-container">
        {/* Your UI Components here - using the logic above */}
        {/* Note: In your handleClaim logic above, I fixed the document append to use doc.file */}
        <button onClick={() => navigate(-1)} className="back-button">Back</button>
        
        {toast.show && <div className={`toast ${toast.type}`}>{toast.message}</div>}

        <div className="main-card">
            <h2 className="title">Policy Management</h2>
            {policies.map(policy => (
                <div key={policy.id} className="policy-card">
                    <h3>{policy.policy_name}</h3>
                    <p>Status: <span style={{color: getStatusColor(policy.status)}}>{policy.status}</span></p>
                    <button onClick={() => handleRenew(policy)} disabled={!canRenewPolicy(policy)}>Renew</button>
                    <button onClick={() => setClaimingPolicy(policy)}>Claim</button>
                    <button onClick={() => handleDelete(policy)}>Delete</button>

                    {claimingPolicy?.id === policy.id && (
                        <div className="claim-form">
                            <input type="number" placeholder="Amount" onChange={(e) => setClaimForm({...claimForm, claimAmount: e.target.value})} />
                            <input type="file" multiple onChange={handleDocumentUpload} />
                            <button onClick={() => handleClaim(policy)}>Submit Claim</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default ClaimRenewal;