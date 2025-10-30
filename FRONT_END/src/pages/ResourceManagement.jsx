import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/ResourceManagement.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ResourceManagement({ onBack }) {
  const [resources, setResources] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [assignNotes, setAssignNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      // Fetch resource types
      const typesRes = await axios.get(`${API_URL}/api/resources/types/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResourceTypes(typesRes.data);

      // Fetch resources with filter
      let url = `${API_URL}/api/resources/`;
      if (activeTab !== "all") {
        url += `?status=${activeTab}`;
      }
      
      const resourcesRes = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(resourcesRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedResource) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/resources/assign/`,
        {
          resource_id: selectedResource.id,
          notes: assignNotes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Resource assigned successfully!");
      setShowAssignModal(false);
      setSelectedResource(null);
      setAssignNotes("");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign resource");
    }
  };

  const handleReturn = async (resourceId) => {
    if (!confirm("Are you sure you want to return this resource?")) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      
      // Find the active assignment for this resource
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;
      
      await axios.post(
        `${API_URL}/api/resources/return/${resourceId}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Resource returned successfully!");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to return resource");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "#4caf50",
      in_use: "#ff9800",
      maintenance: "#f44336",
      unavailable: "#9e9e9e",
    };
    return colors[status] || "#666";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      vehicle: "🚗",
      equipment: "🔧",
      medical: "💊",
      communication: "📡",
    };
    return icons[category] || "📦";
  };

  if (loading) {
    return (
      <div className="resource-management">
        <div className="loading">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="resource-management">
      {/* Header */}
      <div className="resource-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h1>🔧 Resource Management</h1>
        <p className="subtitle">Track and manage emergency resources</p>
      </div>

      {/* Tabs */}
      <div className="resource-tabs">
        <button
          className={activeTab === "all" ? "tab active" : "tab"}
          onClick={() => setActiveTab("all")}
        >
          All Resources
        </button>
        <button
          className={activeTab === "available" ? "tab active" : "tab"}
          onClick={() => setActiveTab("available")}
        >
          Available
        </button>
        <button
          className={activeTab === "in_use" ? "tab active" : "tab"}
          onClick={() => setActiveTab("in_use")}
        >
          In Use
        </button>
        <button
          className={activeTab === "maintenance" ? "tab active" : "tab"}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance
        </button>
      </div>

      {/* Resource Grid */}
      <div className="resource-grid">
        {resources.length === 0 ? (
          <div className="empty-state">
            <p>No resources found</p>
          </div>
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="resource-card">
              <div className="resource-card-header">
                <span className="resource-icon">
                  {getCategoryIcon(resource.resource_category)}
                </span>
                <div className="resource-info">
                  <h3>{resource.resource_type_name}</h3>
                  <p className="resource-id">{resource.identifier}</p>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(resource.status) }}
                >
                  {resource.status_display}
                </span>
              </div>

              <div className="resource-details">
                {resource.location && (
                  <div className="detail-row">
                    <span className="detail-label">📍 Location:</span>
                    <span className="detail-value">{resource.location}</span>
                  </div>
                )}
                
                {resource.assigned_to_name && (
                  <div className="detail-row">
                    <span className="detail-label">👤 Assigned to:</span>
                    <span className="detail-value">{resource.assigned_to_name}</span>
                  </div>
                )}

                {resource.next_maintenance && (
                  <div className="detail-row">
                    <span className="detail-label">🔧 Next Maintenance:</span>
                    <span className="detail-value">
                      {new Date(resource.next_maintenance).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {resource.notes && (
                  <div className="detail-row notes">
                    <span className="detail-label">📝 Notes:</span>
                    <span className="detail-value">{resource.notes}</span>
                  </div>
                )}
              </div>

              <div className="resource-actions">
                {resource.status === "available" && (
                  <button
                    onClick={() => {
                      setSelectedResource(resource);
                      setShowAssignModal(true);
                    }}
                    className="action-btn assign-btn"
                  >
                    Assign to Me
                  </button>
                )}
                {resource.status === "in_use" && resource.assigned_to_name && (
                  <button
                    onClick={() => handleReturn(resource.id)}
                    className="action-btn return-btn"
                  >
                    Return Resource
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Resource</h2>
            <p className="modal-subtitle">
              {selectedResource?.resource_type_name} - {selectedResource?.identifier}
            </p>

            <div className="form-group">
              <label>Notes (Optional):</label>
              <textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedResource(null);
                  setAssignNotes("");
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button onClick={handleAssign} className="confirm-btn">
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
