require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,          
    secure: true,        
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "saikartheekkoramoni@gmail.com",   
      subject: "Test Email",
      text: "This is a test from Node.js",
    });
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Email failed:", err);
  }
}

testMail();
