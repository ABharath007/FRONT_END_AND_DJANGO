import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/LoginRegister.css";

// Define the base URL for your Django API
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function LoginRegister({ initialMode = "login", onLogin, onBack }) {
  const [isLoginActive, setIsLoginActive] = useState(initialMode === "login");

  // State for form fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoginActive(initialMode === "login");
  }, [initialMode]);

  const toggleForms = (isLogin) => {
    setIsLoginActive(isLogin);
    setError(""); // Clear errors when switching
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${API_URL}/api/token/`, {
        username: loginUsername,
        password: loginPassword,
      });
      const token = response.data.access;
      localStorage.setItem("accessToken", token);
      
      // Check if user is a team member
      try {
        await axios.get(`${API_URL}/api/team/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // If successful, user is a verified team member
        console.log("✅ Team member detected");
        onLogin(loginUsername, token, true); // Pass true for isTeamMember
      } catch (teamErr) {
        // Not a team member or not verified, login as normal user
        console.log("👤 Regular user detected");
        onLogin(loginUsername, token, false); // Pass false for isTeamMember
      }
    } catch (err) {
      setError("Invalid username or password.");
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API_URL}/api/register/`, {
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      alert("Registration successful! Please log in.");
      toggleForms(true); // Switch to login tab
      setLoginUsername(regUsername);
      setLoginPassword("");
    } catch (err) {
      // Handle registration errors from Django
      if (err.response && err.response.data) {
        const data = err.response.data;
        let errorMsg = "";
        
        // Handle specific error cases with user-friendly messages
        if (data.username) {
          const usernameError = Array.isArray(data.username) ? data.username.join(", ") : data.username;
          if (usernameError.includes("already exists")) {
            errorMsg += "This username is already taken. Please choose another.\n";
          } else {
            errorMsg += "Username: " + usernameError + "\n";
          }
        }
        if (data.email) {
          const emailError = Array.isArray(data.email) ? data.email.join(", ") : data.email;
          if (emailError.includes("already exists")) {
            errorMsg += "This email is already registered. Please use another or login.\n";
          } else {
            errorMsg += "Email: " + emailError + "\n";
          }
        }
        if (data.password) {
          errorMsg += "Password: " + (Array.isArray(data.password) ? data.password.join(", ") : data.password) + "\n";
        }
        
        // Handle other errors
        Object.entries(data).forEach(([key, value]) => {
          if (!['username', 'email', 'password'].includes(key)) {
            errorMsg += `${key}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
          }
        });
        
        setError(errorMsg.trim() || "Registration failed. Please check your information.");
      } else if (err.message) {
        setError("Network error: " + err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="hero login-bg">
      <button className="back-button" onClick={onBack}>
        <i className="fas fa-chevron-left"></i>
      </button>

      {/* Left side branding */}
      <div className="branding-section">
        <div className="logo-container">
          <span className="logo-emoji">🚨</span>
        </div>
        <h1 className="brand-name">ResQ</h1>
        <p className="brand-tagline">Emergency Response Platform</p>
      </div>

      <div className="main-box">
        <h2 className="form-title">Welcome Back</h2>
        <div className="form-box">
          <div className="button-box">
            <div id="btn" style={{ left: isLoginActive ? "4px" : "calc(50% + 0px)" }}></div>
            <button 
              type="button" 
              className={`toggle-btn ${isLoginActive ? 'active' : ''}`}
              onClick={() => toggleForms(true)}
            >
              Log in
            </button>
            <button 
              type="button" 
              className={`toggle-btn ${!isLoginActive ? 'active' : ''}`}
              onClick={() => toggleForms(false)}
            >
              Register
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <form
            className="input-group"
            style={{ left: isLoginActive ? "10%" : "-100%" }}
            onSubmit={submitLogin}
          >
            <div className="input-container">
              <input
                type="text"
                className="input-field"
                id="loginUser"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
              <label htmlFor="loginUser" className="input-label">User</label>
            </div>
            <div className="input-container">
              <input
                type="password"
                className="input-field"
                id="loginPass"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <label htmlFor="loginPass" className="input-label">Password</label>
            </div>
            <button type="submit" className="submit-btn">Log in</button>
          </form>

          <form
            className="input-group"
            style={{ left: isLoginActive ? "100%" : "10%" }}
            onSubmit={submitRegister}
          >
            <div className="input-container">
              <input
                type="text"
                className="input-field"
                id="regUser"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              <label htmlFor="regUser" className="input-label">User</label>
            </div>
            <div className="input-container">
              <input
                type="email"
                className="input-field"
                id="regEmail"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <label htmlFor="regEmail" className="input-label">Email</label>
            </div>
            <div className="input-container">
              <input
                type="password"
                className="input-field"
                id="regPass"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <label htmlFor="regPass" className="input-label">Password</label>
            </div>
            <button type="submit" className="submit-btn">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}