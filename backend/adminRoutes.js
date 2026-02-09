import express from "express";
import nodemailer from "nodemailer";
import { pool } from "../server.js"; // Adjust relative path if needed

const router = express.Router();

const ADMIN_EMAIL = "admin123@gmail.com";
const ADMIN_PASSWORD = "admin123";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "saikartheekkoramoni@gmail.com",
    pass: process.env.EMAIL_PASS || "mstpokpvmwuiuloh"
  }
});

// Admin login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.admin = { email, role: "admin" };
    return res.json({ success: true, role: "admin", message: "Admin login successful" });
  }
  return res.status(401).json({ success: false, message: "Invalid admin credentials" });
});

// Verify admin session
router.get("/verify", (req, res) => {
  if (req.session?.admin?.role === "admin") {
    return res.json({ authenticated: true, admin: req.session.admin });
  }
  return res.status(401).json({ authenticated: false, message: "Not authorized" });
});

// Fetch pending claims
router.get("/claims/pending", async (req, res) => {
  if (req.session?.admin?.role !== "admin") return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.claim_number, c.claim_amount, c.claim_reason, c.status,
        c.submitted_at as submitted_date, c.claim_type,
        c.documents_uploaded as documents,
        p.id as policy_id, p.policy_name, p.policy_type, p.coverage_amount,
        u.email as customer_email, up.full_name as customer_name, up.mobile as customer_phone
      FROM claims c
      JOIN purchases p ON c.policy_id = p.id
      JOIN insureprousers u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.status IN ('Submitted', 'Pending', 'Under Review')
      ORDER BY c.submitted_at DESC
    `);

    const claims = result.rows.map(row => ({
      id: row.id,
      claim_number: row.claim_number,
      policy_id: row.policy_id,
      policy_name: row.policy_name,
      policy_type: row.policy_type,
      customer_name: row.customer_name || 'Not provided',
      customer_email: row.customer_email,
      customer_phone: row.customer_phone || 'Not provided',
      claim_amount: parseFloat(row.claim_amount),
      coverage_amount: parseFloat(row.coverage_amount),
      claim_type: row.claim_type,
      claim_reason: row.claim_reason,
      status: row.status,
      submitted_date: row.submitted_date,
      documents: Array.isArray(row.documents) ? row.documents.map(doc => ({ name: doc.name || doc.filename, size: doc.size || 0, uploaded: true })) : []
    }));

    res.json({ success: true, claims });
  } catch (error) {
    console.error("Error fetching pending claims:", error);
    res.status(500).json({ success: false, message: "Failed to fetch claims" });
  }
});

// Approve / Reject claim
router.post("/claim-action", async (req, res) => {
  if (req.session?.admin?.role !== "admin") return res.status(401).json({ success: false, message: "Unauthorized" });

  const { claimId, action, rejectionReason } = req.body;
  if (!claimId || !action || (action !== "approve" && action !== "reject")) {
    return res.status(400).json({ success: false, message: "Invalid request parameters" });
  }

  try {
    await pool.query('BEGIN');

    const claimResult = await pool.query(`
      SELECT c.*, p.policy_name, p.coverage_amount, u.email as customer_email, up.full_name as customer_name
      FROM claims c
      JOIN purchases p ON c.policy_id = p.id
      JOIN insureprousers u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = $1
    `, [claimId]);

    if (!claimResult.rows.length) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    const claim = claimResult.rows[0];
    const newStatus = action === "approve" ? "Approved" : "Rejected";
    const processedAt = new Date().toISOString();

    let updateQuery, updateParams;

    if (action === "approve") {
      updateQuery = `UPDATE claims SET status=$1, processed_at=$2, settlement_amount=$3 WHERE id=$4 RETURNING *`;
      updateParams = [newStatus, processedAt, claim.claim_amount, claimId];
    } else {
      updateQuery = `UPDATE claims SET status=$1, processed_at=$2, rejection_reason=$3, adjuster_notes=$4 WHERE id=$5 RETURNING *`;
      updateParams = [newStatus, processedAt, rejectionReason, rejectionReason, claimId];
    }

    await pool.query(updateQuery, updateParams);
    await pool.query('COMMIT');

    await sendClaimNotificationEmail(claim.customer_email, claim.customer_name || "Valued Customer", claim.claim_number, action, parseFloat(claim.claim_amount), rejectionReason);

    res.json({ success: true, message: `Claim ${action}ed successfully`, data: { claimId, status: newStatus, actionDate: processedAt, adminComments: rejectionReason || null, settlementAmount: action === 'approve' ? parseFloat(claim.claim_amount) : null } });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`Error ${action}ing claim:`, error);
    res.status(500).json({ success: false, message: `Failed to ${action} claim: ${error.message}` });
  }
});

// Send email notification
async function sendClaimNotificationEmail(customerEmail, customerName, claimNumber, action, claimAmount, rejectionReason = null) {
  try {
    const isApproved = action === "approve";
    const subject = `Insurance Claim ${isApproved ? "Approved" : "Rejected"} - ${claimNumber}`;
    const formatCurrency = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const emailContent = isApproved
      ? `<div style="font-family:Arial,sans-serif;"><h2>Claim Approved!</h2><p>Amount: ${formatCurrency(claimAmount)}</p></div>`
      : `<div style="font-family:Arial,sans-serif;"><h2>Claim Rejected</h2><p>Amount: ${formatCurrency(claimAmount)}</p><p>Reason: ${rejectionReason}</p></div>`;

    await transporter.sendMail({ from: process.env.EMAIL_USER || 'your-email@gmail.com', to: customerEmail, subject, html: emailContent });
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Admin logged out" });
  });
});

export default router;
