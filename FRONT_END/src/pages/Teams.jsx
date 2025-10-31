import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/Teams.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Teams({ onBack }) {
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState("browse"); // browse, my-teams, or requests
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMessages, setTeamMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState("info"); // info, members, chat, heatmap
  
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    department: "fire",
    max_members: 50,
  });

  useEffect(() => {
    fetchTeams();
    fetchMyTeams();
    fetchPendingRequests();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/teams/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/my-teams/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyTeams(response.data);
    } catch (error) {
      console.error("Failed to fetch my teams:", error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/teams/requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/teams/requests/${requestId}/approve/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Request approved! Member added to team. Go to Team Dashboard to see them.");
      fetchPendingRequests();
      fetchMyTeams();
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/teams/requests/${requestId}/reject/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Request rejected");
      fetchPendingRequests();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to reject request");
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_URL}/api/teams/`, createForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Team created successfully!");
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "", department: "fire", max_members: 50 });
      fetchTeams();
      fetchMyTeams();
    } catch (error) {
      console.error("Create team error:", error.response?.data);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.error || 
                       JSON.stringify(error.response?.data) ||
                       "Failed to create team. You must be a Team Leader or Coordinator.";
      alert(errorMsg);
    }
  };

  const handleJoinRequest = async (teamId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${API_URL}/api/teams/join/`,
        { team_id: teamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Join request sent! Waiting for team leader approval.");
      fetchTeams();
    } catch (error) {
      console.error("Join request error:", error.response?.data);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail ||
                       "Failed to send join request";
      alert(errorMsg);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/teams/${teamId}/members/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  const fetchTeamMessages = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/team/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendTeamMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/team/messages/`,
        { message: newMessage, department: selectedTeam?.department },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      fetchTeamMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    }
  };

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/incidents/heatmap/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(response.data);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    }
  };

  const openTeamDetails = (team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
    setActiveDetailTab("info");
    fetchTeamMembers(team.id);
    fetchTeamMessages();
    fetchIncidents();
  };

  if (loading) return <div className="loading">Loading teams...</div>;

  return (
    <div className="teams-container">
      <div className="teams-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h1>🏢 Team Management</h1>
        <button onClick={() => setShowCreateModal(true)} className="create-team-btn">
          + Create Team
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "browse" ? "tab active" : "tab"}
          onClick={() => setActiveTab("browse")}
        >
          Browse Teams ({teams.length})
        </button>
        <button
          className={activeTab === "my-teams" ? "tab active" : "tab"}
          onClick={() => setActiveTab("my-teams")}
        >
          My Teams ({myTeams.length})
        </button>
        {pendingRequests.length > 0 && (
          <button
            className={activeTab === "requests" ? "tab active" : "tab"}
            onClick={() => setActiveTab("requests")}
          >
            Pending Requests ({pendingRequests.length})
          </button>
        )}
      </div>

      {/* Browse Teams Tab */}
      {activeTab === "browse" && (
        <div className="teams-grid">
          {teams.filter(team => !myTeams.some(myTeam => myTeam.id === team.id)).length === 0 ? (
            <p className="empty-state">No teams available to join</p>
          ) : (
            teams
              .filter(team => !myTeams.some(myTeam => myTeam.id === team.id))
              .map((team) => (
              <div key={team.id} className="team-card">
                <div className="team-header">
                  <h3>{team.name}</h3>
                  <span className={`dept-badge ${team.department}`}>
                    {team.department_display}
                  </span>
                </div>
                <p className="team-description">{team.description || "No description"}</p>
                <div className="team-info">
                  <p><strong>👤 Leader:</strong> {team.leader_name}</p>
                  <p><strong>👥 Members:</strong> {team.member_count} / {team.max_members}</p>
                </div>
                <button 
                  className="join-btn"
                  onClick={() => handleJoinRequest(team.id)}
                >
                  Request to Join
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Teams Tab */}
      {activeTab === "my-teams" && (
        <div className="teams-grid">
          {myTeams.length === 0 ? (
            <p className="empty-state">You haven't joined any teams yet</p>
          ) : (
            myTeams.map((team) => (
              <div key={team.id} className="team-card my-team">
                <div className="team-header">
                  <h3>{team.name}</h3>
                  <span className={`dept-badge ${team.department}`}>
                    {team.department_display}
                  </span>
                </div>
                <p className="team-description">{team.description || "No description"}</p>
                <div className="team-info">
                  <p><strong>👤 Leader:</strong> {team.leader_name}</p>
                  <p><strong>👥 Members:</strong> {team.member_count} / {team.max_members}</p>
                </div>
                <button 
                  className="view-btn"
                  onClick={() => openTeamDetails(team)}
                >
                  View Team
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === "requests" && (
        <div className="teams-grid">
          {pendingRequests.length === 0 ? (
            <p className="empty-state">No pending requests</p>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.id} className="team-card request-card">
                <div className="team-header">
                  <h3>📩 Join Request</h3>
                  <span className="status-badge pending">Pending</span>
                </div>
                <div className="request-info">
                  <p><strong>👤 From:</strong> {req.member_name}</p>
                  <p><strong>🏢 Team:</strong> {req.team_name}</p>
                  <p><strong>🎯 Requested Role:</strong> {req.requested_role_display}</p>
                  {req.message && <p><strong>💬 Message:</strong> {req.message}</p>}
                  <p className="request-date">📅 {new Date(req.requested_at).toLocaleString()}</p>
                </div>
                <div className="request-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApprove(req.id)}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleReject(req.id)}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Team</h2>
            <form onSubmit={createTeam}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  placeholder="e.g., Alpha Response Team"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows="3"
                  placeholder="Brief description of the team..."
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  required
                >
                  <option value="fire">Fire Department</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="police">Police</option>
                  <option value="rescue">Rescue Team</option>
                  <option value="relief">Relief Distribution</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Members</label>
                <input
                  type="number"
                  value={createForm.max_members}
                  onChange={(e) => setCreateForm({ ...createForm, max_members: parseInt(e.target.value) })}
                  min="5"
                  max="200"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowTeamDetails(false)}>
          <div className="modal-content team-details-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedTeam.name}</h2>
            
            {/* Detail Tabs */}
            <div className="detail-tabs">
              <button
                className={activeDetailTab === "info" ? "detail-tab active" : "detail-tab"}
                onClick={() => setActiveDetailTab("info")}
              >
                📝 Info
              </button>
              <button
                className={activeDetailTab === "members" ? "detail-tab active" : "detail-tab"}
                onClick={() => setActiveDetailTab("members")}
              >
                👥 Members
              </button>
              <button
                className={activeDetailTab === "chat" ? "detail-tab active" : "detail-tab"}
                onClick={() => setActiveDetailTab("chat")}
              >
                💬 Chat
              </button>
              <button
                className={activeDetailTab === "heatmap" ? "detail-tab active" : "detail-tab"}
                onClick={() => setActiveDetailTab("heatmap")}
              >
                🗺️ Heat Map
              </button>
            </div>

            {/* Info Tab */}
            {activeDetailTab === "info" && (
              <div className="team-details-content">
                <p><strong>📝 Description:</strong> {selectedTeam.description || "No description"}</p>
                <p><strong>🏢 Department:</strong> {selectedTeam.department_display}</p>
                <p>
                  <strong>👤 Leader:</strong> {selectedTeam.leader_name}
                  {selectedTeam.leader_verified && <span className="verified-badge">✓</span>}
                </p>
                <p><strong>👥 Members:</strong> {selectedTeam.member_count} / {selectedTeam.max_members}</p>
                <p><strong>📅 Created:</strong> {new Date(selectedTeam.created_at).toLocaleDateString()}</p>
                <p><strong>✅ Status:</strong> {selectedTeam.is_active ? "Active" : "Inactive"}</p>
              </div>
            )}

            {/* Members Tab */}
            {activeDetailTab === "members" && (
              <div className="team-members-list">
                {teamMembers.length === 0 ? (
                  <p className="empty-state">No members yet</p>
                ) : (
                  teamMembers.map((membership) => (
                    <div key={membership.id} className="member-item">
                      <div className="member-info">
                        <span className="member-name">
                          {membership.member_name}
                          {membership.member_verified && <span className="verified-badge">✓</span>}
                        </span>
                        <span className="member-role">{membership.role_display}</span>
                      </div>
                      <span className="member-joined">
                        Joined: {new Date(membership.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeDetailTab === "chat" && (
              <div className="team-chat">
                <div className="chat-messages">
                  {teamMessages.length === 0 ? (
                    <p className="empty-state">No messages yet</p>
                  ) : (
                    teamMessages.map((msg) => (
                      <div key={msg.id} className="chat-message">
                        <div className="message-header">
                          <span className="message-sender">
                            {msg.sender_name}
                            {msg.sender_verified && <span className="verified-badge">✓</span>}
                          </span>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="message-text">{msg.message}</p>
                        {msg.is_broadcast && <span className="broadcast-badge">📢 Broadcast</span>}
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendTeamMessage()}
                    placeholder="Type a message..."
                  />
                  <button onClick={sendTeamMessage} className="send-btn">
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Heat Map Tab */}
            {activeDetailTab === "heatmap" && (
              <div className="team-heatmap">
                <h3>Incident Heat Map</h3>
                {incidents.length === 0 ? (
                  <p className="empty-state">No incidents to display</p>
                ) : (
                  <div className="incidents-list">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="incident-item">
                        <span className="incident-type">{incident.incident_type}</span>
                        <span className="incident-location">
                          📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                        </span>
                        <span className="incident-time">
                          {new Date(incident.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowTeamDetails(false)} className="cancel-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
