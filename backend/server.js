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

/* ----------------------------- DB connection --------------------------- */
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:Saichinnu%401@localhost:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/* --------------------------- Admin Configuration ------------------------- */
const ADMIN_CREDENTIALS = {
  email: 'admin123@gmail.com',
  password: 'admin123'
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
const setupMiddleware = () => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL];
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));

  app.options('*', cors());

  app.use('/uploads', express.static('uploads'));

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey_change_in_production',
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    }
  }));

  // Request logger
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const body = {...req.body};
      if (body.password) body.password = '***MASKED***';
      if (body.confirmPassword) body.confirmPassword = '***MASKED***';
      console.log('📋 Body:', body);
    }
    next();
  });
};

/* --------------------------- Multer Setup ------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.session?.user?.id || 'anonymous'}-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images and documents are allowed'));
  }
});

/* --------------------------- Database Schema --------------------------- */
const updateDatabaseSchema = async () => {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS insureprousers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      otp VARCHAR(10),
      otp_expires TIMESTAMP WITH TIME ZONE,
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

  console.log('✅ Database schema ensured');
};

/* --------------------------- Server Start --------------------------- */
const startServer = async () => {
  try {
    const port = process.env.PORT || 5000;

    setupMiddleware();
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully!');
    await updateDatabaseSchema();

    /* --------------------------- Routes --------------------------- */

    // Health check
    app.get('/api/health', async (req,res)=>{
      try {
        await pool.query('SELECT 1');
        res.json({ status:'healthy', session:req.session.user||'guest' });
      } catch(e){ res.status(500).json({status:'unhealthy', error:e.message}); }
    });

    /* ------------------------ Auth Routes ------------------------ */
    app.post('/api/signup', async (req,res)=>{
      try {
        const {email,password} = req.body;
        if(!email || !password) return res.status(400).json({message:'Email and password required'});
        const exists = await pool.query('SELECT 1 FROM insureprousers WHERE email=$1',[email.toLowerCase()]);
        if(exists.rows.length) return res.status(400).json({message:'Email already registered'});
        const hash = await bcrypt.hash(password,12);
        const {rows} = await pool.query('INSERT INTO insureprousers (email,password_hash) VALUES($1,$2) RETURNING id,email',[email.toLowerCase(),hash]);
        req.session.user = {id:rows[0].id,email:rows[0].email};
        res.status(201).json({message:'Signup success',user:req.session.user});
      } catch(err){ console.error(err); res.status(500).json({message:'Server error during signup'})}
    });

    app.post('/api/login', async(req,res)=>{
      try{
        const {email,password} = req.body;
        if(!email || !password) return res.status(400).json({message:'Email and password required'});
        const {rows} = await pool.query('SELECT * FROM insureprousers WHERE email=$1',[email.toLowerCase()]);
        if(!rows.length) return res.status(401).json({message:'Invalid email or password'});
        const user = rows[0];
        const ok = await bcrypt.compare(password,user.password_hash);
        if(!ok) return res.status(401).json({message:'Invalid email or password'});
        req.session.user = {id:user.id,email:user.email};
        res.json({message:'Login successful',user:req.session.user});
      } catch(err){ console.error(err); res.status(500).json({message:'Server error during login'})}
    });

    app.post('/api/logout',(req,res)=>{
      const email = req.session.user?.email;
      req.session.destroy(err=>{
        if(err) return res.status(500).json({message:'Logout failed'});
        res.clearCookie('connect.sid');
        console.log('✅ User logged out:',email);
        res.json({message:'Logout successful'});
      });
    });

    app.get('/api/me',(req,res)=>{
      if(req.session.user) return res.json({user:req.session.user,authenticated:true});
      res.status(401).json({message:'Not authenticated',authenticated:false});
    });

    /* ------------------------ Admin Routes ------------------------ */
    app.post('/api/admin/login', async(req,res)=>{
      try{
        const {email,password} = req.body;
        if(email===ADMIN_CREDENTIALS.email && password===ADMIN_CREDENTIALS.password){
          req.session.admin={id:'admin_001',email,email,role:'admin'};
          res.json({success:true,message:'Admin login successful',admin:req.session.admin});
        } else res.status(401).json({success:false,message:'Invalid credentials'});
      } catch(err){ console.error(err); res.status(500).json({success:false,message:'Internal server error'})}
    });

    app.get('/api/admin/verify',verifyAdminSession,(req,res)=>{
      res.json({authenticated:true,admin:req.session.admin});
    });

    app.post('/api/admin/logout',(req,res)=>{
      delete req.session.admin;
      res.json({success:true,message:'Logged out successfully'});
    });

    // Admin - claims, policies, users, dashboard stats
    app.get('/api/admin/claims', verifyAdminSession, async(req,res)=>{
      try{
        const {rows} = await pool.query(`SELECT c.*,p.policy_name,p.policy_type,p.coverage_amount,u.email as customer_email
          FROM claims c
          JOIN purchases p ON c.policy_id=p.id
          JOIN insureprousers u ON c.user_id=u.id
          ORDER BY c.submitted_at DESC`);
        res.json({success:true,claims:rows,count:rows.length});
      }catch(err){console.error(err); res.status(500).json({success:false,message:'Failed to fetch claims',error:err.message})}
    });

    app.put('/api/admin/claims/:claimId', verifyAdminSession, async(req,res)=>{
      const {claimId} = req.params;
      const {status,rejectionReason,settlementAmount} = req.body;
      try{
        await pool.query('BEGIN');
        const {rows} = await pool.query(`UPDATE claims SET status=$1,rejection_reason=$2,settlement_amount=$3,processed_at=NOW() WHERE id=$4 RETURNING *`,[status,rejectionReason||null,settlementAmount||null,claimId]);
        if(!rows.length){await pool.query('ROLLBACK'); return res.status(404).json({message:'Claim not found'})}
        const claim = rows[0];
        if(status==='Approved') await pool.query('UPDATE purchases SET status=$1,claim_status=$2 WHERE id=$3',['Claim Approved','Approved',claim.policy_id]);
        else if(status==='Rejected') await pool.query('UPDATE purchases SET status=$1,claim_status=$2 WHERE id=$3',['Active','Rejected',claim.policy_id]);
        await pool.query('COMMIT');
        res.json({success:true,message:`Claim ${status.toLowerCase()} successfully`,updatedClaim:claim});
      }catch(err){await pool.query('ROLLBACK');console.error(err); res.status(500).json({success:false,message:'Failed to update claim status',error:err.message})}
    });

    app.get('/api/admin/policies', verifyAdminSession, async(req,res)=>{
      try{
        const {rows} = await pool.query(`SELECT p.*,u.email as customer_email,COUNT(c.id) as total_claims
          FROM purchases p
          JOIN insureprousers u ON p.user_id=u.id
          LEFT JOIN claims c ON p.id=c.policy_id
          GROUP BY p.id,u.email ORDER BY p.purchased_at DESC`);
        res.json({success:true,policies:rows,count:rows.length});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to fetch policies',error:err.message})}
    });

    app.get('/api/admin/users', verifyAdminSession, async(req,res)=>{
      try{
        const {rows} = await pool.query(`SELECT u.id,u.email,u.created_at,COUNT(DISTINCT p.id) as total_policies,
          COUNT(DISTINCT c.id) as total_claims,SUM(CAST(p.premium AS DECIMAL)) as total_premium_paid
          FROM insureprousers u
          LEFT JOIN purchases p ON u.id=p.user_id
          LEFT JOIN claims c ON u.id=c.user_id
          GROUP BY u.id,u.email,u.created_at ORDER BY u.created_at DESC`);
        res.json({success:true,users:rows,count:rows.length});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to fetch users',error:err.message})}
    });

    app.get('/api/admin/dashboard-stats', verifyAdminSession, async(req,res)=>{
      try{
        const totalUsers = parseInt((await pool.query('SELECT COUNT(*) as count FROM insureprousers')).rows[0].count);
        const totalPolicies = parseInt((await pool.query('SELECT COUNT(*) as count FROM purchases')).rows[0].count);
        const activePolicies = parseInt((await pool.query("SELECT COUNT(*) as count FROM purchases WHERE status='Active'")).rows[0].count);
        const totalClaims = parseInt((await pool.query('SELECT COUNT(*) as count FROM claims')).rows[0].count);
        const pendingClaims = parseInt((await pool.query("SELECT COUNT(*) as count FROM claims WHERE status IN ('Submitted','Under Review')")).rows[0].count);
        const totalPremium = parseFloat((await pool.query('SELECT SUM(CAST(premium AS DECIMAL)) as total FROM purchases')).rows[0].total||0);
        res.json({success:true,stats:{totalUsers,totalPolicies,activePolicies,totalClaims,pendingClaims,totalPremium:totalPremium.toFixed(2)}});
      }catch(err){console.error(err); res.status(500).json({success:false,message:'Failed to fetch dashboard statistics',error:err.message})}
    });

    /* -------------------------- User Routes -------------------------- */
    // Policies, claims, purchase, invoice, upload
    app.get('/api/user-policies', requireAuth, async(req,res)=>{
      try{const {rows}=await pool.query('SELECT * FROM purchases WHERE user_id=$1 ORDER BY purchased_at DESC',[req.session.user.id]);
      res.json({success:true,policies:rows});}catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to fetch policies',error:err.message})}
    });

    app.get('/api/user/claims', requireAuth, async(req,res)=>{
      try{
        const {rows}=await pool.query(`SELECT c.*,p.policy_name,p.policy_type FROM claims c JOIN purchases p ON c.policy_id=p.id WHERE c.user_id=$1 ORDER BY c.submitted_at DESC`,[req.session.user.id]);
        res.json({success:true,claims:rows});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to fetch claims',error:err.message})}
    });

    app.post('/api/user/claims', requireAuth, upload.array('documents',5), async(req,res)=>{
      try{
        const {policy_id,claim_amount,claim_reason,claim_type}=req.body;
        if(!policy_id || !claim_amount || !claim_reason) return res.status(400).json({success:false,message:'Policy ID, claim amount, and reason are required'});
        const claimNumber='CLM-'+Date.now()+'-'+Math.random().toString(36).substr(2,9).toUpperCase();
        const documentsUploaded=req.files?req.files.map(f=>({filename:f.filename,originalname:f.originalname,mimetype:f.mimetype,size:f.size})):[];

        const {rows}=await pool.query('INSERT INTO claims(user_id,policy_id,claim_number,claim_amount,claim_reason,status,documents_uploaded,claim_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[req.session.user.id,policy_id,claimNumber,claim_amount,claim_reason,'Submitted',JSON.stringify(documentsUploaded),claim_type||'General']);
        res.json({success:true,message:'Claim submitted successfully',claim:rows[0]});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to submit claim',error:err.message})}
    });

    app.post('/api/purchase', requireAuth, async(req,res)=>{
      try{
        const {policy_id,policy_name,premium,policy_type,coverage_amount,policy_term}=req.body;
        if(!policy_id || !policy_name || !premium) return res.status(400).json({success:false,message:'Policy info missing'});
        const {rows}=await pool.query('INSERT INTO purchases(user_id,policy_id,policy_name,premium,policy_type,coverage_amount,policy_term) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[req.session.user.id,policy_id,policy_name,premium,policy_type,coverage_amount,policy_term]);
        res.json({success:true,message:'Policy purchased successfully',purchase:rows[0]});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Purchase failed',error:err.message})}
    });

    app.get('/api/generate-invoice/:purchaseId', requireAuth, async(req,res)=>{
      try{
        const {purchaseId}=req.params;
        const {rows}=await pool.query('SELECT * FROM purchases WHERE id=$1 AND user_id=$2',[purchaseId,req.session.user.id]);
        if(!rows.length) return res.status(404).json({success:false,message:'Purchase not found'});
        const purchase=rows[0];
        const doc=new PDFDocument();
        const filePath=`uploads/invoice-${purchaseId}.pdf`;
        doc.pipe(fs.createWriteStream(filePath));
        doc.fontSize(25).text('Insurance Invoice',{align:'center'});
        doc.moveDown();
        doc.fontSize(16).text(`Policy Name: ${purchase.policy_name}`);
        doc.text(`Premium: ₹${purchase.premium}`);
        doc.text(`Purchased on: ${purchase.purchased_at}`);
        doc.end();
        res.json({success:true,message:'Invoice generated',invoicePath:filePath});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to generate invoice',error:err.message})}
    });

    /* --------------------------- Razorpay Order --------------------------- */
    app.post('/api/create-order', requireAuth, async(req,res)=>{
      try{
        const {amount,currency='INR',receipt} = req.body;
        if(!amount) return res.status(400).json({success:false,message:'Amount required'});
        const options={amount:Math.round(amount*100),currency,receipt:receipt||`rcpt_${Date.now()}`};
        const order=await razorpay.orders.create(options);
        res.json({success:true,order});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to create order',error:err.message})}
    });

    /* --------------------------- OTP & Password Reset -------------------- */
    app.post('/api/send-otp', async(req,res)=>{
      try{
        const {email}=req.body;
        if(!email) return res.status(400).json({success:false,message:'Email required'});
        const otp=Math.floor(100000+Math.random()*900000).toString();
        const expires=new Date(Date.now()+10*60*1000);
        await pool.query('UPDATE insureprousers SET otp=$1,otp_expires=$2 WHERE email=$3',[otp,expires,email.toLowerCase()]);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your OTP Code',
          text:`Your OTP is ${otp}. Valid for 10 minutes.`
        });
        res.json({success:true,message:'OTP sent successfully'});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to send OTP',error:err.message})}
    });

    app.post('/api/verify-otp', async(req,res)=>{
      try{
        const {email,otp}=req.body;
        const {rows}=await pool.query('SELECT otp,otp_expires FROM insureprousers WHERE email=$1',[email.toLowerCase()]);
        if(!rows.length) return res.status(404).json({success:false,message:'Email not found'});
        const userOtp=rows[0];
        if(userOtp.otp!==otp) return res.status(400).json({success:false,message:'Invalid OTP'});
        if(new Date(userOtp.otp_expires)<new Date()) return res.status(400).json({success:false,message:'OTP expired'});
        res.json({success:true,message:'OTP verified'});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to verify OTP',error:err.message})}
    });

    app.post('/api/reset-password', async(req,res)=>{
      try{
        const {email,newPassword}=req.body;
        if(!email||!newPassword) return res.status(400).json({success:false,message:'Email and new password required'});
        const hash=await bcrypt.hash(newPassword,12);
        await pool.query('UPDATE insureprousers SET password_hash=$1,otp=NULL,otp_expires=NULL WHERE email=$2',[hash,email.toLowerCase()]);
        res.json({success:true,message:'Password reset successful'});
      }catch(err){console.error(err);res.status(500).json({success:false,message:'Failed to reset password',error:err.message})}
    });

    /* --------------------------- Production Build ------------------------ */
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, 'frontend', 'build')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
      });
    }

    /* --------------------------- Start Listening ------------------------- */
    app.listen(port, ()=>console.log(`🚀 Server running on port ${port}`));

  } catch(err) { console.error('❌ Server failed to start:', err); process.exit(1); }
};

startServer();
