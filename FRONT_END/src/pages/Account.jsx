import React, { useState, useEffect } from "react";
import "../style/Account.css";
import MenuBar from "./MenuBar";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Account = ({ onLogout, onNav }) => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    profile: {
      phone: "",
      alt_phone: "",
      address: "",
    },
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data when page loads
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    fetch(`${API_URL}/api/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load account data");
        return res.json();
      })
      .then((data) => {
        setUser({
          ...data,
          profile: data.profile || {
            phone: "",
            alt_phone: "",
            address: "",
          },
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle input change for profile fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value,
      },
    }));
  };

  // Submit updated profile info
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("accessToken");
    fetch(`${API_URL}/api/me/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        profile: user.profile,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update account");
        return res.json();
      })
      .then((data) => {
        setUser({
          ...data,
          profile: data.profile || {
            phone: "",
            alt_phone: "",
            address: "",
          },
        });
        setEditMode(false);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />
      <div className="account-container">
        <h2>Account Details</h2>
        {loading ? (
          <p className="account-message">Loading...</p>
        ) : error ? (
          <p className="account-message error">{error}</p>
        ) : (
          <>
            <div className="account-details">
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {user.profile?.phone ? user.profile.phone : "Not Set"}
              </p>
              <p>
                <strong>Alternate Phone:</strong>{" "}
                {user.profile?.alt_phone ? user.profile.alt_phone : "Not Set"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {user.profile?.address ? user.profile.address : "Not Set"}
              </p>
            </div>
            <button
              className="edit-btn"
              onClick={() => setEditMode((prev) => !prev)}
            >
              {editMode ? "Cancel" : "Update Details"}
            </button>
            {editMode && (
              <form className="account-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={user.profile.phone}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="alt_phone"
                  placeholder="Alternate Phone Number"
                  value={user.profile.alt_phone}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={user.profile.address}
                  onChange={handleChange}
                />
                <button type="submit" className="save-btn">
                  Save
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Account;
