import React, { useState } from "react";
import axios from "axios";
import "../style/TeamRegister.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TeamRegister({ onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "field_responder",
    department: "rescue",
    badge_number: "",
    certification: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      await axios.post(`${API_URL}/api/team/register/`, formData);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        let errorMsg = "";
        
        // Handle specific error cases
        if (data.username) {
          errorMsg += "Username: " + (Array.isArray(data.username) ? data.username.join(", ") : data.username) + "\n";
        }
        if (data.email) {
          errorMsg += "Email: " + (Array.isArray(data.email) ? data.email.join(", ") : data.email) + "\n";
        }
        if (data.badge_number) {
          errorMsg += "Badge Number: " + (Array.isArray(data.badge_number) ? data.badge_number.join(", ") : data.badge_number) + "\n";
        }
        if (data.phone) {
          errorMsg += "Phone: " + (Array.isArray(data.phone) ? data.phone.join(", ") : data.phone) + "\n";
        }
        
        // Handle other errors
        Object.entries(data).forEach(([key, value]) => {
          if (!['username', 'email', 'badge_number', 'phone'].includes(key)) {
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

  if (success) {
    return (
      <div className="team-register-container">
        <div className="success-message-box">
          <div className="success-icon">✓</div>
          <h2>Registration Successful!</h2>
          <p>Your team member account has been created.</p>
          <p className="verification-note">
            Please wait for admin verification before you can access the team dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-register-container">
      <button className="back-button" onClick={onBack}>
        <i className="fas fa-chevron-left"></i>
      </button>

      <div className="team-register-box">
        <div className="team-header">
          <div className="team-logo">🚨</div>
          <h1>Team Member Registration</h1>
          <p className="team-subtitle">Join the Disaster Management Team</p>
        </div>

        <form onSubmit={handleSubmit} className="team-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="field_responder">Field Responder</option>
                <option value="medical_staff">Medical Staff</option>
                <option value="coordinator">Coordinator</option>
                <option value="team_leader">Team Leader</option>
                <option value="logistics">Logistics</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="rescue">Rescue Team</option>
                <option value="medical">Medical Emergency</option>
                <option value="fire">Fire Department</option>
                <option value="police">Police</option>
                <option value="relief">Relief Distribution</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="badge_number">Badge Number *</label>
              <input
                type="text"
                id="badge_number"
                name="badge_number"
                value={formData.badge_number}
                onChange={handleChange}
                required
                placeholder="e.g., RES-2024-001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="e.g., +91 9876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="certification">Certification (Optional)</label>
            <input
              type="text"
              id="certification"
              name="certification"
              value={formData.certification}
              onChange={handleChange}
              placeholder="e.g., Emergency Medical Technician, Fire Safety"
            />
          </div>

          <button type="submit" className="submit-btn">
            Register as Team Member
          </button>
        </form>
      </div>
    </div>
  );
}
