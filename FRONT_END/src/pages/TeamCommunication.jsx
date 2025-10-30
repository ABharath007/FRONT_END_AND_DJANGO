import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/TeamCommunication.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function TeamCommunication({ onBack, teamMember }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    department: "",
    message: "",
    priority: "normal",
  });
  const [broadcastMessage, setBroadcastMessage] = useState({
    message: "",
    priority: "urgent",
  });

  const canBroadcast = teamMember?.role === "team_leader" || teamMember?.role === "coordinator";

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/team/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/team/messages/`,
        newMessage,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Message sent successfully!");
      setNewMessage({ department: "", message: "", priority: "normal" });
      setShowMessageForm(false);
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send message");
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/team/broadcast/`,
        broadcastMessage,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Broadcast sent successfully!");
      setBroadcastMessage({ message: "", priority: "urgent" });
      setShowBroadcastForm(false);
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send broadcast");
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/team/messages/${messageId}/mark-read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages();
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      normal: "#4caf50",
      urgent: "#ff9800",
      emergency: "#f44336",
    };
    return colors[priority] || "#666";
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      normal: "💬",
      urgent: "⚠️",
      emergency: "🚨",
    };
    return icons[priority] || "💬";
  };

  if (loading) {
    return (
      <div className="team-communication">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="team-communication">
      {/* Header */}
      <div className="communication-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h1>💬 Team Communication</h1>
        <p className="subtitle">Coordinate with your team members</p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={() => setShowMessageForm(true)}
          className="action-btn send-btn"
        >
          📤 Send Message
        </button>
        {canBroadcast && (
          <button
            onClick={() => setShowBroadcastForm(true)}
            className="action-btn broadcast-btn"
          >
            📢 Send Broadcast
          </button>
        )}
        <button onClick={fetchMessages} className="action-btn refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Messages List */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-card ${message.is_broadcast ? "broadcast" : ""}`}
              onClick={() => handleMarkAsRead(message.id)}
            >
              <div className="message-header">
                <div className="sender-info">
                  <span className="sender-icon">
                    {message.is_broadcast ? "📢" : "👤"}
                  </span>
                  <div>
                    <h3>{message.sender_name}</h3>
                    <p className="sender-dept">{message.sender_department}</p>
                  </div>
                </div>
                <div className="message-meta">
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(message.priority) }}
                  >
                    {getPriorityIcon(message.priority)} {message.priority_display}
                  </span>
                  <span className="message-time">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {message.is_broadcast && (
                <div className="broadcast-badge">
                  🔊 BROADCAST MESSAGE
                </div>
              )}

              {message.department_display && !message.is_broadcast && (
                <div className="department-badge">
                  📋 To: {message.department_display}
                </div>
              )}

              <div className="message-content">
                <p>{message.message}</p>
              </div>

              <div className="message-footer">
                <span className="read-count">
                  👁️ Read by {message.read_count} members
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Message Modal */}
      {showMessageForm && (
        <div className="modal-overlay" onClick={() => setShowMessageForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Send Message</h2>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Department:</label>
                <select
                  value={newMessage.department}
                  onChange={(e) =>
                    setNewMessage({ ...newMessage, department: e.target.value })
                  }
                  required
                >
                  <option value="">Select Department</option>
                  <option value="fire">Fire Department</option>
                  <option value="medical">Medical Emergency</option>
                  <option value="police">Police</option>
                  <option value="rescue">Rescue Team</option>
                  <option value="relief">Relief Distribution</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={newMessage.priority}
                  onChange={(e) =>
                    setNewMessage({ ...newMessage, priority: e.target.value })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) =>
                    setNewMessage({ ...newMessage, message: e.target.value })
                  }
                  placeholder="Type your message here..."
                  rows="5"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowMessageForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastForm && (
        <div className="modal-overlay" onClick={() => setShowBroadcastForm(false)}>
          <div className="modal-content broadcast-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📢 Send Broadcast</h2>
            <p className="warning-text">
              ⚠️ This message will be sent to ALL team members
            </p>
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={broadcastMessage.priority}
                  onChange={(e) =>
                    setBroadcastMessage({ ...broadcastMessage, priority: e.target.value })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Broadcast Message:</label>
                <textarea
                  value={broadcastMessage.message}
                  onChange={(e) =>
                    setBroadcastMessage({ ...broadcastMessage, message: e.target.value })
                  }
                  placeholder="Type your broadcast message here..."
                  rows="5"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowBroadcastForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="confirm-btn broadcast-confirm">
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
