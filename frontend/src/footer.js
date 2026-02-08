// src/Footer.js
import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: ["About Us", "Careers", "Press", "Blog"],
    products: ["Health Insurance", "Life Insurance", "Car Insurance", "Home Insurance"],
    support: ["Help Center", "Contact Us", "Claims", "Policy Renewal"],
    legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Disclaimer"],
  };

  const socialLinks = ["Facebook", "Twitter", "Instagram", "LinkedIn"];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    alert("Subscribed successfully! (demo)");
  };

  const preventDefault = (e) => e.preventDefault();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Main Section: Brand + Links */}
        <div style={styles.main}>
          {/* Brand */}
          <div style={styles.brandSection}>
            <h2 style={styles.brandName}>InsurePro</h2>
            <p style={styles.tagline}>
              Your trusted partner in securing life's most important moments.
            </p>
            <div style={styles.socialLinks}>
              {socialLinks.map((name) => (
                <a key={name} href="#" onClick={preventDefault} style={styles.socialLink}>
                  {name}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div style={styles.linksContainer}>
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} style={styles.linksColumn}>
                <h3 style={styles.linksTitle}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </h3>
                <ul style={styles.linksList}>
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" onClick={preventDefault} style={styles.footerLink}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div style={styles.newsletter}>
          <h3 style={styles.newsletterTitle}>Stay Updated</h3>
          <p style={styles.newsletterText}>
            Get the latest insurance tips and product updates delivered to your inbox.
          </p>
          <form style={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email address"
              required
              style={styles.newsletterInput}
            />
            <button type="submit" style={styles.newsletterButton}>
              Subscribe
            </button>
          </form>
        </div>

        {/* Bottom */}
        <div style={styles.bottom}>
          <p>&copy; {currentYear} InsurePro. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Styles with media queries using JS
const styles = {
  footer: {
    backgroundColor: "#2d3748",
    color: "#fff",
    padding: "60px 20px 20px",
    marginTop: "auto",
  },
  container: { maxWidth: "1200px", margin: "0 auto" },
  main: {
    display: "flex",
    flexWrap: "wrap",
    gap: "60px",
    marginBottom: "40px",
  },
  brandSection: { flex: "1 1 250px", minWidth: "200px" },
  brandName: {
    fontSize: "2rem",
    fontWeight: "800",
    marginBottom: "10px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  tagline: { fontSize: "1rem", color: "#a0aec0" },
  socialLinks: { display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" },
  socialLink: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  linksContainer: { display: "flex", flexWrap: "wrap", gap: "40px", flex: "2 1 500px" },
  linksColumn: { minWidth: "120px" },
  linksTitle: { fontWeight: "700", marginBottom: "15px" },
  linksList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" },
  footerLink: { color: "#8e9297", textDecoration: "none", fontSize: "0.95rem" },
  newsletter: {
    backgroundColor: "#4a5568",
    padding: "30px",
    borderRadius: "12px",
    marginBottom: "40px",
    textAlign: "center",
  },
  newsletterTitle: { fontSize: "1.2rem", fontWeight: "700", marginBottom: "10px" },
  newsletterText: { color: "#a0aec0", marginBottom: "15px", fontSize: "1rem" },
  newsletterForm: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  newsletterInput: { padding: "10px 12px", borderRadius: "6px", border: "2px solid #495057", fontSize: "1rem", flex: "1 1 200px" },
  newsletterButton: {
    padding: "10px 20px",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  bottom: { borderTop: "1px solid #4a5568", paddingTop: "20px", textAlign: "center", color: "#8e9297" },

  // Media Queries
  "@media (max-width: 768px)": {
    main: { flexDirection: "column", gap: "40px" },
    linksContainer: { flexDirection: "row", flexWrap: "wrap", gap: "20px" },
    socialLinks: { justifyContent: "center" },
  },
  "@media (max-width: 480px)": {
    linksContainer: { flexDirection: "column", gap: "15px" },
    newsletter: { padding: "20px" },
  },
};

export default Footer;
