import React, { useState, useEffect } from "react";
import MenuBar from "./MenuBar";
import "../style/Alerts.css";
import axios from "axios";

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

export default function Alerts({ onLogout, onNav }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "unread", "read"

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

  // Fetch alerts
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("get", `${API_URL}/api/sos-alerts/`);
      setAlerts(response.data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      alert("❌ Could not load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Mark alert as read
  const markAsRead = async (alertId) => {
    try {
      await apiRequest("post", `${API_URL}/api/sos-alerts/${alertId}/mark-read/`);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  // Open location in maps
  const openLocation = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread") return !alert.is_read;
    if (filter === "read") return alert.is_read;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (loading) return <div className="loading">Loading alerts...</div>;

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />

      <div className="alerts-container">
        <div className="alerts-header">
          <h2>🔔 SOS Alerts</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="alert-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({alerts.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read ({alerts.length - unreadCount})
          </button>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <span className="no-alerts-icon">📭</span>
            <p>No {filter !== "all" ? filter : ""} alerts found.</p>
          </div>
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-card ${!alert.is_read ? "unread" : ""}`}
              >
                <div className="alert-icon">
                  <span className="sos-icon">🚨</span>
                  {!alert.is_read && <span className="unread-dot"></span>}
                </div>

                <div className="alert-content">
                  <div className="alert-header-row">
                    <h3 className="alert-sender">{alert.sender_username}</h3>
                    <span className="alert-time">{formatDate(alert.created_at)}</span>
                  </div>

                  <p className="alert-message">{alert.message}</p>

                  <div className="alert-type">
                    <span className="type-badge">{alert.sos_type}</span>
                  </div>

                  {alert.latitude && alert.longitude && (
                    <button
                      className="location-link"
                      onClick={() => openLocation(alert.latitude, alert.longitude)}
                    >
                      📍 View Location on Map
                    </button>
                  )}

                  {!alert.is_read && (
                    <button
                      className="mark-read-btn"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
