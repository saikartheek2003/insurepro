import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const Profile = ({ navigateTo, onLogout }) => {
  const { 
    user, 
    isLoading: authLoading, 
    isAuthenticated, 
    logout 
  } = useAuth();
  
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPoliciesDropdownOpen, setIsPoliciesDropdownOpen] = useState(false);
  const [claimingPolicy, setClaimingPolicy] = useState(null);
  const [claimForm, setClaimForm] = useState({
    claimAmount: '',
    claimReason: ''
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchPolicies();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/user-policies", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Profile API response:", data);
        setPolicies(data.policies || []);
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => handleLogout(), 2000);
      } else {
        setError("Failed to fetch policies");
      }
    } catch (err) {
      console.error("Fetch policies error:", err);
      setError("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout && typeof logout === "function") {
        await logout();
      }
      if (onLogout && typeof onLogout === "function") {
        onLogout();
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleClaim = async (policy) => {
    if (!claimForm.claimAmount || !claimForm.claimReason) {
      alert("Please fill in all claim details");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/user/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policyId: policy.id,
          claimAmount: parseFloat(claimForm.claimAmount),
          claimReason: claimForm.claimReason
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Claim submitted successfully! Claim ID: ${result.claimId}`);
        setClaimingPolicy(null);
        setClaimForm({ claimAmount: '', claimReason: '' });
      } else {
        const error = await response.json();
        alert(`Failed to submit claim: ${error.message}`);
      }
    } catch (err) {
      console.error("Claim submission error:", err);
      alert("Failed to submit claim");
    }
  };

  const handleRenew = async (policy) => {
    try {
      const response = await fetch(`http://localhost:5000/api/policy-renewal/${policy.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        // Create renewal data object
        const renewalData = {
          policy: data.policy,
          isRenewal: true,
          renewal: true
        };
        
        // Use navigateTo if available, otherwise fallback to direct navigation
        if (navigateTo && typeof navigateTo === 'function') {
          navigateTo("payment", renewalData);
        } else {
          // Store renewal data in sessionStorage for PaymentPage to pick up
          sessionStorage.setItem('renewalData', JSON.stringify(renewalData));
          window.location.href = "/payment";
        }
      } else {
        alert("Failed to load renewal details");
      }
    } catch (err) {
      console.error("Renewal error:", err);
      alert("Failed to process renewal");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusColor = (status, expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (status !== 'Active') return '#dc3545'; // Red for inactive
    if (daysUntilExpiry <= 30) return '#ffc107'; // Yellow for expiring soon
    return '#28a745'; // Green for active
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  };

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <div style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          color: "#856404",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          maxWidth: "400px",
          margin: "0 auto 20px"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Not Logged In</h3>
          <p style={{ margin: 0 }}>Please log in to view your profile and policies.</p>
        </div>
        <button
          onClick={() => navigateTo && navigateTo("login")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#667eea",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", fontFamily: "Arial, sans-serif", padding: "0 20px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
          <div>
            <h2 style={{ margin: "0 0 5px 0", color: "#333" }}>Insurance Dashboard</h2>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
              {user && user.email ? user.email : "User"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Logout
          </button>
        </div>

        {/* Policy Overview Stats */}
        <div style={{ marginTop: "25px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "24px" }}>{policies.length}</h3>
            <p style={{ margin: 0, color: "#666" }}>Total Policies</p>
          </div>
          <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#28a745", fontSize: "24px" }}>
              {policies.filter(p => p.status === 'Active').length}
            </h3>
            <p style={{ margin: 0, color: "#666" }}>Active Policies</p>
          </div>
          <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "24px" }}>
              {formatCurrency(policies.reduce((sum, p) => sum + parseFloat(p.premium || 0), 0))}
            </h3>
            <p style={{ margin: 0, color: "#666" }}>Total Premiums</p>
          </div>
        </div>

        {/* My Policies Section */}
        <div style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ color: "#333", margin: 0 }}>My Policies</h3>
            <button
              onClick={() => setIsPoliciesDropdownOpen(!isPoliciesDropdownOpen)}
              style={{
                padding: "8px 16px",
                backgroundColor: isPoliciesDropdownOpen ? "#6c757d" : "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {isPoliciesDropdownOpen ? "Hide" : "Show"} Policies ({policies.length})
            </button>
          </div>

          {isPoliciesDropdownOpen && (
            <div style={{ border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <p style={{ margin: 0, color: "#666" }}>Loading policies...</p>
                </div>
              ) : error ? (
                <div style={{ padding: "15px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" }}>
                  <strong>Error:</strong> {error}
                  <button 
                    onClick={fetchPolicies}
                    style={{
                      marginLeft: "10px",
                      padding: "4px 8px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : policies.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#666" }}>
                  <p style={{ margin: "0 0 10px 0" }}>No policies found</p>
                  <small>Your purchased policies will appear here</small>
                  <br />
                  <button
                    onClick={() => navigateTo && navigateTo("policies")}
                    style={{
                      marginTop: "15px",
                      padding: "10px 20px",
                      backgroundColor: "#667eea",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Browse Policies
                  </button>
                </div>
              ) : (
                <div>
                  {policies.map((policy, index) => {
                    const expiryDate = new Date(policy.expiry_date);
                    const daysUntilExpiry = getDaysUntilExpiry(policy.expiry_date);
                    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    const isExpired = daysUntilExpiry <= 0;
                    
                    return (
                      <div 
                        key={policy.id || index} 
                        style={{ 
                          padding: "20px", 
                          borderBottom: index < policies.length - 1 ? "1px solid #dee2e6" : "none",
                          backgroundColor: index % 2 === 0 ? "#f8f9fa" : "#fff"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "18px" }}>
                              {policy.policy_name}
                            </h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", fontSize: "14px", color: "#666" }}>
                              <p style={{ margin: "0" }}>
                                <strong>Type:</strong> {policy.policy_type}
                              </p>
                              <p style={{ margin: "0" }}>
                                <strong>Coverage:</strong> {formatCurrency(policy.coverage_amount)}
                              </p>
                              <p style={{ margin: "0" }}>
                                <strong>Premium:</strong> {formatCurrency(policy.premium)}
                              </p>
                              <p style={{ margin: "0" }}>
                                <strong>Purchased:</strong> {new Date(policy.purchased_at).toLocaleDateString()}
                              </p>
                              <p style={{ margin: "0" }}>
                                <strong>Expires:</strong> {expiryDate.toLocaleDateString()}
                                {isExpiringSoon && (
                                  <span style={{ color: "#ffc107", fontWeight: "bold", marginLeft: "8px" }}>
                                    ({daysUntilExpiry} days left)
                                  </span>
                                )}
                                {isExpired && (
                                  <span style={{ color: "#dc3545", fontWeight: "bold", marginLeft: "8px" }}>
                                    (Expired)
                                  </span>
                                )}
                              </p>
                              <p style={{ margin: "0" }}>
                                <strong>Installment:</strong> #{policy.installment_no}
                                {policy.is_renewal && <span style={{ color: "#28a745", marginLeft: "5px" }}>(Renewal)</span>}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", marginLeft: "20px" }}>
                            <div style={{
                              backgroundColor: getStatusColor(policy.status, policy.expiry_date),
                              color: "white",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              marginBottom: "5px"
                            }}>
                              {policy.status}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => setClaimingPolicy(policy)}
                            disabled={policy.status !== 'Active' || isExpired}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: (policy.status === 'Active' && !isExpired) ? "#198754" : "#6c757d",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: (policy.status === 'Active' && !isExpired) ? "pointer" : "not-allowed",
                              fontSize: "13px",
                              fontWeight: "500"
                            }}
                            title={isExpired ? "Cannot claim expired policy" : "File insurance claim"}
                          >
                            File Claim
                          </button>
                          <button
                            onClick={() => handleRenew(policy)}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#0d6efd",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "500"
                            }}
                          >
                            Renew Policy
                          </button>
                        </div>

                        {/* Claim Form Modal */}
                        {claimingPolicy && claimingPolicy.id === policy.id && (
                          <div style={{
                            marginTop: "15px",
                            padding: "15px",
                            backgroundColor: "#e9ecef",
                            borderRadius: "6px",
                            border: "1px solid #dee2e6"
                          }}>
                            <h5 style={{ margin: "0 0 10px 0" }}>File Claim for {policy.policy_name}</h5>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              <input
                                type="number"
                                placeholder="Claim Amount"
                                value={claimForm.claimAmount}
                                onChange={(e) => setClaimForm({ ...claimForm, claimAmount: e.target.value })}
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  fontSize: "14px"
                                }}
                              />
                              <textarea
                                placeholder="Reason for claim"
                                value={claimForm.claimReason}
                                onChange={(e) => setClaimForm({ ...claimForm, claimReason: e.target.value })}
                                rows="3"
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  resize: "vertical"
                                }}
                              />
                              <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                  onClick={() => handleClaim(policy)}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#198754",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "13px"
                                  }}
                                >
                                  Submit Claim
                                </button>
                                <button
                                  onClick={() => {
                                    setClaimingPolicy(null);
                                    setClaimForm({ claimAmount: '', claimReason: '' });
                                  }}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#6c757d",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "13px"
                                  }}
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
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>Quick Actions</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigateTo && navigateTo("policies")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Buy New Policy
            </button>
            <button
              onClick={fetchPolicies}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#6c757d" : "#17a2b8",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px"
              }}
            >
              {loading ? "Refreshing..." : "Refresh Policies"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;