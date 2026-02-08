import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import {
  calculateTotalAmount,
  getPaymentBreakdown,
  formatCurrency,
} from "./PoliciesData";
import "./Payment.css";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [policyDetails, setPolicyDetails] = useState(
    location.state?.policy || location.state?.policyDetails || null
  );
  const [isRenewal] = useState(location.state?.renewal || location.state?.isRenewal || false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    console.log("=== PAYMENT PAGE MOUNTED ===");
    console.log("location.state:", location.state);
    console.log("policyDetails:", policyDetails);
    
    if (!policyDetails) {
      navigate("/buypolicy");
    }
  }, [policyDetails, navigate]);

  // Load Razorpay script dynamically
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  if (!policyDetails) return null;

  // FIXED: Simplified and more reliable amount extraction
  const getPremiumAmount = () => {
    // Try to get premium amount in order of preference
    if (policyDetails.premiumAmount && typeof policyDetails.premiumAmount === 'number') {
      return policyDetails.premiumAmount;
    }
    
    if (policyDetails.premium && typeof policyDetails.premium === 'string') {
      // Extract number from string like "₹12,500/year"
      const numericValue = policyDetails.premium.replace(/[^\d.-]/g, '');
      return parseFloat(numericValue) || 0;
    }
    
    if (policyDetails.amount) {
      return Number(policyDetails.amount);
    }
    
    if (policyDetails.totalAmount) {
      return Number(policyDetails.totalAmount);
    }
    
    if (policyDetails.price) {
      return Number(policyDetails.price);
    }
    
    console.error("Could not extract premium amount from policy:", policyDetails);
    return 0;
  };

  const premiumAmount = getPremiumAmount();
  
  // Calculate total amount using the utility function
  const calculateFinalAmount = () => {
    if (premiumAmount <= 0) {
      console.error("Invalid premium amount:", premiumAmount);
      return 0;
    }
    
    // Get deductible amount
    const deductibleAmount = policyDetails.deductibleAmount || 
                           (policyDetails.deductible ? parseFloat(policyDetails.deductible.replace(/[^\d.-]/g, '')) : 0) || 
                           0;
    
    // Use the utility function with correct parameters
    const totalAmount = calculateTotalAmount(premiumAmount, deductibleAmount, 18, 100);
    
    console.log("=== AMOUNT CALCULATION DEBUG ===");
    console.log("Premium Amount:", premiumAmount);
    console.log("Deductible Amount:", deductibleAmount);
    console.log("Final Total Amount:", totalAmount);
    console.log("===============================");
    
    return totalAmount;
  };

  const totalAmount = calculateFinalAmount();
  
  // Get payment breakdown for display
  const getBreakdownForDisplay = () => {
    if (premiumAmount <= 0) return null;
    
    // Create a temporary policy object with proper structure for breakdown calculation
    const tempPolicy = {
      ...policyDetails,
      premiumAmount: premiumAmount,
      deductibleAmount: policyDetails.deductibleAmount || 0
    };
    
    return getPaymentBreakdown(tempPolicy);
  };

  const breakdown = getBreakdownForDisplay();

  const savePolicyPurchase = async (paymentId) => {
    try {
      const policyData = {
        policy: {
          id: policyDetails.id || `${policyDetails.type || policyDetails.policyType}_${Date.now()}`,
          name: policyDetails.name || policyDetails.policyName || policyDetails.title,
          type: policyDetails.type || policyDetails.policyType,
          premium: policyDetails.premium,
          premiumAmount: premiumAmount,
          coverageAmount: policyDetails.coverageAmount || policyDetails.coverage,
          policyTerm: policyDetails.policyTerm || 1,
          policyName: policyDetails.name || policyDetails.policyName || policyDetails.title
        },
        transactionId: paymentId,
        paymentMethod: "Razorpay",
        totalAmountPaid: totalAmount,
        isRenewal,
        originalPurchaseId: isRenewal ? policyDetails.id : null
      };

      const response = await axios.post(
        "http://localhost:5000/api/purchase-policy",
        policyData,
        { withCredentials: true }
      );

      if (response.data) {
        console.log("✅ Policy purchase saved:", response.data);
      }
    } catch (err) {
      console.error("Error saving purchase:", err);
      alert("Payment processed but failed to save policy. Please contact support.");
    }
  };

  const handleRazorpayPayment = () => {
    // Validate amount before proceeding
    if (!totalAmount || totalAmount <= 0) {
      alert("Invalid payment amount. Please check your policy details and try again.");
      setIsProcessing(false);
      return;
    }

    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded. Please check your internet connection and try again.");
      setIsProcessing(false);
      return;
    }

    // Convert to paise (multiply by 100)
    const amountInPaise = Math.round(totalAmount * 100);
    
    console.log("=== RAZORPAY PAYMENT PROCESSING ===");
    console.log("- Premium Amount (INR):", premiumAmount);
    console.log("- Total Amount (INR):", totalAmount);
    console.log("- Amount in Paise:", amountInPaise);

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_1234567890",
      amount: amountInPaise, // Amount in paise
      currency: "INR",
      name: "Insurance Portal",
      description: `${isRenewal ? 'Policy Renewal' : 'Policy Payment'} - ${policyDetails.title || policyDetails.name || policyDetails.policyName}`,
      image: "https://example.com/your_logo.png",
      handler: async function (response) {
        console.log("Payment successful:", response);
        
        // Payment successful
        setTransactionId(response.razorpay_payment_id);
        await savePolicyPurchase(response.razorpay_payment_id);
        setPaymentSuccess(true);
        setIsProcessing(false);
      },
      prefill: {
        name: policyDetails.fullName || policyDetails.name || "",
        email: policyDetails.email || "",
        contact: policyDetails.mobile || policyDetails.phone || ""
      },
      notes: {
        policy_id: policyDetails.id,
        policy_type: policyDetails.type || policyDetails.policyType,
        policy_name: policyDetails.title || policyDetails.name || policyDetails.policyName,
        is_renewal: isRenewal.toString(),
        premium_amount: premiumAmount.toString(),
        total_amount_inr: totalAmount.toString()
      },
      theme: {
        color: "#0d6efd"
      },
      modal: {
        ondismiss: function() {
          console.log("Payment cancelled by user");
          setIsProcessing(false);
        },
        escape: true,
        backdropclose: false
      },
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error("Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description || 'Unknown error'}`);
        setIsProcessing(false);
      });

      console.log("Opening Razorpay checkout with amount:", amountInPaise, "paise");
      rzp.open();
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      alert("Failed to initialize payment gateway. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleProceedToPay = () => {
    if (!totalAmount || totalAmount <= 0) {
      alert("Cannot proceed with payment. Invalid amount detected.");
      return;
    }
    
    console.log("Proceeding to pay:", totalAmount);
    setIsProcessing(true);
    handleRazorpayPayment();
  };

  const handleGoBack = () => {
    navigate("/buypolicy");
  };

  const downloadReceipt = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Payment Receipt", 70, 20);
    doc.setFontSize(12);
    doc.text(`Policy: ${policyDetails?.title || policyDetails?.name || policyDetails?.policyName}`, 20, 40);
    doc.text(`Premium Amount: ${formatCurrency(premiumAmount)}`, 20, 50);
    doc.text(`Total Amount Paid: ${formatCurrency(totalAmount)}`, 20, 60);
    doc.text(`Transaction ID: ${transactionId}`, 20, 70);
    doc.text(`Payment Method: Razorpay`, 20, 80);
    doc.text(`Type: ${isRenewal ? 'Renewal' : 'New Policy'}`, 20, 90);
    if (isRenewal) {
      doc.text(`Installment No: ${policyDetails.installmentNo || 2}`, 20, 100);
    }
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 110);
    doc.save("insurance-receipt.pdf");
  };

  const handleViewPolicies = () => {
    navigate("/profile");
  };

  // Show error message if amount is invalid
  if (totalAmount <= 0) {
    return (
      <div className="payment-page">
        <div className="navigation-header">
          <div className="navigation-buttons">
            <button onClick={handleGoBack} className="nav-button">
              <span className="nav-icon">←</span>
              <span className="nav-text">Back</span>
            </button>
          </div>
        </div>
        <div className="payment-container">
          <div className="error-section">
            <h2>Payment Error</h2>
            <p>Unable to determine the payment amount. Please go back and try again.</p>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', fontSize: '12px' }}>
              <h4>Debug Information:</h4>
              <pre>{JSON.stringify(policyDetails, null, 2)}</pre>
              <p><strong>Extracted Premium:</strong> {premiumAmount}</p>
              <p><strong>Calculated Total:</strong> {totalAmount}</p>
            </div>
            <button onClick={handleGoBack} className="btn-primary" style={{ marginTop: '20px' }}>
              Go Back and Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      {/* Navigation Header */}
      <div className="navigation-header">
        <div className="navigation-buttons">
          <button onClick={handleGoBack} className="nav-button">
            <span className="nav-icon">←</span>
            <span className="nav-text">Back</span>
          </button>
        </div>
      </div>

      {/* Payment Content */}
      <div className="payment-container">
        {!paymentSuccess ? (
          <>
            {/* Policy Summary */}
            <div className="policy-summary">
              <h2>{isRenewal ? 'Policy Renewal' : 'Policy Summary'}</h2>
              {isRenewal && (
                <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                  Installment #{policyDetails.installmentNo || 2}
                </p>
              )}
              <p><strong>Name:</strong> {policyDetails.title || policyDetails.name || policyDetails.policyName}</p>
              <p><strong>Provider:</strong> {policyDetails.provider}</p>
              <p><strong>Type:</strong> {policyDetails.type || policyDetails.policyType}</p>
              <p><strong>Coverage:</strong> {policyDetails.coverage || formatCurrency(policyDetails.coverageAmount)}</p>

              <h3>Payment Breakdown</h3>
              <div className="payment-breakdown">
                <div className="breakdown-item">
                  <span>Base Premium:</span>
                  <span>{formatCurrency(premiumAmount)}</span>
                </div>
                {breakdown && (
                  <>
                    <div className="breakdown-item">
                      <span>GST (18%):</span>
                      <span>{formatCurrency(breakdown.gst)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Processing Fee:</span>
                      <span>{formatCurrency(breakdown.processingFee)}</span>
                    </div>
                    {breakdown.deductible > 0 && (
                      <div className="breakdown-item deductible-info">
                        <span>Deductible (your responsibility):</span>
                        <span>{formatCurrency(breakdown.deductible)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="breakdown-item total-amount">
                      <span><strong>Total Amount:</strong></span>
                      <span><strong>{formatCurrency(totalAmount)}</strong></span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <div className="payment-method">
              <button 
                onClick={handleProceedToPay} 
                disabled={isProcessing || totalAmount <= 0} 
                className="btn-success pay-button"
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  opacity: (isProcessing || totalAmount <= 0) ? 0.6 : 1
                }}
              >
                {isProcessing ? "Processing Payment..." : `Pay ${formatCurrency(totalAmount)}`}
              </button>
              <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Secure payment powered by Razorpay
              </p>
              
              {/* Development Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '12px'
                }}>
                  <h4>Payment Debug Info:</h4>
                  <p><strong>Premium Amount:</strong> ₹{premiumAmount?.toLocaleString('en-IN') || 0}</p>
                  <p><strong>Total Amount:</strong> ₹{totalAmount?.toLocaleString('en-IN') || 0}</p>
                  <p><strong>Amount in Paise:</strong> {Math.round(totalAmount * 100)}</p>
                  <p><strong>Policy ID:</strong> {policyDetails.id}</p>
                  <p><strong>Is Processing:</strong> {isProcessing.toString()}</p>
                  <p><strong>Razorpay Loaded:</strong> {(!!window.Razorpay).toString()}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="success-section">
            <div style={{ textAlign: 'center', color: '#28a745', marginBottom: '20px' }}>
              <div style={{ fontSize: '60px', marginBottom: '10px' }}>✓</div>
              <h2>{isRenewal ? 'Renewal' : 'Payment'} Successful!</h2>
            </div>
            
            <div className="payment-success-details">
              <p><strong>Policy:</strong> {policyDetails?.title || policyDetails?.name || policyDetails?.policyName}</p>
              <p><strong>Premium Amount:</strong> {formatCurrency(premiumAmount)}</p>
              <p><strong>Total Amount Paid:</strong> {formatCurrency(totalAmount)}</p>
              <p><strong>Transaction ID:</strong> {transactionId}</p>
              <p><strong>Payment Method:</strong> Razorpay</p>
              {isRenewal && (
                <p><strong>New Installment:</strong> #{policyDetails.installmentNo || 2}</p>
              )}
              <p><strong>Date & Time:</strong> {new Date().toLocaleString()}</p>
            </div>
            
            <div className="invoice-buttons">
              <button onClick={downloadReceipt} className="btn-primary">
                📄 Download Receipt
              </button>
              <button onClick={handleViewPolicies} className="btn-secondary">
                👤 View My Policies
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;