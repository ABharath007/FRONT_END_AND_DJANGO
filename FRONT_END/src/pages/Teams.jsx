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
  const [activeTab, setActiveTab] = useState("browse"); // browse, my-teams, or requests
  
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    department: "fire",
    max_members: 50,
  });

  useEffect(() => {
    fetchTeams();
    fetchMyTeams();
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

  if (loading) return <div className="loading">Loading teams...</div>;

  return (
    <div className="teams-container">
      <div className="teams-header">
        <button onClick={onBack} className="back-btn">← Back</button>
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
      </div>

      {/* Browse Teams Tab */}
      {activeTab === "browse" && (
        <div className="teams-grid">
          {teams.length === 0 ? (
            <p className="empty-state">No teams available</p>
          ) : (
            teams.map((team) => (
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
                <button className="view-btn">View Team</button>
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
    </div>
  );
}
