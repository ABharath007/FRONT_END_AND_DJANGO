import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "../style/Messages.css";
import MenuBar from "./MenuBar";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const Messages = ({ userToken, onLogout, onNav, currentUsername }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [viewedThreads, setViewedThreads] = useState(() => {
    // Load viewed threads from localStorage
    const saved = localStorage.getItem('viewedThreads');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // thread state: global or dm:<userId>
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
          if (err?.response?.status === 401) {
            setError("Session expired. Please login again.");
            setTimeout(() => {
              onLogout();
            }, 2000);
          } else {
            setError("Failed to fetch messages.");
          }
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
        if (err?.response?.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => {
            onLogout();
          }, 2000);
        } else {
          console.error("Failed to fetch current user:", err);
        }
      }
    };
    fetchCurrentUser();
  }, [userToken]);

  // Fetch all users for DM list / selection
  useEffect(() => {
    if (!userToken) {
      return;
    }
    const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/users/`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    // Make sure we get an array
    if (Array.isArray(response.data)) {
      setUsers(response.data);
    } else if (Array.isArray(response.data?.users)) {
      setUsers(response.data.users);
    } else {
      setUsers([]); // fallback
    }
  } catch (err) {
    console.error("Failed to fetch users:", err);
    setUsers([]); // fallback on error
  }
};
    fetchUsers();
  }, [userToken]);

  // Determine visible messages based on thread
  const visibleMessages = useMemo(() => {
    if (!messages?.length) return [];
    if (activeThread.type === "global") {
      // global messages: receiver is null/undefined
      return messages.filter((m) => !m.receiver && !m.receiver_id);
    }
    // DM messages: between current user and selected peer
    const peerId = activeThread.userId;
    if (!currentUserId) return [];
    
    return messages.filter((m) => {
      const mSender = m.sender_id ?? m.sender;
      const mReceiver = m.receiver_id ?? m.receiver;
      
      // Message must have a receiver (not global)
      if (!mReceiver && mReceiver !== 0) return false;
      
      // Either: I sent to peer OR peer sent to me
      return (
        (mSender === peerId && mReceiver === currentUserId) || // peer sent to me
        (mSender === currentUserId && mReceiver === peerId)    // I sent to peer
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
      // Build payload: only text and receiver (sender is auto-assigned by backend from token)
      const payload = { text: newMessage };
      if (activeThread.type === "dm" && activeThread.userId) {
        payload.receiver = activeThread.userId;
      }
      // Debug: log payload once in dev console
      // eslint-disable-next-line no-console
      console.debug("POST /api/messages payload:", payload);
      const response = await axios.post(`${API_URL}/api/messages/`, payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setMessages([...messages, response.data]);
      setNewMessage("");
      setError("");
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          onLogout();
        }, 2000);
      } else {
        // Surface backend validation details if available
        const details = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
        setError(`Failed to send message: ${details}`);
      }
      // eslint-disable-next-line no-console
      console.error("Send message error:", err?.response?.status, err?.response?.data || err);
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
      console.error("Delete message error:", err);
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

  // Mark thread as viewed when user opens it
  const handleThreadClick = (threadType, userId = null) => {
    setActiveThread({ type: threadType, userId });
    const threadKey = threadType === "global" ? "global" : `dm-${userId}`;
    setViewedThreads(prev => {
      const updated = new Set([...prev, threadKey]);
      // Save to localStorage
      localStorage.setItem('viewedThreads', JSON.stringify([...updated]));
      return updated;
    });
  };

  // Get unread message count for a specific user
  const getMessageCount = (userId) => {
    if (!currentUserId) return 0;
    const threadKey = `dm-${userId}`;
    if (viewedThreads.has(threadKey)) return 0; // Hide badge if viewed
    
    const count = messages.filter((m) => {
      const mSender = m.sender_id ?? m.sender;
      const mReceiver = m.receiver_id ?? m.receiver;
      
      // Only count DM messages (must have receiver)
      if (!mReceiver && mReceiver !== 0) return false;
      
      return (
        (mSender === userId && mReceiver === currentUserId) || // they sent to me
        (mSender === currentUserId && mReceiver === userId)    // I sent to them
      );
    }).length;
    
    // If there are new messages, remove from viewed threads
    if (count > 0 && viewedThreads.has(threadKey)) {
      const lastViewedCount = parseInt(localStorage.getItem(`lastCount-${threadKey}`) || '0');
      if (count > lastViewedCount) {
        setViewedThreads(prev => {
          const updated = new Set([...prev]);
          updated.delete(threadKey);
          localStorage.setItem('viewedThreads', JSON.stringify([...updated]));
          return updated;
        });
        return count;
      }
    }
    
    // Store current count when viewing
    if (activeThread.type === 'dm' && activeThread.userId === userId) {
      localStorage.setItem(`lastCount-${threadKey}`, count.toString());
    }
    
    return count;
  };

  // Get global chat message count
  const getGlobalMessageCount = () => {
    if (viewedThreads.has("global")) return 0; // Hide badge if viewed
    const count = messages.filter(m => !m.receiver && !m.receiver_id).length;
    
    // If there are new messages, remove from viewed threads
    if (count > 0 && viewedThreads.has("global")) {
      const lastViewedCount = parseInt(localStorage.getItem('lastCount-global') || '0');
      if (count > lastViewedCount) {
        setViewedThreads(prev => {
          const updated = new Set([...prev]);
          updated.delete("global");
          localStorage.setItem('viewedThreads', JSON.stringify([...updated]));
          return updated;
        });
        return count;
      }
    }
    
    // Store current count when viewing
    if (activeThread.type === 'global') {
      localStorage.setItem('lastCount-global', count.toString());
    }
    
    return count;
  };

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />
      <div className="messages-wrap">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">Messages</div>
          <button
            className={`thread-item ${activeThread.type === "global" ? "active" : ""}`}
            onClick={() => handleThreadClick("global")}
          >
            <span>🌍 Global Chat</span>
            {getGlobalMessageCount() > 0 && (
              <span className="msg-count">
                {getGlobalMessageCount()}
              </span>
            )}
          </button>
          <div className="sidebar-divider">Direct Messages</div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="user-search"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="thread-list">
            {filteredUsers.length === 0 ? (
              <div className="no-users">No users found</div>
            ) : (
              filteredUsers.map((u) => {
                const msgCount = getMessageCount(u.id);
                return (
                  <button
                    key={u.id}
                    className={`thread-item ${
                      activeThread.type === "dm" && activeThread.userId === u.id ? "active" : ""
                    }`}
                    onClick={() => handleThreadClick("dm", u.id)}
                  >
                    <span className="avatar" aria-hidden>👤</span>
                    <span className="name">{u.username || u.email}</span>
                    {msgCount > 0 && <span className="msg-count">{msgCount}</span>}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="chat-panel">
          <header className="chat-header">
            {activeThread.type === "global" ? (
              <>
                <span className="room-title">🌍 Global Chat</span>
                <span className="room-sub">Everyone can see these messages</span>
              </>
            ) : (
              <>  
                <span className="room-title">Direct Message</span>
                <span className="room-sub">
                  Chat with {users.find((u) => u.id === activeThread.userId)?.username || "user"}
                </span>
              </>
            )}
          </header>

          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError("")} className="close-error">✕</button>
            </div>
          )}

          <div className="messages-list" ref={listRef}>
            {loading ? (
              <div className="empty">Loading messages...</div>
            ) : visibleMessages.length === 0 ? (
              <div className="empty">No messages yet. Say hello! 👋</div>
            ) : (
              visibleMessages.map((msg) => {
                const isSent = currentUsername && msg.sender_username === currentUsername;
                return (
                  <div
                    key={msg.id}
                    className={"message-item " + (isSent ? "sent" : "received")}
                  >
                    <div className="bubble">
                      {activeThread.type === "global" && (
                        <span className="sender">{msg.sender_username}</span>
                      )}
                      <p>{msg.text}</p>
                      <div className="message-footer">
                        <span className="timestamp">{formatDateTime(msg.timestamp)}</span>
                        {isSent && (
                          <button
                            className="delete-btn"
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

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              placeholder={
                activeThread.type === "global" ? "Message everyone" : "Message privately"
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="message-input"
              disabled={!userToken}
            />
            <button type="submit" className="send-button" disabled={!userToken || !newMessage.trim()}>
              Send
            </button>
          </form>
        </section>
      </div>
    </>
  );
};

export default Messages;
