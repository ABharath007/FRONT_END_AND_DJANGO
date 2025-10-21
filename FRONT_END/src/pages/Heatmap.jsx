import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import axios from "axios";
import MenuBar from "./MenuBar";
import "../style/Heatmap.css";

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

// Component to recenter map on user location update
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

export default function Heatmap({ onLogout, onNav }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [incidentType, setIncidentType] = useState("flood");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState([17.385044, 78.486671]); // fallback

  // Get token and config for API calls
  const token = localStorage.getItem("accessToken");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch heatmap data
  const fetchPoints = async () => {
    if (!token) {
      setError("Failed to load heatmap data, please login.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/heatmap-data/", config);
      setPoints(res.data);
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      if (err.response && err.response.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load heatmap data.");
      }
    }
    setLoading(false);
  };

  // Fetch heatmap points only once on mount
  useEffect(() => {
    fetchPoints();
  }, []);

  // Live update userLocation with watchPosition
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
      console.log("Geolocation not supported");
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
    if (!token) {
      setError("You must be logged in to add an incident.");
      return;
    }
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/heatmap-data/",
        {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          incident_type: incidentType,
          description,
        },
        config
      );
      setLat("");
      setLng("");
      setDescription("");
      fetchPoints();
    } catch (err) {
      console.error("Error adding point:", err);
      setError("Failed to add point.");
    }
  };

  if (loading) return <div>Loading heatmap data...</div>;

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />
      <div className="heatmap-container">
        <h1 className="heatmap-title">🗺️ Heatmap Visualization</h1>

        {/* Add Incident Form */}
        <form className="add-point-form" onSubmit={submitPoint}>
          <input type="text" placeholder="Latitude" value={lat} readOnly />
          <input type="text" placeholder="Longitude" value={lng} readOnly />
          <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
            {Object.keys(TYPE_INTENSITY).map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" disabled={!lat || !lng}>
            Add Incident
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        {/* Map */}
        <MapContainer
          center={userLocation}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <HeatmapLayer points={points} />
          <ClickHandler setLat={setLat} setLng={setLng} />
          <RecenterMap latlng={userLocation} />

          {/* User location */}
          <Marker position={userLocation}>
            <Popup>You are here</Popup>
          </Marker>

          {/* Existing incidents */}
          {points.map((p, idx) => (
            <Marker
              key={idx}
              position={[p.lat, p.lng]}
              icon={L.divIcon({
                className: "custom-marker",
                html: `<div style="background-color:${INCIDENT_COLORS[p.incident_type] || "black"}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
              })}
            >
              <Popup>
                <b>{p.incident_type}</b>
                <br />
                {p.description || "No description"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </>
  );
}
