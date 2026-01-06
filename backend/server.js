// server.js 


require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const net = require('net');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

/* ------------------------------ Env checks ------------------------------ */
const requiredEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
];
const missing = requiredEnvVars.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required environment variables:', missing);
  process.exit(1);
}
console.log('✅ All required environment variables are loaded');

/* --------------------------------- App ---------------------------------- */
const app = express();
const port = 5000;

/* ----------------------------- Port utilities ---------------------------- */
const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });

/* ------------------------------ DB connection --------------------------- */
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:Saichinnu%401@localhost:5432/postgres',
});

/* --------------------------- Admin Configuration ------------------------- */
const ADMIN_CREDENTIALS = {
  email: 'admin123@gmail.com',
  password: 'admin123' // This should be hashed in production
};

/* ------------------------------ Utilities -------------------------------- */
const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ message: 'Login required' });
  next();
};

const verifyAdminSession = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

/* ----------------------------- Razorpay setup ---------------------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ------------------------------- Middleware ------------------------------ */
const createCorsOptions = () => ({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost')) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

const setupMiddleware = () => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(createCorsOptions()));
  app.options('*', cors(createCorsOptions()));
  app.use('/uploads', express.static('uploads'));
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'supersecretkey_change_in_production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  // Simple request logger 
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const body = { ...req.body };
      if (body.password) body.password = '***MASKED***';
      if (body.confirmPassword) body.confirmPassword = '***MASKED***';
      console.log('📋 Body:', body);
    }
    next();
  });
};

/* --------------------------- Schema------------------------- */
const updateDatabaseSchema = async () => {
  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }
  
  // base tables existence check
  await pool.query(`
    CREATE TABLE IF NOT EXISTS insureprousers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      reset_token VARCHAR(255),
      reset_expires TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES insureprousers(id) ON DELETE CASCADE,
      policy_id VARCHAR(255) NOT NULL,
      policy_name VARCHAR(255) NOT NULL,
      premium DECIMAL(10,2),
      purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  
  await pool.query(`
    ALTER TABLE purchases 
      ADD COLUMN IF NOT EXISTS policy_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS coverage_amount DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS policy_term INTEGER,
      ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS expiry_date DATE,
      ADD COLUMN IF NOT EXISTS installment_no INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS original_purchase_id INTEGER REFERENCES purchases(id),
      ADD COLUMN IF NOT EXISTS claim_status VARCHAR(30) DEFAULT 'None',
      ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
  `);

  


await pool.query(`
  CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES insureprousers(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    claim_amount DECIMAL(15,2),
    claim_reason TEXT,
    status VARCHAR(30) DEFAULT 'Submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    settlement_amount DECIMAL(15,2),
    rejection_reason TEXT,
    documents_uploaded JSONB DEFAULT '[]'::jsonb,
    claim_type VARCHAR(50) DEFAULT 'General',
    adjuster_notes TEXT
  );
`);


try {
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_number VARCHAR(50) UNIQUE');
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_amount DECIMAL(15,2)');
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_reason TEXT');
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_type VARCHAR(50) DEFAULT \'General\'');
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS rejection_reason TEXT');
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(15, 2)');
  await pool.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS documents_uploaded JSONB DEFAULT \'[]\'::jsonb');
  
  console.log('✅ All columns in the "claims" table are ensured to exist.');
} catch (alterErr) {
  console.error('⚠️ Could not alter claims table:', alterErr.message);
}
};                                                                                             


const checkDatabaseConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully!');
    await updateDatabaseSchema();
  } catch (err) {
    console.error('❌ Database connection failed!', err.message);
  }
};

/* ----------------------------- Multer Setup ------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.session?.user?.id || 'anonymous'}-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

/* --------------------------------- Boot --------------------------------- */
const startServer = async () => {
  try {
    const port = 5000; // Fixed port
    
  
    if (!(await isPortAvailable(port))) {
      throw new Error(`Port ${port} is already in use. Please free up the port or change PORT in .env`);
    }
    
    setupMiddleware(); 
    await checkDatabaseConnection();

    /* --------------------------------- Routes -------------------------------- */
   
    app.get('/', (_req, res) => res.json({ message: 'InsurePro Server running!' }));
    app.get('/api/health', async (req, res) => {
      try {
        await pool.query('SELECT 1');
        res.json({
          status: 'healthy',
          session: req.session.user || 'guest',
          razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID ? 'configured' : 'missing',
            keySecret: process.env.RAZORPAY_KEY_SECRET ? 'configured' : 'missing',
          },
        });
      } catch (err) {
        res.status(500).json({ status: 'unhealthy', error: err.message });
      }
    });

    /* ------------------------------ Auth routes ------------------------------ */
    app.post('/api/signup', async (req, res) => {
      try {
        const { email, password } = req.body || {};
        if (!email || !password)
          return res.status(400).json({ message: 'Email and password required' });

        const existing = await pool.query(
          'SELECT 1 FROM insureprousers WHERE email=$1',
          [email.toLowerCase()]
        );
        if (existing.rows.length)
          return res.status(400).json({ message: 'Email already registered' });

        const password_hash = await bcrypt.hash(password, 12);
        const { rows } = await pool.query(
          'INSERT INTO insureprousers (email, password_hash) VALUES ($1,$2) RETURNING id,email',
          [email.toLowerCase(), password_hash]
        );

        req.session.user = { id: rows[0].id, email: rows[0].email };
        res.status(201).json({ message: 'Signup success', user: req.session.user });
      } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during signup' });
      }
    });

    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body || {};
        if (!email || !password)
          return res.status(400).json({ message: 'Email and password required' });

        const { rows } = await pool.query(
          'SELECT * FROM insureprousers WHERE email=$1',
          [email.toLowerCase()]
        );
        if (!rows.length)
          return res.status(401).json({ message: 'Invalid email or password' });

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

        req.session.user = { id: user.id, email: user.email };
        res.json({ message: 'Login successful', user: req.session.user });
      } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
      }
    });

    app.post('/api/logout', (req, res) => {
      const email = req.session.user?.email;
      req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.clearCookie('connect.sid');
        console.log('✅ User logged out:', email);
        res.json({ message: 'Logout successful' });
      });
    });

    app.get('/api/me', (req, res) => {
      if (req.session.user) return res.json({ user: req.session.user, authenticated: true });
      res.status(401).json({ message: 'Not authenticated', authenticated: false });
    });

    /* ------------------------ Forgot/Reset password -------------------------- */
   

// NEW Route 1: Request an OTP
app.post('/api/request-otp', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM insureprousers WHERE email=$1',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      
      console.log(`OTP request for non-existent email: ${email}`);
      return res.json({ message: 'If an account with this email exists, an OTP has been sent.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiry for 10 minutes from now
    const expires = new Date(Date.now() + 10 * 60 * 1000); 

    await pool.query(
      'UPDATE insureprousers SET otp=$1, otp_expires=$2 WHERE email=$3',
      [otp, expires, email.toLowerCase()]
    );

    // Send the OTP via email
    await transporter.sendMail({
      from: `"InsurePro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      html: `<p>Your OTP to reset the password is: <strong>${otp}</strong></p>
             <p>This OTP will expire in 10 minutes.</p>`,
    });

    console.log(`📧 OTP sent to ${email}`);
    res.json({ message: 'If an account with this email exists, an OTP has been sent.' });

  } catch (err) {
    console.error('❌ OTP request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW Route 2: Verify OTP and Reset Password
app.post('/api/verify-otp-and-reset', async (req, res) => {
  const { email, otp, password } = req.body || {};

  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM insureprousers WHERE email=$1',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP or email' });
    }

    const user = rows[0];

    // Check if OTP is correct and not expired
    if (user.otp !== otp || new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE insureprousers SET password_hash=$1, otp=NULL, otp_expires=NULL WHERE email=$2',
      [password_hash, email.toLowerCase()]
    );

    res.json({ message: 'Password has been reset successfully. Please log in.' });

  } catch (err) {
    console.error('Reset password with OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

    /* --------------------------- Admin Routes --------------------------- */
    app.post('/api/admin/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: 'Email and password are required'
          });
        }

        // Verify admin credentials
        if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        
          req.session.admin = {
            id: 'admin_001',
            email: email,
            role: 'admin'
          };
          console.log('SESSION SET ON LOGIN:', req.session);

          res.json({
            success: true,
            message: 'Admin login successful',
            admin: {
              email: email,
              role: 'admin'
            }
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });

   
    app.get('/api/admin/verify', (req, res) => {
 
  console.log('SESSION ON VERIFY:', req.session);

  if (req.session && req.session.admin) {
   
    res.json({
      authenticated: true, 
      admin: req.session.admin
    });
  } else {
    res.status(401).json({
      authenticated: false, 
      message: 'Not authenticated'
    });
  }
});

    // Admin logout
    app.post('/api/admin/logout', (req, res) => {
      if (req.session.admin) {
        delete req.session.admin;
      }
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });

   
    app.get('/api/admin/claims', verifyAdminSession, async (req, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT 
            c.*, 
            p.policy_name, p.policy_type, p.coverage_amount,
            u.email as customer_email
          FROM claims c
          JOIN purchases p ON c.policy_id = p.id
          JOIN insureprousers u ON c.user_id = u.id
          ORDER BY c.submitted_at DESC
        `);

        res.json({
          success: true,
          claims: rows,
          count: rows.length
        });
      } catch (err) {
        console.error('❌ Admin claims fetch error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch claims',
          error: err.message
        });
      }
    });

   
    app.put('/api/admin/claims/:claimId', verifyAdminSession, async (req, res) => {
      const { claimId } = req.params;
      const { status, rejectionReason, settlementAmount } = req.body;

      try {
        await pool.query('BEGIN');

        const updateResult = await pool.query(`
          UPDATE claims 
          SET status = $1, rejection_reason = $2, settlement_amount = $3, processed_at = NOW()
          WHERE id = $4 
          RETURNING *
        `, [status, rejectionReason || null, settlementAmount || null, claimId]);

        if (updateResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ message: 'Claim not found' });
        }

        const claim = updateResult.rows[0];

       
        if (status === 'Approved') {
          await pool.query(
            'UPDATE purchases SET status = $1, claim_status = $2 WHERE id = $3',
            ['Claim Approved', 'Approved', claim.policy_id]
          );
        } else if (status === 'Rejected') {
          await pool.query(
            'UPDATE purchases SET status = $1, claim_status = $2 WHERE id = $3',
            ['Active', 'Rejected', claim.policy_id]
          );
        }

        await pool.query('COMMIT');

        // Send notification email to customer 
        try {
          const customerResult = await pool.query('SELECT email FROM insureprousers WHERE id = $1', [claim.user_id]);
          if (customerResult.rows.length) {
            const customerEmail = customerResult.rows[0].email;
            let emailSubject, emailContent;

            if (status === 'Approved') {
              emailSubject = `Claim Approved - ${claim.claim_number}`;
              emailContent = `
                <h2 style="color: #10b981;">Claim Approved!</h2>
                <p>Your insurance claim has been approved.</p>
                <p><strong>Claim Number:</strong> ${claim.claim_number}</p>
                <p><strong>Settlement Amount:</strong> ₹${parseFloat(settlementAmount || claim.claim_amount).toLocaleString('en-IN')}</p>
                <p>The settlement amount will be processed within 10-15 business days.</p>
              `;
            } else if (status === 'Rejected') {
              emailSubject = `Claim Update - ${claim.claim_number}`;
              emailContent = `
                <h2 style="color: #ef4444;">Claim Status Update</h2>
                <p>Your insurance claim status has been updated.</p>
                <p><strong>Claim Number:</strong> ${claim.claim_number}</p>
                <p><strong>Status:</strong> ${status}</p>
                ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
              `;
            } else {
              emailSubject = `Claim Update - ${claim.claim_number}`;
              emailContent = `
                <h2>Claim Status Update</h2>
                <p>Your insurance claim status has been updated.</p>
                <p><strong>Claim Number:</strong> ${claim.claim_number}</p>
                <p><strong>Status:</strong> ${status}</p>
              `;
            }

            await transporter.sendMail({
              from: `"InsurePro Claims" <${process.env.EMAIL_USER}>`,
              to: customerEmail,
              subject: emailSubject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  ${emailContent}
                  <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>InsurePro Team</strong>
                  </p>
                </div>
              `
            });
          }
        } catch (emailErr) {
          console.error('Email notification error:', emailErr);
        }

        res.json({
          success: true,
          message: `Claim ${status.toLowerCase()} successfully`,
          updatedClaim: claim
        });

      } catch (err) {
        await pool.query('ROLLBACK');
        console.error('❌ Claim status update error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to update claim status',
          error: err.message
        });
      }
    });

    // Additional admin endpoint - Get all policies
    app.get('/api/admin/policies', verifyAdminSession, async (req, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT 
            p.*, 
            u.email as customer_email,
            COUNT(c.id) as total_claims
          FROM purchases p
          JOIN insureprousers u ON p.user_id = u.id
          LEFT JOIN claims c ON p.id = c.policy_id
          GROUP BY p.id, u.email
          ORDER BY p.purchased_at DESC
        `);

        res.json({
          success: true,
          policies: rows,
          count: rows.length
        });
      } catch (err) {
        console.error('❌ Admin policies fetch error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch policies',
          error: err.message
        });
      }
    });

    // Additional admin endpoint - Get all users
    app.get('/api/admin/users', verifyAdminSession, async (req, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT 
            u.id, u.email, u.created_at,
            COUNT(DISTINCT p.id) as total_policies,
            COUNT(DISTINCT c.id) as total_claims,
            SUM(CAST(p.premium as DECIMAL)) as total_premium_paid
          FROM insureprousers u
          LEFT JOIN purchases p ON u.id = p.user_id
          LEFT JOIN claims c ON u.id = c.user_id
          GROUP BY u.id, u.email, u.created_at
          ORDER BY u.created_at DESC
        `);

        res.json({
          success: true,
          users: rows,
          count: rows.length
        });
      } catch (err) {
        console.error('❌ Admin users fetch error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch users',
          error: err.message
        });
      }
    });

    // Get admin dashboard statistics
    app.get('/api/admin/dashboard-stats', verifyAdminSession, async (req, res) => {
      try {
        // Total users
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM insureprousers');
        const totalUsers = parseInt(usersResult.rows[0].count);

        // Total policies
        const policiesResult = await pool.query('SELECT COUNT(*) as count FROM purchases');
        const totalPolicies = parseInt(policiesResult.rows[0].count);

        // Active policies
        const activePoliciesResult = await pool.query(
          "SELECT COUNT(*) as count FROM purchases WHERE status = 'Active'"
        );
        const activePolicies = parseInt(activePoliciesResult.rows[0].count);

        // Total claims
        const claimsResult = await pool.query('SELECT COUNT(*) as count FROM claims');
        const totalClaims = parseInt(claimsResult.rows[0].count);

        // Pending claims
        const pendingClaimsResult = await pool.query(
          "SELECT COUNT(*) as count FROM claims WHERE status IN ('Submitted', 'Under Review')"
        );
        const pendingClaims = parseInt(pendingClaimsResult.rows[0].count);

        // Total premium collected
        const premiumResult = await pool.query(
          'SELECT SUM(CAST(premium AS DECIMAL)) as total FROM purchases'
        );
        const totalPremium = parseFloat(premiumResult.rows[0].total || 0);

        res.json({
          success: true,
          stats: {
            totalUsers,
            totalPolicies,
            activePolicies,
            totalClaims,
            pendingClaims,
            totalPremium: totalPremium.toFixed(2)
          }
        });

      } catch (err) {
        console.error('❌ Admin dashboard stats error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch dashboard statistics',
          error: err.message
        });
      }
    });

    /* -------------------------- User Endpoints --------------------------- */
    // Get user's policies
    app.get('/api/user-policies', requireAuth, async (req, res) => {
      try {
        const { rows } = await pool.query(
          'SELECT * FROM purchases WHERE user_id = $1 ORDER BY purchased_at DESC',
          [req.session.user.id]
        );

        res.json({
          success: true,
          policies: rows
        });
      } catch (err) {
        console.error('❌ User policies fetch error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch policies',
          error: err.message
        });
      }
    });

    // Get user's claims
    app.get('/api/user/claims', requireAuth, async (req, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT 
            c.*,
            p.policy_name, p.policy_type
          FROM claims c
          JOIN purchases p ON c.policy_id = p.id
          WHERE c.user_id = $1
          ORDER BY c.submitted_at DESC
        `, [req.session.user.id]);

        res.json({
          success: true,
          claims: rows
        });
      } catch (err) {
        console.error('❌ User claims fetch error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch claims',
          error: err.message
        });
      }
    });

    // Submit a new claim
    app.post('/api/user/claims', requireAuth, upload.array('documents', 5), async (req, res) => {
      try {
        const { policy_id, claim_amount, claim_reason, claim_type } = req.body;
        const userId = req.session.user.id;

        if (!policy_id || !claim_amount || !claim_reason) {
          return res.status(400).json({
            success: false,
            message: 'Policy ID, claim amount, and reason are required'
          });
        }

        // Generate unique claim number
        const claimNumber = 'CLM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Store uploaded files info
        const documentsUploaded = req.files ? req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        })) : [];

        const { rows } = await pool.query(`
          INSERT INTO claims (user_id, policy_id, claim_number, claim_amount, claim_reason, claim_type, documents_uploaded)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [userId, policy_id, claimNumber, claim_amount, claim_reason, claim_type || 'General', JSON.stringify(documentsUploaded)]);

        // Update policy status
        await pool.query(
          'UPDATE purchases SET status = $1, claim_status = $2 WHERE id = $3',
          ['Under Claim Review', 'Submitted', policy_id]
        );

        res.json({
          success: true,
          message: 'Claim submitted successfully',
          claim: rows[0]
        });

      } catch (err) {
        console.error('❌ Claim submission error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to submit claim',
          error: err.message
        });
      }
    });

    // Purchase policy endpoint
    app.post('/api/purchase-policy', requireAuth, async (req, res) => {
      try {
        const { policyId, policyName, premium, policyType, coverageAmount, policyTerm } = req.body;
        const userId = req.session.user.id;

        if (!policyId || !policyName || !premium) {
          return res.status(400).json({
            success: false,
            message: 'Policy ID, name, and premium are required'
          });
        }

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + (policyTerm || 1));

        const { rows } = await pool.query(`
          INSERT INTO purchases (user_id, policy_id, policy_name, premium, policy_type, coverage_amount, policy_term, expiry_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [userId, policyId, policyName, premium, policyType, coverageAmount, policyTerm || 1, expiryDate]);

        res.json({
          success: true,
          message: 'Policy purchased successfully',
          policy: rows[0]
        });

      } catch (err) {
        console.error('❌ Policy purchase error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to purchase policy',
          error: err.message
        });
      }
    });

    // Generate invoice
    app.get('/api/invoice/:policyId', requireAuth, async (req, res) => {
      try {
        const { policyId } = req.params;
        const userId = req.session.user.id;

        const policyResult = await pool.query(
          'SELECT * FROM purchases WHERE id = $1 AND user_id = $2',
          [policyId, userId]
        );

        if (!policyResult.rows.length) {
          return res.status(404).json({ message: 'Policy not found' });
        }

        const policy = policyResult.rows[0];
        const userResult = await pool.query('SELECT email FROM insureprousers WHERE id = $1', [userId]);
        const userEmail = userResult.rows[0]?.email || 'N/A';

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${policyId}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Insurance Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Policy Type: ${policy.policy_type || 'N/A'}`);
        doc.text(`Policy Name: ${policy.policy_name}`);
        doc.text(`Premium: ₹${policy.premium || '0'}`);
        doc.text(`Coverage: ₹${policy.coverage_amount || 'N/A'}`);
        doc.text(`Customer Email: ${userEmail}`);
        doc.moveDown();
        doc.text('Thank you for choosing InsurePro!');
        doc.end();

      } catch (err) {
        console.error('❌ Invoice generation error:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to generate invoice', 
          error: err.message 
        });
      }
    });

    /* -------------------------- File Upload Endpoint ------------------------ */
    app.post('/api/upload-documents', requireAuth, upload.array('documents', 5), (req, res) => {
      try {
        const uploadedFiles = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }));

        res.json({
          success: true,
          message: 'Documents uploaded successfully',
          files: uploadedFiles
        });
      } catch (err) {
        console.error('❌ File upload error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to upload documents',
          error: err.message
        });
      }
    });

    /* -------------------------- Error Handling ---------------------------- */
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        message: 'Endpoint not found', 
        path: req.originalUrl,
        method: req.method 
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('❌ Unhandled error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }
      
      if (err.message === 'Only images and documents are allowed') {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Start the server
    app.listen(port, () => {
      console.log(`\n🚀 InsurePro Server is running!`);
      console.log(`📍 Local URL: http://localhost:${port}`);
      console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
      console.log(`📧 Email configured: ${process.env.EMAIL_USER ? 'Yes' : 'No'}`);
      console.log(`💳 Razorpay configured: ${process.env.RAZORPAY_KEY_ID ? 'Yes' : 'No'}`);
      console.log(`🛡️ Admin email: ${ADMIN_CREDENTIALS.email}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('===============================================\n');
    });

  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
};

/* ----------------------------- Process Handlers -------------------------- */

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  try {
    await pool.end();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  try {
    await pool.end();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();