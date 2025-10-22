import React, { useState, useEffect } from "react";
import MenuBar from "./MenuBar";
import "../style/Contacts.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Function to refresh access token
const getFreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/api/token/refresh/`, {
      refresh: refreshToken,
    });
    const { access } = response.data;
    localStorage.setItem("accessToken", access);
    return access;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
};

export default function Contacts({ onLogout, onNav }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", phone_number: "", email: "" });
  const [adding, setAdding] = useState(false);

  // Helper: make API request with token, auto-refresh if expired
  const apiRequest = async (method, url, data = null) => {
    let token = localStorage.getItem("accessToken");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      return await axios({ method, url, data, headers });
    } catch (err) {
      // Check if token expired
      if (err.response?.status === 401) {
        const newToken = await getFreshAccessToken();
        if (!newToken) throw err; // cannot refresh

        // Retry the request with new token
        return await axios({ method, url, data, headers: { Authorization: `Bearer ${newToken}` } });
      } else {
        throw err;
      }
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("get", `${API_URL}/api/contacts/`);
      setContacts(response.data);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      alert("❌ Could not load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await apiRequest("post", `${API_URL}/api/contacts/`, formData);
      alert("✅ Contact added successfully!");
      setFormData({ name: "", phone_number: "", email: "" });
      fetchContacts();
    } catch (err) {
      console.error("Failed to add contact:", err);
      alert("❌ Failed to add contact.");
    } finally {
      setAdding(false);
    }
  };

  // Delete contact
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await apiRequest("delete", `${API_URL}/api/contacts/${id}/`);
      alert("✅ Contact deleted successfully!");
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete contact:", err);
      alert("❌ Failed to delete contact.");
    }
  };

  if (loading) return <div>Loading contacts...</div>;

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />

      <div className="contacts-container">
        <h2>My Contacts</h2>

        {/* Add Contact Form */}
        <form className="add-contact-form" onSubmit={handleAddContact}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email (optional)"
            value={formData.email}
            onChange={handleChange}
          />
          <button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Contact"}
          </button>
        </form>

        {/* Contacts Table */}
        {contacts.length === 0 ? (
          <div className="contacts-empty">No contacts found.</div>
        ) : (
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone_number}</td>
                  <td>{c.email || "-"}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
