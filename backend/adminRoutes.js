import express from "express";
import nodemailer from "nodemailer";
import { pool } from "C:\Users\USER\desktop\insurepro\backend\server.js"; // Import your database pool

const router = express.Router();


const ADMIN_EMAIL = "admin123@gmail.com";
const ADMIN_PASSWORD = "admin123";


const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'saikartheekkoramoni@gmail.com',
    pass: process.env.EMAIL_PASS || 'mstpokpvmwuiuloh'
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Save admin session
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

// Get pending claims from database
router.get("/claims/pending", async (req, res) => {
  if (req.session?.admin?.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.claim_number,
        c.claim_amount,
        c.claim_reason,
        c.status,
        c.submitted_at as submitted_date,
        c.claim_type,
        c.documents_uploaded as documents,
        p.id as policy_id,
        p.policy_name,
        p.policy_type,
        p.coverage_amount,
        u.email as customer_email,
        up.full_name as customer_name,
        up.mobile as customer_phone
      FROM claims c
      JOIN purchases p ON c.policy_id = p.id
      JOIN insureprousers u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.status IN ('Submitted', 'Pending', 'Under Review')
      ORDER BY c.submitted_at DESC
    `);

    // Transform data to match the expected frontend format
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
      documents: Array.isArray(row.documents) ? row.documents.map(doc => ({
        name: doc.name || doc.filename,
        size: doc.size || 0,
        uploaded: true
      })) : []
    }));

    res.json({ success: true, claims });
  } catch (error) {
    console.error("Error fetching pending claims:", error);
    res.status(500).json({ success: false, message: "Failed to fetch claims" });
  }
});

// Get approved claims from database
router.get("/claims/approved", async (req, res) => {
  if (req.session?.admin?.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.claim_number,
        c.claim_amount,
        c.claim_reason,
        c.status,
        c.submitted_at as submitted_date,
        c.processed_at as admin_action_date,
        c.settlement_amount,
        c.claim_type,
        c.documents_uploaded as documents,
        c.adjuster_notes as admin_comments,
        p.id as policy_id,
        p.policy_name,
        p.policy_type,
        p.coverage_amount,
        u.email as customer_email,
        up.full_name as customer_name,
        up.mobile as customer_phone
      FROM claims c
      JOIN purchases p ON c.policy_id = p.id
      JOIN insureprousers u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.status = 'Approved'
      ORDER BY c.processed_at DESC
    `);

    // Transform data to match the expected frontend format
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
      admin_action_date: row.admin_action_date,
      settlement_amount: row.settlement_amount ? parseFloat(row.settlement_amount) : null,
      admin_comments: row.admin_comments,
      documents: Array.isArray(row.documents) ? row.documents.map(doc => ({
        name: doc.name || doc.filename,
        size: doc.size || 0,
        uploaded: true
      })) : []
    }));

    res.json({ success: true, claims });
  } catch (error) {
    console.error("Error fetching approved claims:", error);
    res.status(500).json({ success: false, message: "Failed to fetch approved claims" });
  }
});

// Handle claim approval/rejection
router.post("/claim-action", async (req, res) => {
  if (req.session?.admin?.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { claimId, action, rejectionReason } = req.body;

  if (!claimId || !action || (action !== 'approve' && action !== 'reject')) {
    return res.status(400).json({ success: false, message: "Invalid request parameters" });
  }

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Get claim details
    const claimResult = await pool.query(`
      SELECT 
        c.*,
        p.policy_name,
        p.coverage_amount,
        u.email as customer_email,
        up.full_name as customer_name
      FROM claims c
      JOIN purchases p ON c.policy_id = p.id
      JOIN insureprousers u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = $1
    `, [claimId]);

    if (claimResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    const claim = claimResult.rows[0];

    // Update claim status
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const processedAt = new Date().toISOString();
    
    let updateQuery, updateParams;
    
    if (action === 'approve') {
      updateQuery = `
        UPDATE claims 
        SET status = $1, processed_at = $2, settlement_amount = $3
        WHERE id = $4
        RETURNING *
      `;
      updateParams = [newStatus, processedAt, claim.claim_amount, claimId];
    } else {
      updateQuery = `
        UPDATE claims 
        SET status = $1, processed_at = $2, rejection_reason = $3, adjuster_notes = $4
        WHERE id = $4
        RETURNING *
      `;
      updateParams = [newStatus, processedAt, rejectionReason, rejectionReason, claimId];
    }

    const updateResult = await pool.query(updateQuery, updateParams);
    
    // Commit the transaction
    await pool.query('COMMIT');

    // Send email notification
    const emailSent = await sendClaimNotificationEmail(
      claim.customer_email,
      claim.customer_name || 'Valued Customer',
      claim.claim_number,
      action,
      parseFloat(claim.claim_amount),
      rejectionReason
    );

    const responseMessage = emailSent 
      ? `Claim ${action}ed successfully and email notification sent`
      : `Claim ${action}ed successfully (email notification failed)`;

    res.json({
      success: true,
      message: responseMessage,
      data: {
        claimId,
        status: newStatus,
        actionDate: processedAt,
        adminComments: rejectionReason || null,
        settlementAmount: action === 'approve' ? parseFloat(claim.claim_amount) : null
      }
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`Error ${action}ing claim:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to ${action} claim: ${error.message}` 
    });
  }
});

// Get rejected claims (optional endpoint)
router.get("/claims/rejected", async (req, res) => {
  if (req.session?.admin?.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        p.policy_name,
        p.policy_type,
        p.coverage_amount,
        u.email as customer_email,
        up.full_name as customer_name,
        up.mobile as customer_phone
      FROM claims c
      JOIN purchases p ON c.policy_id = p.id
      JOIN insureprousers u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.status = 'Rejected'
      ORDER BY c.processed_at DESC
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
      submitted_date: row.submitted_at,
      admin_action_date: row.processed_at,
      rejection_reason: row.rejection_reason,
      admin_comments: row.adjuster_notes,
      documents: Array.isArray(row.documents_uploaded) ? row.documents_uploaded.map(doc => ({
        name: doc.name || doc.filename,
        size: doc.size || 0,
        uploaded: true
      })) : []
    }));

    res.json({ success: true, claims });
  } catch (error) {
    console.error("Error fetching rejected claims:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rejected claims" });
  }
});

// Send email notification for claim approval/rejection
async function sendClaimNotificationEmail(customerEmail, customerName, claimNumber, action, claimAmount, rejectionReason = null) {
  try {
    const isApproved = action === 'approve';
    const subject = `Insurance Claim ${isApproved ? 'Approved' : 'Rejected'} - ${claimNumber}`;
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    };

    let emailContent;
    
    if (isApproved) {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #28a745; margin: 0;">Claim Approved!</h2>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #155724; margin-top: 0;">Great News!</h3>
            <p style="color: #155724; margin-bottom: 0;">Your insurance claim has been approved and the amount will be processed shortly.</p>
          </div>
          
          <h3 style="color: #333; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Claim Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold; width: 40%;">Claim Number:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${claimNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Customer Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Approved Amount:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; color: #28a745; font-weight: bold; font-size: 1.1em;">${formatCurrency(claimAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Status:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;"><span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">APPROVED</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Approval Date:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
          
          <div style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #333;">Next Steps:</h4>
            <ul style="margin-bottom: 0; color: #666;">
              <li>The approved amount will be processed within 3-5 business days</li>
              <li>You will receive a separate notification once the payment is initiated</li>
              <li>Keep this email for your records</li>
              <li>Contact us if you have any questions regarding this claim</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #666; font-size: 0.9em;">Thank you for choosing our insurance services!</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">For any queries, please contact our support team.</p>
          </div>
        </div>
      `;
    } else {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #dc3545; margin: 0;">Claim Rejected</h2>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #721c24; margin-top: 0;">Claim Status Update</h3>
            <p style="color: #721c24; margin-bottom: 0;">Unfortunately, your insurance claim has been rejected. Please review the details below.</p>
          </div>
          
          <h3 style="color: #333; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Claim Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold; width: 40%;">Claim Number:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${claimNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Customer Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Claim Amount:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${formatCurrency(claimAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Status:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;"><span style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">REJECTED</span></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef; font-weight: bold;">Rejection Date:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
          
          ${rejectionReason ? `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #856404;">Reason for Rejection:</h4>
            <p style="margin-bottom: 0; color: #856404;">${rejectionReason}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #333;">What you can do:</h4>
            <ul style="margin-bottom: 0; color: #666;">
              <li>Review the rejection reason carefully</li>
              <li>Gather additional supporting documents if required</li>
              <li>Contact our support team for clarification</li>
              <li>You may resubmit your claim with additional documentation</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #666; font-size: 0.9em;">We apologize for any inconvenience caused.</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">For assistance, please contact our support team.</p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: customerEmail,
      subject: subject,
      html: emailContent
    };

    // Send actual email notification
    await transporter.sendMail(mailOptions);

    // Log email content for debugging
    console.log(`Email notification sent to ${customerEmail}:`);
    console.log(`Subject: ${subject}`);
    console.log('Action:', action);
    console.log('Claim Amount:', formatCurrency(claimAmount));
    if (rejectionReason) {
      console.log('Rejection Reason:', rejectionReason);
    }

    return true; // Email sent successfully
  } catch (error) {
    console.error('Error sending email notification:', error);
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