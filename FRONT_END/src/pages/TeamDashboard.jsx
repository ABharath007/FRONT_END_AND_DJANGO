import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/TeamDashboard.css";
import ResourceManagement from "./ResourceManagement";
import TeamCommunication from "./TeamCommunication";
import TeamAnalytics from "./TeamAnalytics";
import Teams from "./Teams";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TeamDashboard({ onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, resources, communication, analytics
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [showSOSDetails, setShowSOSDetails] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    sos_report_id: "",
    assigned_to_id: "",
    priority: "medium",
    notes: "",
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No token found, logging out");
        onLogout();
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/team/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load team dashboard:", err);
      // If 401 or 404, user is not a team member - logout
      if (err.response && (err.response.status === 401 || err.response.status === 404)) {
        console.error("Not authorized as team member, logging out");
        onLogout();
      } else {
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/team/status/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const assignIncident = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/incidents/assignments/create/`,
        assignmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Incident assigned successfully!");
      setAssignmentForm({
        sos_report_id: "",
        assigned_to_id: "",
        priority: "medium",
        notes: "",
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign incident");
    }
  };

  const updateIncidentStatus = async (assignmentId, newStatus) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/api/incidents/assignments/${assignmentId}/update/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update incident status");
    }
  };

  const addLog = async (assignmentId, message) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/incidents/logs/create/`,
        { assignment_id: assignmentId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (err) {
      alert("Failed to add log");
    }
  };

  if (loading) {
    return (
      <div className="team-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-dashboard">
        <div className="error">{error}</div>
      </div>
    );
  }

  const { team_member, unassigned_sos, active_assignments, my_assignments, available_team, stats } = dashboardData;

  const canAssign = team_member.role === "team_leader" || team_member.role === "coordinator";

  const getStatusColor = (status) => {
    const colors = {
      received: "#ffc107",
      dispatched: "#2196f3",
      en_route: "#ff9800",
      on_scene: "#9c27b0",
      resolved: "#4caf50",
      cancelled: "#f44336",
    };
    return colors[status] || "#666";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: "#f44336",
      high: "#ff9800",
      medium: "#ffc107",
      low: "#4caf50",
    };
    return colors[priority] || "#666";
  };

  // Handle Phase 2 views
  if (currentView === "resources") {
    return <ResourceManagement onBack={() => setCurrentView("dashboard")} />;
  }
  if (currentView === "communication") {
    return <TeamCommunication onBack={() => setCurrentView("dashboard")} teamMember={dashboardData?.team_member} />;
  }
  if (currentView === "analytics") {
    return <TeamAnalytics onBack={() => setCurrentView("dashboard")} />;
  }
  if (currentView === "teams") {
    return <Teams onBack={() => setCurrentView("dashboard")} />;
  }

  return (
    <div className="team-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🚨 Team Dashboard</h1>
          <p className="welcome-text">
            Welcome, {team_member.username} - {team_member.role_display}
          </p>
        </div>
        <div className="header-right">
          <div className="status-selector">
            <label>Status:</label>
            <select
              value={team_member.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="status-dropdown"
            >
              <option value="on_duty">On Duty</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{stats.total_unassigned}</h3>
            <p>Unassigned SOS</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3>{stats.total_active}</h3>
            <p>Active Incidents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <h3>{stats.my_active}</h3>
            <p>My Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.available_members}</h3>
            <p>Available Team</p>
          </div>
        </div>
      </div>

      {/* Phase 2 Quick Access */}
      <div className="quick-access-section">
        <h2 className="section-title">⚡ Quick Access</h2>
        <div className="quick-access-grid">
          <button
            onClick={() => setCurrentView("resources")}
            className="quick-access-btn resources"
          >
            <span className="qa-icon">🔧</span>
            <span className="qa-text">Resources</span>
            <span className="qa-desc">Manage equipment & vehicles</span>
          </button>
          <button
            onClick={() => setCurrentView("communication")}
            className="quick-access-btn communication"
          >
            <span className="qa-icon">💬</span>
            <span className="qa-text">Team Chat</span>
            <span className="qa-desc">Coordinate with team</span>
          </button>
          <button
            onClick={() => setCurrentView("analytics")}
            className="quick-access-btn analytics"
          >
            <span className="qa-icon">📊</span>
            <span className="qa-text">Analytics</span>
            <span className="qa-desc">View performance metrics</span>
          </button>
          <button
            onClick={() => setCurrentView("teams")}
            className="quick-access-btn teams"
          >
            <span className="qa-icon">🏢</span>
            <span className="qa-text">Teams</span>
            <span className="qa-desc">Create & join teams</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "overview" ? "tab active" : "tab"}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "my_assignments" ? "tab active" : "tab"}
          onClick={() => setActiveTab("my_assignments")}
        >
          My Assignments ({my_assignments.length})
        </button>
        {canAssign && (
          <button
            className={activeTab === "assign" ? "tab active" : "tab"}
            onClick={() => setActiveTab("assign")}
          >
            Assign Incidents
          </button>
        )}
        <button
          className={activeTab === "team" ? "tab active" : "tab"}
          onClick={() => setActiveTab("team")}
        >
          My Team Members ({available_team.length + 1})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="section">
              <h2>🆘 Unassigned SOS Reports</h2>
              {unassigned_sos.length === 0 ? (
                <p className="empty-state">No unassigned SOS reports</p>
              ) : (
                <div className="incidents-list">
                  {unassigned_sos.map((sos) => (
                    <div 
                      key={sos.id} 
                      className="incident-card unassigned clickable"
                      onClick={() => {
                        setSelectedSOS(sos);
                        setShowSOSDetails(true);
                      }}
                    >
                      <div className="incident-header">
                        <span className="incident-type">🆘 {sos.type}</span>
                        <span className="incident-status pending">{sos.status}</span>
                      </div>
                      <div className="incident-details">
                        <p><strong>👤 User:</strong> {sos.username}</p>
                        <p><strong>📞 Phone:</strong> {sos.phone_number}</p>
                        <p>
                          <strong>📍 Location:</strong> {sos.latitude}, {sos.longitude}
                          {sos.latitude !== 0 && sos.longitude !== 0 && (
                            <a
                              href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="map-link-inline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🗺️ View on Map
                            </a>
                          )}
                        </p>
                        <p><strong>📝 Description:</strong> {sos.description || "No description"}</p>
                        <p className="incident-date">
                          🕐 {new Date(sos.date).toLocaleString()}
                        </p>
                      </div>
                      {canAssign && (
                        <button
                          className="assign-btn-quick"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignmentForm({...assignmentForm, sos_report_id: sos.id});
                            setActiveTab("assign");
                          }}
                        >
                          Assign Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section">
              <h2>🔥 Active Assignments</h2>
              {active_assignments.length === 0 ? (
                <p className="empty-state">No active assignments</p>
              ) : (
                <div className="incidents-list">
                  {active_assignments.map((assignment) => (
                    <div key={assignment.id} className="incident-card">
                      <div className="incident-header">
                        <span className="incident-type">{assignment.sos_type}</span>
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(assignment.priority) }}
                        >
                          {assignment.priority_display}
                        </span>
                      </div>
                      <p className="incident-info">
                        <strong>Assigned to:</strong> {assignment.assigned_to_name} ({assignment.assigned_to_department})
                      </p>
                      <p className="incident-info">
                        <strong>Status:</strong>{" "}
                        <span style={{ color: getStatusColor(assignment.status) }}>
                          {assignment.status_display}
                        </span>
                      </p>
                      <p className="incident-date">
                        {new Date(assignment.assigned_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "my_assignments" && (
          <div className="my-assignments-section">
            <h2>My Active Assignments</h2>
            {my_assignments.length === 0 ? (
              <p className="empty-state">You have no active assignments</p>
            ) : (
              <div className="assignments-grid">
                {my_assignments.map((assignment) => (
                  <div key={assignment.id} className="assignment-card">
                    <div className="assignment-header">
                      <h3>{assignment.sos_type}</h3>
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(assignment.priority) }}
                      >
                        {assignment.priority_display}
                      </span>
                    </div>
                    <div className="assignment-body">
                      <p>
                        <strong>Reported by:</strong> {assignment.sos_user}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span style={{ color: getStatusColor(assignment.status) }}>
                          {assignment.status_display}
                        </span>
                      </p>
                      <p>
                        <strong>Assigned:</strong>{" "}
                        {new Date(assignment.assigned_at).toLocaleString()}
                      </p>
                      {assignment.notes && (
                        <p className="notes">
                          <strong>Notes:</strong> {assignment.notes}
                        </p>
                      )}
                    </div>
                    <div className="assignment-actions">
                      <select
                        value={assignment.status}
                        onChange={(e) => updateIncidentStatus(assignment.id, e.target.value)}
                        className="status-update"
                      >
                        <option value="received">Received</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="en_route">En Route</option>
                        <option value="on_scene">On Scene</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button
                        onClick={() => {
                          const msg = prompt("Add a log message:");
                          if (msg) addLog(assignment.id, msg);
                        }}
                        className="add-log-btn"
                      >
                        Add Log
                      </button>
                    </div>
                    {assignment.logs && assignment.logs.length > 0 && (
                      <div className="logs-section">
                        <h4>Logs:</h4>
                        {assignment.logs.map((log) => (
                          <div key={log.id} className="log-entry">
                            <span className="log-time">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="log-author">{log.logged_by_name}:</span>
                            <span className="log-message">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "assign" && canAssign && (
          <div className="assign-section">
            <h2>Assign Incident to Team Member</h2>
            <form onSubmit={assignIncident} className="assign-form">
              <div className="form-group">
                <label>Select SOS Report:</label>
                <select
                  value={assignmentForm.sos_report_id}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, sos_report_id: e.target.value })
                  }
                  required
                >
                  <option value="">-- Select SOS --</option>
                  {unassigned_sos.map((sos, idx) => (
                    <option key={idx} value={idx + 1}>
                      {sos.type} - {new Date(sos.date).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assign To:</label>
                <select
                  value={assignmentForm.assigned_to_id}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, assigned_to_id: e.target.value })
                  }
                  required
                >
                  <option value="">-- Select Team Member --</option>
                  {available_team.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username} - {member.department_display} ({member.status_display})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={assignmentForm.priority}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={assignmentForm.notes}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, notes: e.target.value })
                  }
                  rows="3"
                  placeholder="Additional instructions or notes..."
                />
              </div>

              <button type="submit" className="assign-btn">
                Assign Incident
              </button>
            </form>
          </div>
        )}

        {activeTab === "team" && (
          <div className="team-section">
            <h2>👥 My Team Members</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>Members from teams you belong to</p>
            <div className="team-grid">
              {/* Current User */}
              <div className="team-member-card current-user">
                <div className="member-header">
                  <span className="member-icon">👤</span>
                  <div className="member-info">
                    <h3>{team_member.username} (You)</h3>
                    <p className="member-role">{team_member.role_display}</p>
                  </div>
                </div>
                <div className="member-details">
                  <p><strong>Department:</strong> {team_member.department_display}</p>
                  <p><strong>Badge:</strong> {team_member.badge_number}</p>
                  <p><strong>Phone:</strong> {team_member.phone_number}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${team_member.status}`}>
                      {team_member.status_display}
                    </span>
                  </p>
                </div>
              </div>

              {/* Other Team Members */}
              {available_team.map((member) => (
                <div key={member.id} className="team-member-card">
                  <div className="member-header">
                    <span className="member-icon">
                      {member.role === 'team_leader' ? '⭐' : 
                       member.role === 'coordinator' ? '🎯' : '👤'}
                    </span>
                    <div className="member-info">
                      <h3>{member.username}</h3>
                      <p className="member-role">{member.role_display}</p>
                    </div>
                  </div>
                  <div className="member-details">
                    <p><strong>Department:</strong> {member.department_display}</p>
                    <p><strong>Badge:</strong> {member.badge_number}</p>
                    <p><strong>Phone:</strong> {member.phone_number}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${member.status}`}>
                        {member.status_display}
                      </span>
                    </p>
                  </div>
                  {member.current_assignment && (
                    <div className="member-assignment">
                      <p className="assignment-label">🔥 Currently Assigned:</p>
                      <p className="assignment-detail">{member.current_assignment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SOS Details Modal */}
      {showSOSDetails && selectedSOS && (
        <div className="modal-overlay" onClick={() => setShowSOSDetails(false)}>
          <div className="modal-content sos-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🆘 SOS Report Details</h2>
            <div className="sos-details">
              <div className="detail-row">
                <strong>Type:</strong>
                <span className="sos-type">{selectedSOS.type}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${selectedSOS.status.toLowerCase()}`}>
                  {selectedSOS.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>User:</strong>
                <span>{selectedSOS.username}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedSOS.phone_number}</span>
              </div>
              <div className="detail-row">
                <strong>Location:</strong>
                <span>
                  Lat: {selectedSOS.latitude}, Long: {selectedSOS.longitude}
                  <a 
                    href={`https://www.google.com/maps?q=${selectedSOS.latitude},${selectedSOS.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                    📍 View on Map
                  </a>
                </span>
              </div>
              <div className="detail-row">
                <strong>Description:</strong>
                <p className="description-text">{selectedSOS.description || "No description provided"}</p>
              </div>
              <div className="detail-row">
                <strong>Reported:</strong>
                <span>{new Date(selectedSOS.date).toLocaleString()}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSOSDetails(false)} className="close-btn">
                Close
              </button>
              {canAssign && (
                <button
                  onClick={() => {
                    setAssignmentForm({...assignmentForm, sos_report_id: selectedSOS.id});
                    setShowSOSDetails(false);
                    setActiveTab("assign");
                  }}
                  className="assign-btn"
                >
                  Assign to Team Member
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
