import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/Messages.css";
import MenuBar from "./MenuBar";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const Messages = ({ userToken, onLogout, onNav, currentUsername }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverId, setReceiverId] = useState(""); // Track selected receiver
  const [users, setUsers] = useState([]); // List of possible receivers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all messages
  useEffect(() => {
    if (!userToken) {
      setLoading(false);
      setError("No user token provided.");
      return;
    }
    const fetchMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_URL}/api/messages/`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        } else if (Array.isArray(response.data?.messages)) {
          setMessages(response.data.messages);
        } else {
          setMessages([]); // fallback for unexpected API response
        }
      } catch (err) {
        setError("Failed to fetch messages.");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userToken]);

  // Fetch all users for receiver selection
  useEffect(() => {
    if (!userToken) {
      return;
    }
    const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/contacts/`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    // Make sure we get an array
    if (Array.isArray(response.data)) {
      setUsers(response.data);
    } else if (Array.isArray(response.data?.contacts)) {
      setUsers(response.data.contacts);
    } else {
      setUsers([]); // fallback
    }
  } catch (err) {
    setUsers([]); // fallback on error
  }
};
    fetchUsers();
  }, [userToken]);

  // Send new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !receiverId) {
      setError("Please enter a message and select a receiver.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/api/messages/`,
        { text: newMessage, receiver: receiverId },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setMessages([...messages, response.data]);
      setNewMessage("");
      setError("");
    } catch (err) {
      setError("Failed to send message.");
    }
  };

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />
      <div className="messages-container">
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <div className="messages-list">
          {loading ? (
            <div>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div>No messages found.</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  "message-item " +
                  (currentUsername && msg.sender_username === currentUsername
                    ? "sent"
                    : "received")
                }
              >
                <span className="sender">{msg.sender_username}:</span>
                <p>{msg.text}</p>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSendMessage} className="message-form">
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="receiver-select"
            disabled={!userToken}
          >
            <option value="">Select a receiver...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ? user.name : user.email}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="message-input"
            disabled={!userToken}
          />
          <button type="submit" className="send-button" disabled={!userToken}>
            Send
          </button>
        </form>
      </div>
    </>
  );
};

export default Messages;
