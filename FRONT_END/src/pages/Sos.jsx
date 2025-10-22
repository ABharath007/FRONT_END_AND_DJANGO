import React, { useState } from "react";
import MenuBar from "./MenuBar";
import "../style/Sos.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Sos({ onLogout, onNav, onUpdateDashboard }) {
  const [loading, setLoading] = useState(false);

  const handleSendSos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("User not authenticated");

      const response = await axios.post(
        `${API_URL}/api/sos/`,
        { type: "General Emergency" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ " + response.data.message);
      console.log("Updated SOS count:", response.data.sos_calls);

      // Optionally refresh dashboard count
      if (onUpdateDashboard) onUpdateDashboard();

    } catch (err) {
      console.error("Error sending SOS:", err);
      alert("❌ Failed to send SOS. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />

      <div className="sos-container">
        <h2 className="sos-title">Send SOS Alert</h2>
        <p className="sos-description">
          In case of emergency, press the SOS button below to alert your contacts and share your location.
        </p>

        <button
          className="sos-button"
          onClick={handleSendSos}
          disabled={loading}
        >
          <span className="sos-button-icon">🚨</span>
          {loading ? "Sending..." : "SEND SOS"}
        </button>

        <div className="sos-info">
          <h3>How It Works</h3>
          <ul>
            <li>Your location will be shared with selected contacts.</li>
            <li>They will receive an immediate alert.</li>
            <li>Use this only in real emergencies.</li>
          </ul>
        </div>

        
      </div>
    </>
  );
}
