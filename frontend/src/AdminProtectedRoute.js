// src/AdminProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const AdminProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/verify`, {
          withCredentials: true,
        });
        if (res.data.authenticated) {
          setIsAdmin(true);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (isLoading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Checking admin session...</p>;
  }

  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};

export default AdminProtectedRoute;
