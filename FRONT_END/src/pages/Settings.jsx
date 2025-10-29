import React, { useState } from "react";
import "../style/Settings.css";
import MenuBar from "./MenuBar";
import { useSettings } from "../context/SettingsContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Settings({ onLogout, onNav }) {
  // Get settings from context
  const {
    notificationSettings,
    setNotificationSettings,
    locationSettings,
    setLocationSettings,
    sosSettings,
    setSosSettings,
    theme,
    setTheme,
  } = useSettings();

  // Password Change State (kept local as it's not needed globally)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Toggle handlers
  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLocationToggle = (key) => {
    setLocationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSosToggle = (key) => {
    setSosSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLocationRetentionChange = (e) => {
    setLocationSettings((prev) => ({ ...prev, historyRetention: e.target.value }));
  };

  const handleSosTimerChange = (e) => {
    setSosSettings((prev) => ({ ...prev, countdownTimer: e.target.value }));
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  return (
    <>
      <MenuBar onLogout={onLogout} onNav={onNav} />
      <div className="settings-container">
        <div className="settings-header">
          <h1>⚙️ Settings</h1>
          <p>Customize your safety preferences</p>
        </div>

        {/* Notification Preferences */}
        <div className="settings-section">
          <h2>🔔 Notification Preferences</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">SOS Alert Notifications</span>
              <span className="setting-description">Receive alerts when contacts send SOS</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.sosAlerts}
                onChange={() => handleNotificationToggle("sosAlerts")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Message Notifications</span>
              <span className="setting-description">Get notified for new messages</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.messageAlerts}
                onChange={() => handleNotificationToggle("messageAlerts")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Sound</span>
              <span className="setting-description">Play sound for notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.soundEnabled}
                onChange={() => handleNotificationToggle("soundEnabled")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Vibration</span>
              <span className="setting-description">Vibrate on notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationSettings.vibrationEnabled}
                onChange={() => handleNotificationToggle("vibrationEnabled")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Location Sharing Settings */}
        <div className="settings-section">
          <h2>📍 Location Sharing</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Auto-share on SOS</span>
              <span className="setting-description">Automatically share location during emergency</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={locationSettings.autoShareOnSOS}
                onChange={() => handleLocationToggle("autoShareOnSOS")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Location History Retention</span>
              <span className="setting-description">How long to keep location history</span>
            </div>
            <select
              className="setting-select"
              value={locationSettings.historyRetention}
              onChange={handleLocationRetentionChange}
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Share with All Contacts</span>
              <span className="setting-description">Allow all contacts to see your location</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={locationSettings.shareWithAll}
                onChange={() => handleLocationToggle("shareWithAll")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* SOS Behavior Settings */}
        <div className="settings-section">
          <h2>🚨 SOS Behavior</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Auto-call Emergency Services</span>
              <span className="setting-description">Automatically call 911 when SOS is triggered</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={sosSettings.autoCallEmergency}
                onChange={() => handleSosToggle("autoCallEmergency")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">SOS Countdown Timer</span>
              <span className="setting-description">Delay before SOS activates</span>
            </div>
            <select
              className="setting-select"
              value={sosSettings.countdownTimer}
              onChange={handleSosTimerChange}
            >
              <option value="3">3 seconds</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Shake to Activate</span>
              <span className="setting-description">Shake phone to trigger SOS</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={sosSettings.shakeToActivate}
                onChange={() => handleSosToggle("shakeToActivate")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Volume Button SOS</span>
              <span className="setting-description">Press volume buttons 3 times to trigger SOS</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={sosSettings.volumeButtonSOS}
                onChange={() => handleSosToggle("volumeButtonSOS")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Silent Mode</span>
              <span className="setting-description">Send SOS without sound or notification</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={sosSettings.silentMode}
                onChange={() => handleSosToggle("silentMode")}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="settings-section">
          <h2>🎨 Appearance</h2>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Dark Mode</span>
              <span className="setting-description">Switch between light and dark theme</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={handleThemeToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Password Change */}
        <div className="settings-section">
          <h2>🔒 Security</h2>
          <form className="password-form" onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
              />
            </div>
            {passwordError && <div className="error-message">{passwordError}</div>}
            {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
            <button type="submit" className="change-password-btn">
              Change Password
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
