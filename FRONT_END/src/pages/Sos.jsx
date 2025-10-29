import React, { useState, useEffect } from "react";
import MenuBar from "./MenuBar";
import "../style/Sos.css";
import axios from "axios";
import { useSettings } from "../context/SettingsContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Function to refresh access token
const getFreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/api/token/refresh/`, {
      refresh: refreshToken,
    });
    const { access } = response.data;
    localStorage.setItem("accessToken", access);
    return access;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
};

export default function Sos({ onLogout, onNav, onUpdateDashboard }) {
  // Get SOS settings from context
  const { sosSettings, notificationSettings } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [userContacts, setUserContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState(() => {
    // Load saved contacts from localStorage
    const saved = localStorage.getItem('selectedSOSContacts');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper: make API request with token, auto-refresh if expired
  const apiRequest = async (method, url, data = null) => {
    let token = localStorage.getItem("accessToken");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      return await axios({ method, url, data, headers });
    } catch (err) {
      if (err.response?.status === 401) {
        const newToken = await getFreshAccessToken();
        if (!newToken) throw err;
        return await axios({ method, url, data, headers: { Authorization: `Bearer ${newToken}` } });
      } else {
        throw err;
      }
    }
  };

  // Fetch user contacts
  const fetchUserContacts = async () => {
    try {
      const response = await apiRequest("get", `${API_URL}/api/user-contacts/`);
      setUserContacts(response.data);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    }
  };

  useEffect(() => {
    fetchUserContacts();
  }, []);

  // Save selected contacts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedSOSContacts', JSON.stringify(selectedContacts));
  }, [selectedContacts]);

  // Get current location - returns a promise
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by your browser."));
      }
    });
  };

  // Toggle contact selection
  const toggleContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Select all contacts
  const selectAllContacts = () => {
    if (selectedContacts.length === userContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(userContacts.map((uc) => uc.contact));
    }
  };

  const handleSendSos = async () => {
    if (selectedContacts.length === 0) {
      alert("⚠️ Please select at least one contact to send SOS.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("User not authenticated");

      // Get current location automatically
      let currentLocation = null;
      try {
        console.log("🔍 Requesting location access...");
        currentLocation = await getCurrentLocation();
        console.log("✅ Location captured successfully:", currentLocation);
        console.log(`📍 Latitude: ${currentLocation.latitude}, Longitude: ${currentLocation.longitude}`);
      } catch (locError) {
        console.error("❌ Location error:", locError);
        console.error("Error code:", locError.code);
        console.error("Error message:", locError.message);
        
        // Show specific error messages
        if (locError.code === 1) {
          console.warn("⚠️ Location permission denied by user");
        } else if (locError.code === 2) {
          console.warn("⚠️ Location unavailable");
        } else if (locError.code === 3) {
          console.warn("⚠️ Location request timeout");
        }
        // Continue without location if it fails
      }

      console.log("📤 Sending SOS with data:", {
        type: "General Emergency",
        contacts: selectedContacts,
        latitude: currentLocation?.latitude || "No location",
        longitude: currentLocation?.longitude || "No location",
      });

      const response = await apiRequest(
        "post",
        `${API_URL}/api/sos/`,
        {
          type: "General Emergency",
          contacts: selectedContacts,
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        }
      );

      alert("✅ " + response.data.message);
      console.log("Updated SOS count:", response.data.sos_calls);

      // Don't reset selected contacts - they are remembered
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
          In case of emergency, select contacts and press the SOS button. Your current location will be automatically captured and sent.
        </p>

        {/* Contact Selection */}
        <div className="contact-selection">
          <div className="contact-header">
            <h3>👥 Select Contacts ({selectedContacts.length}/{userContacts.length})</h3>
            {userContacts.length > 0 && (
              <button className="select-all-btn" onClick={selectAllContacts}>
                {selectedContacts.length === userContacts.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {userContacts.length === 0 ? (
            <div className="no-contacts">
              <p>No contacts available. Add contacts from the Contacts page.</p>
              <button className="nav-btn" onClick={() => onNav("contacts")}>
                Go to Contacts
              </button>
            </div>
          ) : (
            <div className="contacts-grid">
              {userContacts.map((uc) => (
                <div
                  key={uc.id}
                  className={`contact-card ${selectedContacts.includes(uc.contact) ? "selected" : ""}`}
                  onClick={() => toggleContact(uc.contact)}
                >
                  <div className="contact-checkbox">
                    {selectedContacts.includes(uc.contact) && "✓"}
                  </div>
                  <div className="contact-info">
                    <span className="contact-icon">👤</span>
                    <span className="contact-name">{uc.contact_username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOS Button */}
        <button
          className="sos-button"
          onClick={handleSendSos}
          disabled={loading || selectedContacts.length === 0}
        >
          <span className="sos-button-icon">🚨</span>
          {loading ? "Sending..." : "SEND SOS"}
        </button>

        <div className="sos-info">
          <h3>How It Works</h3>
          <ul>
            <li>Select contacts who will receive the SOS alert (your selection will be remembered).</li>
            <li>Press the SOS button - your location will be automatically captured.</li>
            <li>Selected contacts will receive an immediate notification with your location.</li>
            <li>Use this only in real emergencies.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
