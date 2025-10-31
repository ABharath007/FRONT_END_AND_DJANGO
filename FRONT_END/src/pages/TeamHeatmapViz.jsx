import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import axios from "axios";
import "../style/TeamHeatmapViz.css";

const TYPE_INTENSITY = {
  flood: 1,
  earthquake: 0.8,
  fire: 1.2,
  roadblock: 0.5,
  other: 0.6,
};

const INCIDENT_COLORS = {
  flood: "blue",
  earthquake: "orange",
  fire: "red",
  roadblock: "gray",
  other: "green",
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Heatmap layer component
function HeatmapLayer({ points }) {
  const map = useMapEvents({});
  useEffect(() => {
    let heatLayer;
    if (map && points.length > 0) {
      heatLayer = L.heatLayer(
        points.map((p) => [p.lat, p.lng, TYPE_INTENSITY[p.incident_type] || 1]),
        { radius: 30, blur: 25, maxZoom: 17 }
      ).addTo(map);
    }
    return () => {
      if (heatLayer) map.removeLayer(heatLayer);
    };
  }, [map, points]);
  return null;
}

// Component to recenter map
function RecenterMap({ latlng }) {
  const map = useMap();
  useEffect(() => {
    if (latlng) {
      map.setView(latlng, map.getZoom());
    }
  }, [latlng, map]);
  return null;
}

// Component to capture map clicks
function ClickHandler({ setLat, setLng }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat.toFixed(6));
      setLng(e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

export default function TeamHeatmapViz({ onBack }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [incidentType, setIncidentType] = useState("flood");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState([17.385044, 78.486671]);
  const [duration, setDuration] = useState(7200);

  const token = localStorage.getItem("accessToken");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchPoints = async () => {
    if (!token) {
      setError("Failed to load heatmap data, please login.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/heatmap-data/`, config);
      setPoints(res.data);
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      setError("Failed to load heatmap data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPoints();
  }, []);
  
  // Live update userLocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.log("Geolocation error, using default:", err);
          setUserLocation([17.385044, 78.486671]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setUserLocation([17.385044, 78.486671]);
    }
  }, []);

  // Submit new incident point
  const submitPoint = async (e) => {
    e.preventDefault();
    setError("");
    if (!lat || !lng) {
      setError("Select a point on the map first!");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/heatmap-data/`,
        {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          incident_type: incidentType,
          description,
          duration: parseInt(duration, 10),
        },
        config
      );
      setLat("");
      setLng("");
      setDescription("");
      fetchPoints();
    } catch (err) {
      console.error("Error adding point:", err);
      setError("Failed to add point. Please try again.");
    }
  };
  
  // Delete incident
  const handleDelete = async (incidentId) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      await axios.delete(`${API_URL}/api/heatmap-data/${incidentId}/`, config);
      fetchPoints();
    } catch (err) {
      console.error("Error deleting incident:", err);
      setError("Failed to delete incident.");
    }
  };

  if (loading) return <div className="team-heatmap-loading">Loading heatmap data...</div>;

  return (
    <div className="team-heatmap-container">
      <div className="team-heatmap-header">
        {onBack && <button onClick={onBack} className="team-heatmap-back-btn">←</button>}
        <h1 className="team-heatmap-title">🗺️ Heatmap Visualization</h1>
      </div>
      
      <form className="team-heatmap-form" onSubmit={submitPoint}>
        <input type="text" placeholder="Latitude" value={lat} readOnly />
        <input type="text" placeholder="Longitude" value={lng} readOnly />
        <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
          {Object.keys(TYPE_INTENSITY).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))}>
          <option value="3600">Keep for 1 Hour</option>
          <option value="7200">Keep for 2 Hours</option>
          <option value="21600">Keep for 6 Hours</option>
          <option value="86400">Keep for 24 Hours</option>
        </select>
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" disabled={!lat || !lng}>Add Incident</button>
        {error && <p className="team-heatmap-error">{error}</p>}
      </form>

      <div className="team-heatmap-map-wrapper">
        <MapContainer center={userLocation} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <HeatmapLayer points={points} />
          <ClickHandler setLat={setLat} setLng={setLng} />
          <RecenterMap latlng={userLocation} />
          <Marker position={userLocation}><Popup>You are here</Popup></Marker>

          {points.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={L.divIcon({ className: "custom-marker", html: `<div style="background-color:${INCIDENT_COLORS[p.incident_type] || "black"}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>` })}>
              <Popup>
                <div className="team-incident-popup">
                  <strong>{p.incident_type.charAt(0).toUpperCase() + p.incident_type.slice(1)}</strong>
                  <p>{p.description || "No description"}</p>
                  <hr/>
                  <small>
                    Reported by: <strong>{p.username}</strong>
                    <br />
                    On: {new Date(p.created_at).toLocaleString()}
                  </small>
                  <button className="team-delete-button" onClick={() => handleDelete(p.id)}>
                    Delete Incident
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
