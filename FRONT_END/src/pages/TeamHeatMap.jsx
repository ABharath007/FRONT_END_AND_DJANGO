import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/TeamHeatMap.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TeamHeatMap({ onBack }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, fire, medical, police, rescue

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/incidents/heatmap/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
      setError("Failed to load incident data");
      setLoading(false);
    }
  };

  const getIncidentTypeColor = (type) => {
    const colors = {
      fire: "#f44336",
      medical: "#2196f3",
      police: "#3f51b5",
      rescue: "#ff9800",
      general: "#4caf50",
    };
    return colors[type?.toLowerCase()] || "#666";
  };

  const filteredIncidents = filter === "all" 
    ? incidents 
    : incidents.filter(inc => inc.incident_type?.toLowerCase() === filter.toLowerCase());

  if (loading) {
    return (
      <div className="heatmap-container">
        <div className="loading">Loading heat map data...</div>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      {/* Header */}
      <div className="heatmap-header">
        <button onClick={onBack} className="back-btn">←</button>
        <div className="header-content">
          <h1>🗺️ Incident Heat Map</h1>
          <p>Real-time incident location tracking</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-section">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({incidents.length})
        </button>
        <button
          className={`filter-btn fire ${filter === "fire" ? "active" : ""}`}
          onClick={() => setFilter("fire")}
        >
          🔥 Fire
        </button>
        <button
          className={`filter-btn medical ${filter === "medical" ? "active" : ""}`}
          onClick={() => setFilter("medical")}
        >
          🏥 Medical
        </button>
        <button
          className={`filter-btn police ${filter === "police" ? "active" : ""}`}
          onClick={() => setFilter("police")}
        >
          🚔 Police
        </button>
        <button
          className={`filter-btn rescue ${filter === "rescue" ? "active" : ""}`}
          onClick={() => setFilter("rescue")}
        >
          🚁 Rescue
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Incidents Grid */}
      <div className="incidents-grid">
        {filteredIncidents.length === 0 ? (
          <div className="empty-state">
            <p>No incidents to display</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="incident-card"
              style={{ borderLeftColor: getIncidentTypeColor(incident.incident_type) }}
            >
              <div className="incident-card-header">
                <span className="incident-type-badge" style={{ background: getIncidentTypeColor(incident.incident_type) }}>
                  {incident.incident_type || "Unknown"}
                </span>
                <span className="incident-id">#{incident.id}</span>
              </div>
              
              <div className="incident-location">
                <div className="location-info">
                  <span className="location-label">📍 Location:</span>
                  <span className="coordinates">
                    {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  🗺️ View on Map
                </a>
              </div>

              <div className="incident-time">
                <span className="time-label">🕒 Reported:</span>
                <span className="time-value">
                  {new Date(incident.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="heatmap-stats">
        <div className="stat-item">
          <span className="stat-label">Total Incidents:</span>
          <span className="stat-value">{incidents.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Showing:</span>
          <span className="stat-value">{filteredIncidents.length}</span>
        </div>
      </div>
    </div>
  );
}
