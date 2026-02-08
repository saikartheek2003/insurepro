import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

// Centralized API URL for production and local development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const HeroSection = ({ navigateTo, isLoggedIn }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userPolicies, setUserPolicies] = useState([]);
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch user policies from backend
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserPolicies();
    }
  }, [isLoggedIn, user]);

  const fetchUserPolicies = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Updated: Using dynamic API_BASE_URL
      const response = await axios.get(`${API_BASE_URL}/user-policies`, { 
        withCredentials: true 
      });
      
      console.log("Raw API response:", response.data);
      
      const policiesData = response.data.policies || [];
      
      const policies = policiesData.map((p) => {
        const expiry = new Date(p.expiry_date);
        const today = new Date();
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        let status = p.status || "Active";
        if (status === "Active" && daysLeft <= 30 && daysLeft > 0) {
          status = "Expiring Soon";
        } else if (daysLeft <= 0) {
          status = "Expired";
        }

        return {
          id: p.id,
          type: p.policy_type || "General Insurance",
          planName: p.policy_name || "Insurance Policy",
          premium: `₹${parseFloat(p.premium || 0).toLocaleString("en-IN")}/year`,
          coverage: `₹${parseFloat(p.coverage_amount || 0).toLocaleString("en-IN")}`,
          status,
          renewalDate: p.expiry_date,
          icon: getIconForPolicyType(p.policy_type),
        };
      });
      
      setUserPolicies(policies);
      console.log("Processed policies:", policies);
      
    } catch (err) {
      console.error("Error fetching policies:", err);
      setError("Failed to load policies");
      
      if (err.response?.status === 401) {
        setError("Please log in again to view your policies");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getIconForPolicyType = (policyType) => {
    if (!policyType) return "📄";
    
    const type = policyType.toLowerCase();
    if (type.includes("health")) return "🏥";
    if (type.includes("life")) return "🛡️";
    if (type.includes("auto") || type.includes("vehicle")) return "🚗";
    if (type.includes("home") || type.includes("property")) return "🏠";
    return "📄";
  };

  // FIXED: Navigation handlers with proper routing
  const handleFileClaimClick = () => {
    console.log("File Claim clicked - navigating to claim-renewal");
    try {
      navigate("/claim-renewal");
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/claim-renewal";
    }
  };

  const handleManageClick = () => {
    console.log("Manage clicked - navigating to claim-renewal");
    try {
      navigate("/claim-renewal");
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/claim-renewal";
    }
  };

  const handleExplorePoliciesClick = () => {
    console.log("Explore Policies clicked - navigating to policy-form");
    try {
      navigate("/policy-form");
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/policy-form";
    }
  };

  const handleExploreClick = () => {
    const targetRoute = isLoggedIn ? "/policy-form" : "/login";
    console.log("Explore clicked - navigating to:", targetRoute);
    try {
      navigate(targetRoute);
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = targetRoute;
    }
  };

  // Manage Policy navigation
  const handleManagePolicy = (policy) => {
    if (!policy || !policy.id) {
      console.error("No policy selected");
      return;
    }
    
    console.log("Managing policy:", policy.id);
    try {
      navigate("/claim-renewal", { state: { policyId: policy.id } });
    } catch (error) {
      console.error("Policy management navigation error:", error);
      window.location.href = "/claim-renewal";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "#10b981";
      case "Expiring Soon":
        return "#f59e0b";
      case "Expired":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const calculateTotalCoverage = () => {
    return userPolicies.reduce((sum, policy) => {
      const coverage = policy.coverage.replace(/[₹,]/g, "");
      const amount = parseInt(coverage) || 0;
      return sum + amount;
    }, 0);
  };

  // Styles object
  const styles = {
    // Pre-login Hero Styles
    heroSection: {
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      padding: '80px 20px 60px',
      overflow: 'hidden',
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                       radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
      animation: 'float 6s ease-in-out infinite',
    },
    heroContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    },
    heroContent: {
      textAlign: 'center',
      marginBottom: '60px',
    },
    heroBadge: {
      display: 'inline-block',
      padding: '8px 16px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '25px',
      backdropFilter: 'blur(10px)',
      marginBottom: '20px',
      border: '1px solid rgba(255,255,255,0.3)',
    },
    badgeText: {
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
    },
    heroTitle: {
      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
      fontWeight: '800',
      color: 'white',
      marginBottom: '20px',
      lineHeight: '1.1',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    heroTitleSpan: {
      background: 'linear-gradient(45deg, #ffd89b 0%, #19547b 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      position: 'relative',
    },
    heroSubtitle: {
      fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
      margin: '0 auto 40px',
      color: 'rgba(255,255,255,0.9)',
      maxWidth: '600px',
      lineHeight: '1.6',
    },
    heroActions: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: '50px',
    },
    heroCta: {
      padding: '16px 32px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: '#fff',
      border: 'none',
      borderRadius: '50px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
      transform: 'translateY(0)',
    },
    ctaArrow: {
      fontSize: '1.2rem',
      transition: 'transform 0.3s ease',
    },
    secondaryBtn: {
      padding: '16px 32px',
      backgroundColor: 'transparent',
      color: 'white',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '50px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
    },
    trustIndicators: {
      display: 'flex',
      justifyContent: 'center',
      gap: '40px',
      flexWrap: 'wrap',
    },
    trustItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'rgba(255,255,255,0.9)',
      fontSize: '14px',
      fontWeight: '500',
    },
    trustIcon: {
      fontSize: '16px',
    },
    exploreMoreBtn: {
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.8)',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '30px',
      maxWidth: '900px',
      margin: '0 auto',
    },
    featureCard: {
      padding: '30px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '20px',
      textAlign: 'center',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255,255,255,0.2)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    featureIcon: {
      fontSize: '3rem',
      marginBottom: '20px',
      display: 'block',
    },
    featureTitle: {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: 'white',
      marginBottom: '15px',
    },
    featureDesc: {
      color: 'rgba(255,255,255,0.8)',
      lineHeight: '1.6',
    },

    // Post-login Dashboard Styles
    loggedInHeroSection: {
      padding: '40px 20px 60px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
    },
    welcomeSection: {
      marginBottom: '40px',
      padding: '30px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '20px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
    },
    welcomeContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '20px',
    },
    avatarSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: '700',
    },
    welcomeTitle: {
      fontSize: 'clamp(1.8rem, 3vw, 2.2rem)',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '5px',
    },
    userName: {
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
    },
    welcomeSubtitle: {
      color: '#6b7280',
      fontSize: '1.1rem',
    },
    quickActions: {
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap',
    },
    quickActionBtn: {
      padding: '12px 20px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '60px 20px',
      fontSize: '16px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255,255,255,0.3)',
      borderTop: '4px solid #fff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    errorMessage: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '25px',
      backgroundColor: 'rgba(254, 242, 242, 0.95)',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      margin: '20px 0',
      backdropFilter: 'blur(10px)',
    },
    errorIcon: {
      fontSize: '24px',
    },
    retryButton: {
      marginTop: '10px',
      padding: '8px 16px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '25px',
      margin: '40px 0',
    },
    statCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '25px',
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '16px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      backdropFilter: 'blur(10px)',
    },
    statIconWrapper: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      fontSize: '1.5rem',
      filter: 'grayscale(1) brightness(0) invert(1)',
    },
    statContent: {
      textAlign: 'left',
    },
    statNumber: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '5px',
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6b7280',
      fontWeight: '500',
    },
    policiesSection: {
      marginTop: '40px',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '1.6rem',
      fontWeight: '700',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    sectionIcon: {
      fontSize: '1.4rem',
    },
    toggleButton: {
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
    },
    toggleIcon: {
      fontSize: '12px',
    },
    noPoliciesMessage: {
      textAlign: 'center',
      padding: '60px 40px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '20px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
    },
    noPoliciesIcon: {
      fontSize: '4rem',
      marginBottom: '20px',
      opacity: '0.5',
    },
    noPoliciesTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#374151',
      marginBottom: '15px',
    },
    noPoliciesText: {
      color: '#6b7280',
      marginBottom: '30px',
      lineHeight: '1.6',
    },
    policiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '25px',
    },
    policyCard: {
      padding: '25px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '18px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255,255,255,0.3)',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
    },
    policyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    policyIconWrapper: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    policyIcon: {
      fontSize: '1.8rem',
    },
    policyStatus: {},
    statusBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      color: '#fff',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    policyContent: {
      marginBottom: '25px',
    },
    policyType: {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px',
    },
    policyPlan: {
      fontSize: '1rem',
      color: '#6b7280',
      marginBottom: '20px',
      fontWeight: '500',
    },
    policyDetails: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    detailItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #f1f5f9',
    },
    detailLabel: {
      fontWeight: '600',
      color: '#374151',
      fontSize: '0.9rem',
    },
    detailValue: {
      color: '#667eea',
      fontWeight: '700',
      fontSize: '0.9rem',
    },
    policyActions: {
      display: 'flex',
      gap: '12px',
    },
    actionButtonPrimary: {
      flex: 1,
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: '#fff',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
    },
    actionButtonSecondary: {
      flex: 1,
      backgroundColor: '#f8fafc',
      color: '#374151',
      padding: '12px 20px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
    },
    actionSection: {
      marginTop: '50px',
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap',
      padding: '30px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '20px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
    },
    primaryAction: {
      padding: '16px 32px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    },
    secondaryAction: {
      padding: '16px 32px',
      backgroundColor: '#f8fafc',
      color: '#374151',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
    },
    actionIcon: {
      fontSize: '1.1rem',
    },
  };

  // Non-logged in user hero section
  if (!isLoggedIn) {
    return (
      <section className="hero-section" style={styles.heroSection}>
        <div style={styles.backgroundPattern}></div>
        
        <div className="container hero-container" style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>
              <span style={styles.badgeText}>🛡️ Trusted by 1M+ customers</span>
            </div>
            
            <h1 className="hero-title" style={styles.heroTitle}>
              Secure Your Future with{" "}
              <span className="hero-title-span" style={styles.heroTitleSpan}>
                InsurePro
              </span>
            </h1>
            
            <p className="hero-subtitle" style={styles.heroSubtitle}>
              Reliable insurance plans that protect you and your loved ones. Fast,
              transparent, and hassle-free policies tailored just for you.
            </p>
            
            <div style={styles.heroActions}>
              <button
                onClick={handleFileClaimClick}
                className="hero-cta"
                style={styles.heroCta}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
                }}
              >
                File a Claim
                <span style={styles.ctaArrow}>→</span>
              </button>
              
              <button
                onClick={handleManageClick}
                style={styles.secondaryBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Manage Policies
              </button>
            </div>
            
            <div style={styles.trustIndicators}>
              <div style={styles.trustItem}>
                <span style={styles.trustIcon}>⚡</span>
                <span>Instant Approval</span>
              </div>
              <div style={styles.trustItem}>
                <span style={styles.trustIcon}>🔒</span>
                <span>100% Secure</span>
              </div>
              <div style={styles.trustItem}>
                <span style={styles.trustIcon}>📞</span>
                <span>24/7 Support</span>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button 
                onClick={handleExplorePoliciesClick}
                style={styles.exploreMoreBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Explore More Policies →
              </button>
            </div>
          </div>
          
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🏥</div>
              <h3 style={styles.featureTitle}>Health Insurance</h3>
              <p style={styles.featureDesc}>Comprehensive medical coverage for you and your family</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🛡️</div>
              <h3 style={styles.featureTitle}>Life Insurance</h3>
              <p style={styles.featureDesc}>Protect your family's financial future</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🚗</div>
              <h3 style={styles.featureTitle}>Auto Insurance</h3>
              <p style={styles.featureDesc}>Complete protection for your vehicle</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Logged-in user dashboard hero section
  return (
    <section className="hero-section" style={styles.loggedInHeroSection}>
      <div className="container hero-container" style={styles.heroContainer}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <div style={styles.welcomeContent}>
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                {(user?.firstName || user?.email?.split("@")[0] || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={styles.welcomeTitle}>
                  Welcome back,{" "}
                  <span style={styles.userName}>
                    {user?.firstName || user?.email?.split("@")[0] || "User"}
                  </span>
                </h1>
                <p style={styles.welcomeSubtitle}>
                  Here's an overview of your insurance portfolio
                </p>
              </div>
            </div>
            <div style={styles.quickActions}>
              <button 
                onClick={handleFileClaimClick} 
                style={styles.quickActionBtn}
              >
                📋 File Claim
              </button>
              <button 
                onClick={() => {
                  try {
                    navigate("/support");
                  } catch (error) {
                    window.location.href = "/support";
                  }
                }} 
                style={styles.quickActionBtn}
              >
                💬 Support
              </button>
            </div>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div style={styles.loadingMessage}>
            <div style={styles.spinner}></div>
            Loading your policies...
          </div>
        )}

        {error && (
          <div style={styles.errorMessage}>
            <div style={styles.errorIcon}>⚠️</div>
            <div>
              <p>{error}</p>
              <button onClick={fetchUserPolicies} style={styles.retryButton}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!loading && !error && (
          <>
            <div style={styles.statsContainer}>
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <div style={styles.statIcon}>📋</div>
                </div>
                <div style={styles.statContent}>
                  <div style={styles.statNumber}>{userPolicies.length}</div>
                  <div style={styles.statLabel}>Active Policies</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <div style={styles.statIcon}>💰</div>
                </div>
                <div style={styles.statContent}>
                  <div style={styles.statNumber}>
                    ₹{calculateTotalCoverage().toLocaleString("en-IN")}
                  </div>
                  <div style={styles.statLabel}>Total Coverage</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <div style={styles.statIcon}>⚡</div>
                </div>
                <div style={styles.statContent}>
                  <div style={styles.statNumber}>
                    {userPolicies.filter((p) => p.status === "Expiring Soon").length}
                  </div>
                  <div style={styles.statLabel}>Need Renewal</div>
                </div>
              </div>
            </div>

            {/* Policies Overview */}
            <div style={styles.policiesSection}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>📋</span>
                  Your Insurance Policies
                </h2>
                {userPolicies.length > 2 && (
                  <button
                    onClick={() => setShowAllPolicies(!showAllPolicies)}
                    style={styles.toggleButton}
                  >
                    {showAllPolicies ? "Show Less" : "View All"}
                    <span style={styles.toggleIcon}>
                      {showAllPolicies ? "↑" : "↓"}
                    </span>
                  </button>
                )}
              </div>

              {userPolicies.length === 0 ? (
                <div style={styles.noPoliciesMessage}>
                  <div style={styles.noPoliciesIcon}>📄</div>
                  <h3 style={styles.noPoliciesTitle}>No Policies Found</h3>
                  <p style={styles.noPoliciesText}>
                    Start by exploring our insurance options and find the perfect coverage for you!
                  </p>
                  <button onClick={handleExplorePoliciesClick} style={styles.primaryAction}>
                    Browse Policies
                  </button>
                </div>
              ) : (
                <div style={styles.policiesGrid}>
                  {(showAllPolicies
                    ? userPolicies
                    : userPolicies.slice(0, 2)
                  ).map((policy, index) => (
                    <div
                      key={policy.id}
                      style={{
                        ...styles.policyCard,
                        animationDelay: `${index * 0.1}s`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
                      }}
                    >
                      <div style={styles.policyHeader}>
                        <div style={styles.policyIconWrapper}>
                          <div style={styles.policyIcon}>{policy.icon}</div>
                        </div>
                        <div style={styles.policyStatus}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: getStatusColor(policy.status),
                            }}
                          >
                            {policy.status}
                          </span>
                        </div>
                      </div>

                      <div style={styles.policyContent}>
                        <h3 style={styles.policyType}>{policy.type}</h3>
                        <p style={styles.policyPlan}>{policy.planName}</p>

                        <div style={styles.policyDetails}>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Coverage:</span>
                            <span style={styles.detailValue}>{policy.coverage}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Premium:</span>
                            <span style={styles.detailValue}>{policy.premium}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Renewal:</span>
                            <span style={styles.detailValue}>
                              {formatDate(policy.renewalDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={styles.policyActions}>
                        <button style={styles.actionButtonSecondary}>
                          View Details
                        </button>
                        <button 
                          style={styles.actionButtonPrimary}
                          onClick={() => handleManagePolicy(policy)}
                        >
                          {policy.status === "Expiring Soon" ? "Renew Now" : "Manage"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={styles.actionSection}>
              <button onClick={handleExplorePoliciesClick} style={styles.primaryAction}>
                <span style={styles.actionIcon}>🔍</span>
                Explore More Policies
              </button>
              <button onClick={handleFileClaimClick} style={styles.secondaryAction}>
                <span style={styles.actionIcon}>📋</span>
                File a Claim
              </button>
              <button onClick={() => {
                try {
                  navigate("/profile");
                } catch (error) {
                  window.location.href = "/profile";
                }
              }} style={styles.secondaryAction}>
                <span style={styles.actionIcon}>👤</span>
                Manage Profile
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .hero-section .feature-card:hover {
          transform: translateY(-10px) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
        }
        
        .hero-cta:hover .cta-arrow {
          transform: translateX(5px);
        }
        
        @media (max-width: 768px) {
          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .trust-indicators {
            flex-direction: column;
            gap: 20px;
          }
          
          .welcome-content {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .quick-actions {
            align-self: stretch;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;