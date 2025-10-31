import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "../style/TeamMessages.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const TeamMessages = ({ userToken, onBack, currentUsername }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [verifiedUsers, setVerifiedUsers] = useState(new Set());
  const [viewedThreads, setViewedThreads] = useState(() => {
    const saved = localStorage.getItem('viewedThreads');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [activeThread, setActiveThread] = useState({ type: "global", userId: null });
  const listRef = useRef(null);

  // Fetch all messages + poll every 3s
  useEffect(() => {
    if (!userToken) {
      setLoading(false);
      setError("No user token provided.");
      return;
    }
    let cancelled = false;
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/messages/`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const payload = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.messages)
          ? response.data.messages
          : [];
        if (!cancelled) setMessages(payload);
      } catch (err) {
        if (!cancelled) {
          setError("Failed to fetch messages.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userToken]);

  // Fetch current user info
  useEffect(() => {
    if (!userToken) return;
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/me/`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setCurrentUserId(response.data.id);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchCurrentUser();
  }, [userToken]);

  // Fetch all users for DM list
  useEffect(() => {
    if (!userToken) return;
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const usersData = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response.data?.users) ? response.data.users : [];
        setUsers(usersData);
        
        const verified = new Set(
          usersData.filter(u => u.is_verified).map(u => u.username)
        );
        setVerifiedUsers(verified);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [userToken]);

  // Determine visible messages based on thread
  const visibleMessages = useMemo(() => {
    if (!messages?.length) return [];
    if (activeThread.type === "global") {
      return messages.filter((m) => !m.receiver && !m.receiver_id);
    }
    const peerId = activeThread.userId;
    if (!currentUserId) return [];
    
    return messages.filter((m) => {
      const mSender = m.sender_id ?? m.sender;
      const mReceiver = m.receiver_id ?? m.receiver;
      if (!mReceiver && mReceiver !== 0) return false;
      return (
        (mSender === peerId && mReceiver === currentUserId) ||
        (mSender === currentUserId && mReceiver === peerId)
      );
    });
  }, [messages, activeThread, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  // Send new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const payload = { text: newMessage };
      if (activeThread.type === "dm" && activeThread.userId) {
        payload.receiver = activeThread.userId;
      }
      const response = await axios.post(`${API_URL}/api/messages/`, payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setMessages([...messages, response.data]);
      setNewMessage("");
      setError("");
    } catch (err) {
      const details = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError(`Failed to send message: ${details}`);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axios.delete(`${API_URL}/api/messages/${messageId}/`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setMessages(messages.filter((m) => m.id !== messageId));
      setError("");
    } catch (err) {
      setError("Failed to delete message.");
    }
  };

  // Format date and time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      (u.username?.toLowerCase().includes(query)) ||
      (u.email?.toLowerCase().includes(query)) ||
      (u.first_name?.toLowerCase().includes(query)) ||
      (u.last_name?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  // Mark thread as viewed
  const handleThreadClick = (threadType, userId = null) => {
    setActiveThread({ type: threadType, userId });
    const threadKey = threadType === "global" ? "global" : `dm-${userId}`;
    setViewedThreads(prev => {
      const updated = new Set([...prev, threadKey]);
      localStorage.setItem('viewedThreads', JSON.stringify([...updated]));
      return updated;
    });
  };

  // Get unread message count
  const getMessageCount = (userId) => {
    if (!currentUserId) return 0;
    const threadKey = `dm-${userId}`;
    if (viewedThreads.has(threadKey)) return 0;
    
    const count = messages.filter((m) => {
      const mSender = m.sender_id ?? m.sender;
      const mReceiver = m.receiver_id ?? m.receiver;
      if (!mReceiver && mReceiver !== 0) return false;
      return (
        (mSender === userId && mReceiver === currentUserId) ||
        (mSender === currentUserId && mReceiver === userId)
      );
    }).length;
    
    if (activeThread.type === 'dm' && activeThread.userId === userId) {
      localStorage.setItem(`lastCount-${threadKey}`, count.toString());
    }
    
    return count;
  };

  // Get global chat message count
  const getGlobalMessageCount = () => {
    if (viewedThreads.has("global")) return 0;
    const count = messages.filter(m => !m.receiver && !m.receiver_id).length;
    
    if (activeThread.type === 'global') {
      localStorage.setItem('lastCount-global', count.toString());
    }
    
    return count;
  };

  return (
    <div className="team-messages-container">
      <div className="team-messages-wrap">
        {/* Sidebar */}
        <aside className="team-chat-sidebar">
          <div className="team-sidebar-header">
            {onBack && (
              <button onClick={onBack} className="team-back-btn">←</button>
            )}
            <span>Messages</span>
          </div>
          <button
            className={`team-thread-item ${activeThread.type === "global" ? "active" : ""}`}
            onClick={() => handleThreadClick("global")}
          >
            <span>🌍 Global Chat</span>
            {getGlobalMessageCount() > 0 && (
              <span className="team-msg-count">
                {getGlobalMessageCount()}
              </span>
            )}
          </button>
          <div className="team-sidebar-divider">Direct Messages</div>
          <div className="team-search-container">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="team-user-search"
            />
            {searchQuery && (
              <button
                className="team-clear-search"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="team-thread-list">
            {filteredUsers.length === 0 ? (
              <div className="team-no-users">No users found</div>
            ) : (
              filteredUsers.map((u) => {
                const msgCount = getMessageCount(u.id);
                return (
                  <button
                    key={u.id}
                    className={`team-thread-item ${
                      activeThread.type === "dm" && activeThread.userId === u.id ? "active" : ""
                    }`}
                    onClick={() => handleThreadClick("dm", u.id)}
                  >
                    <span className="team-avatar">👤</span>
                    <span className="team-name">
                      {u.username || u.email}
                      {verifiedUsers.has(u.username) && <span className="team-verified-badge">✓</span>}
                    </span>
                    {msgCount > 0 && <span className="team-msg-count">{msgCount}</span>}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="team-chat-panel">
          <header className="team-chat-header">
            {activeThread.type === "global" ? (
              <>
                <span className="team-room-title">🌍 Global Chat</span>
                <span className="team-room-sub">Everyone can see these messages</span>
              </>
            ) : (
              <>  
                <span className="team-room-title">Direct Message</span>
                <span className="team-room-sub">
                  Chat with {users.find((u) => u.id === activeThread.userId)?.username || "user"}
                </span>
              </>
            )}
          </header>

          {error && (
            <div className="team-error-banner">
              {error}
              <button onClick={() => setError("")} className="team-close-error">✕</button>
            </div>
          )}

          <div className="team-messages-list" ref={listRef}>
            {loading ? (
              <div className="team-empty">Loading messages...</div>
            ) : visibleMessages.length === 0 ? (
              <div className="team-empty">No messages yet. Say hello! 👋</div>
            ) : (
              visibleMessages.map((msg) => {
                const isSent = currentUsername && msg.sender_username === currentUsername;
                return (
                  <div
                    key={msg.id}
                    className={"team-message-item " + (isSent ? "sent" : "received")}
                  >
                    <div className="team-bubble">
                      {activeThread.type === "global" && (
                        <span className="team-sender">
                          {msg.sender_username}
                          {verifiedUsers.has(msg.sender_username) && <span className="team-verified-badge">✓</span>}
                        </span>
                      )}
                      <p>{msg.text}</p>
                      <div className="team-message-footer">
                        <span className="team-timestamp">{formatDateTime(msg.timestamp)}</span>
                        {isSent && (
                          <button
                            className="team-delete-btn"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="team-message-form">
            <input
              type="text"
              placeholder={
                activeThread.type === "global" ? "Message everyone" : "Message privately"
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="team-message-input"
              disabled={!userToken}
            />
            <button type="submit" className="team-send-button" disabled={!userToken || !newMessage.trim()}>
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default TeamMessages;
