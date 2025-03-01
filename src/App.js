import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Dashboard from './components/Dashboard';
import AuctionItem from './components/AuctionItem';
import PostAuction from './components/PostAuction';
import Landing from './components/Landing';
import AboutUs from './components/AboutUs';
import LegalInfo from './components/LegalInfo';
import ContactUs from './components/ContactUs';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="app">
        <header>
          <h1>Auction App</h1>
          <nav>
            <Link to="/signup" className="nav-link">Signup</Link>
            <Link to="/signin" className="nav-link">Signin</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/post-auction" className="nav-link">Post Auction</Link>
            
            <nav>
            <Link to="/about-us" className="nav-link">About Us</Link>
            <Link to="/legal-info" className="nav-link">Legal Info</Link>
            <Link to="/contact-us" className="nav-link">Contact Us</Link>
            </nav>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/post-auction" className="nav-link">Post Auction</Link>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/auction/:id" element={<AuctionItem />} />
                <Route path="/post-auction" element={<PostAuction />} />

                <button style={{ marginLeft: '10px', background: 'red', color: 'white' }} 
                  onClick={handleLogout} className="nav-link logout-button">Logout</button>
              </>
            ) : (
              <></>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/dashboard" element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/signin" replace />
            } />
            <Route path="/auction/:id" element={<AuctionItem />} />
            <Route path="/post-auction" element={
              isAuthenticated ? <PostAuction /> : <Navigate to="/signin" replace />
            } />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/legal-info" element={<LegalInfo />} />
            <Route path="/contact-us" element={<ContactUs />} />
          </Routes>
        </main>
        <footer>
          <p>&copy; 2025 Auction App. All rights reserved.</p>
          <p>Welcome to the best place to buy and sell items through auctions!</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;