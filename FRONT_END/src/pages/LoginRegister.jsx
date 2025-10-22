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
      localStorage.setItem("accessToken", response.data.access);
      onLogin(loginUsername,response.data.access);
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
        let message = Object.values(err.response.data).flat().join(" ");
        setError(message || "Registration failed.");
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

      <div className="main-box">
        <div className="form-box">
          <div className="button-box">
            <div id="btn" style={{ left: isLoginActive ? "0" : "140px" }}></div>
            <button type="button" className="toggle-btn" onClick={() => toggleForms(true)}>
              Log in
            </button>
            <button type="button" className="toggle-btn" onClick={() => toggleForms(false)}>
              Register
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <form
            className="input-group"
            style={{ left: isLoginActive ? "10%" : "-100%" }} // <-- CHANGED FROM 5%
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
            style={{ left: isLoginActive ? "100%" : "10%" }} // <-- CHANGED FROM 5%
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