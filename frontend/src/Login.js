import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// This constant checks if a Render variable exists; otherwise, it uses your local setup.
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      let response;
      let data;

      // Admin login (logic remains, but URL is now dynamic)
      if (email === "admin123@gmail.com" && password === "admin123") {
        response = await fetch(`${API_BASE_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        data = await response.json();

        if (!response.ok) {
          setError(data.message || "Admin login failed");
          return;
        }

        setSuccess("Admin login successful! Redirecting...");
        setTimeout(() => navigate("/admin-panel"), 1000);
        return;
      }

      // Normal user login - Now using the dynamic API_BASE_URL
      response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      login(data.user);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1000);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Login error:", err);
      setError("Could not connect to server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to right, #667eea, #764ba2)",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "40px 30px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Login to InsurePro</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: "100%", padding: "12px", marginBottom: "15px", boxSizing: 'border-box' }}
          />
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{ width: "100%", padding: "12px", boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: '1.2rem'
              }}
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>
          <button type="submit" disabled={isLoading} style={{ width: "100%", padding: "12px", background: "#667eea", color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLoading ? "Signing In..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "15px" }}>
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")} style={{ color: "#667eea", cursor: "pointer", fontWeight: 'bold' }}>
            Create Account
          </span>
        </p>

        <p
          onClick={() => navigate("/forgot-password")}
          style={{ marginTop: "10px", color: "#667eea", cursor: "pointer", fontWeight: 'bold' }}
        >
          Forgot Password?
        </p>
      </div>
    </div>
  );
};

export default Login;