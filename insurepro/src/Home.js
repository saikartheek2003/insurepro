// src/Home.js
import React, { useState } from 'react';
import BuyPolicy from './buypolicy';
import Login from './Login';
import Signup from './Signup';
import Profile from './Profile';
import HeroSection from './hero';
import Footer from './footer';
import { useAuth } from './AuthContext';
import './Home.css';
import ClaimRenewal from './ClaimRenewal';

const Header = ({ navigateTo, onLogout }) => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi there! How can I help you today?' }]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setTimeout(() => {
      setMessages([...newMessages, { sender: 'bot', text: "Thank you for your message. An agent will be with you shortly." }]);
    }, 1000);
    setInput('');
  };

  const handleProtectedNavigation = (page) => {
    if (!user && page !== 'home' && page !== 'login' && page !== 'signup') {
      navigateTo('login');
    } else {
      navigateTo(page);
    }
  };

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo" onClick={() => navigateTo('home')}>InsurePro</div>
        <nav className="nav-desktop">
          <a onClick={() => navigateTo('home')} className="nav-link">Home</a>
          <a onClick={() => handleProtectedNavigation('policies')} className="nav-link">Buy a Policy</a>
          <a onClick={() => handleProtectedNavigation('claims')} className="nav-link">Claim/Renewal</a>
          {user ? (
            <div className="profile-dropdown" style={{ position: 'relative' }}>
              <button className="profile-btn" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} style={styles.profileButton}>
                <div style={styles.profileIcon}>{user?.email?.charAt(0).toUpperCase() || 'U'}</div>
                <span style={styles.dropdownArrow}>▼</span>
              </button>
              {isProfileDropdownOpen && (
                <div style={styles.profileDropdownMenu}>
                  <div style={styles.userInfo}><strong>{user.email}</strong></div>
                  <div style={styles.dropdownDivider}></div>
                  <button style={styles.dropdownItem} onClick={() => { navigateTo('profile'); setIsProfileDropdownOpen(false); }}>📋 My Policies</button>
                  <button style={styles.dropdownItem} onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <a onClick={() => navigateTo('login')} className="login-btn">Login</a>
          )}
        </nav>

        <div className="mobile-menu-button">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>

        {isBotOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <span>InsurePro Bot</span>
              <button onClick={() => setIsBotOpen(false)}>&times;</button>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>{msg.text}</div>
              ))}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input type="text" placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="mobile-menu">
          <nav className="nav-mobile">
            <a onClick={() => { navigateTo('home'); setIsMenuOpen(false); }} className="nav-link-mobile">Home</a>
            <a onClick={() => { handleProtectedNavigation('policies'); setIsMenuOpen(false); }} className="nav-link-mobile">Buy Policy</a>
            <a onClick={() => { handleProtectedNavigation('claims'); setIsMenuOpen(false); }} className="nav-link-mobile">Claim/renew policy</a>
            {user ? (
              <>
                <a onClick={() => { navigateTo('profile'); setIsMenuOpen(false); }} className="nav-link-mobile">📋 My Policies</a>
                <a onClick={() => { onLogout(); setIsMenuOpen(false); }} className="login-btn-mobile">🚪 Logout</a>
              </>
            ) : (
              <a onClick={() => { navigateTo('login'); setIsMenuOpen(false); }} className="login-btn-mobile">Login</a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

const AchievementsSection = () => {
  const achievements = [
    { value: "98%", title: "Claim Settlement Ratio", description: "We have a proven track record of settling claims efficiently and fairly." },
    { value: "1 Million+", title: "Happy Customers", description: "Trusted by over a million individuals and families across the nation." },
    { value: "24/7", title: "Support", description: "Our dedicated support team is available around the clock to assist you." }
  ];
  return (
    <section className="achievements-section">
      <div className="container achievements-container">
        <div className="achievements-header">
          <h2 className="achievements-title">Our Commitment to You</h2>
          <p className="achievements-subtitle">We pride ourselves on trust, transparency, and customer satisfaction.</p>
        </div>
        <div className="achievements-grid">
          {achievements.map((item, index) => (
            <div key={index} className="achievement-card">
              <h3 className="achievement-value">{item.value}</h3>
              <h4 className="achievement-card-title">{item.title}</h4>
              <p className="achievement-description">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProtectedRoute = ({ children, navigateTo }) => {
  const { user } = useAuth();
  if (!user) {
    navigateTo('login');
    return (
      <div style={styles.accessDenied}>
        <h2>🔒 Access Restricted</h2>
        <p>Please log in to access this page.</p>
      </div>
    );
  }
  return children;
};

const MainContent = ({ currentPage, navigateTo }) => {
  const { user } = useAuth();

  switch (currentPage) {
    case 'policies':
      return <ProtectedRoute navigateTo={navigateTo}><BuyPolicy navigateTo={navigateTo} /></ProtectedRoute>;
   case 'claims':
  return (
    <ProtectedRoute navigateTo={navigateTo}>
      <ClaimRenewal />
    </ProtectedRoute>
  );

    case 'login':
      if (user) { navigateTo('home'); return null; }
      return <Login />;
    case 'signup':
      if (user) { navigateTo('home'); return null; }
      return <Signup />;
    case 'profile':
      return <ProtectedRoute navigateTo={navigateTo}><Profile /></ProtectedRoute>;
    case 'home':
    default:
      return (
        <>
          <HeroSection 
            navigateTo={navigateTo} 
            isLoggedIn={!!user} // ✅ pass login status
          />
          <AchievementsSection />
        </>
      );
  }
};

const Home = () => {
  const { logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => { setCurrentPage(page); window.scrollTo(0,0); };

  return (
    <div className="app">
      <Header navigateTo={navigateTo} onLogout={logout} />
      <main className="content-container">
        <MainContent currentPage={currentPage} navigateTo={navigateTo} />
      </main>
      <Footer />
    </div>
  );
};

// Styles
const styles = {
  profileButton: { display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#fff', border:'2px solid #667eea', borderRadius:'25px', padding:'8px 12px', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#667eea', transition:'all 0.3s ease'},
  profileIcon: { width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'#667eea', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'bold'},
  dropdownArrow:{fontSize:'10px', transition:'transform 0.3s ease'},
  profileDropdownMenu:{position:'absolute', top:'100%', right:'0', backgroundColor:'#fff', border:'1px solid #e1e5e9', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', minWidth:'200px', zIndex:1000, marginTop:'5px', overflow:'hidden'},
  userInfo:{padding:'12px 16px', backgroundColor:'#f8f9fa', borderBottom:'1px solid #e1e5e9', fontSize:'14px', color:'#495057'},
  dropdownDivider:{height:'1px', backgroundColor:'#e1e5e9'},
  dropdownItem:{width:'100%', padding:'12px 16px', backgroundColor:'transparent', border:'none', textAlign:'left', cursor:'pointer', fontSize:'14px', color:'#495057', transition:'background-color 0.2s ease', display:'flex', alignItems:'center', gap:'8px'},
  overlay:{position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:999},
  accessDenied:{minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px', backgroundColor:'#f8f9fa', borderRadius:'12px', margin:'40px auto', maxWidth:'500px'},
  comingSoon:{minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px', backgroundColor:'#f8f9fa', borderRadius:'12px', margin:'40px auto', maxWidth:'500px'},
  backButton:{marginTop:'20px', padding:'12px 24px', backgroundColor:'#6c757d', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'16px', fontWeight:'600', transition:'all 0.3s ease'},
};

export default Home;
