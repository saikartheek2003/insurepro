import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// This constant ensures the component talks to the live backend on Render or localhost during dev
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ForgotPassword = () => {
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      // Updated: Using API_BASE_URL for the live endpoint
      const res = await axios.post(`${API_BASE_URL}/request-otp`, { email });
      setMessage(res.data.message);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      // Updated: Using API_BASE_URL for the live endpoint
      const res = await axios.post(`${API_BASE_URL}/verify-otp-and-reset`, { email, otp, password });
      setMessage(res.data.message);
      // On success, redirect to login after a short delay
      setTimeout(() => navigate("/login"), 3000); 
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", fontFamily: "Arial, sans-serif", border: '1px solid #ddd', borderRadius: '8px' }}>
      
      {step === 'request' ? (
        <div>
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a One-Time Password (OTP).</p>
          <form onSubmit={handleRequestOtp}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", background: "blue", color: "white", border: "none", cursor: "pointer" }}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2>Reset Password</h2>
          <p>An OTP was sent to <strong>{email}</strong>. Please enter it below.</p>
          <form onSubmit={handleResetPassword}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: 'border-box' }}
            />
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", background: "blue", color: "white", border: "none", cursor: "pointer" }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      )}

      {/* Display messages and errors */}
      {error && <p style={{ color: "red", marginTop: '10px' }}>{error}</p>}
      {message && <p style={{ color: "green", marginTop: '10px' }}>{message}</p>}
      
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <span 
          onClick={() => navigate("/login")} 
          style={{ color: "blue", cursor: "pointer", fontSize: '0.9rem' }}
        >
          Back to Login
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;