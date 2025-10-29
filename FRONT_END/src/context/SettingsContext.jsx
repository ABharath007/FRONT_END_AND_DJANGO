import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Notification Preferences State
  const [notificationSettings, setNotificationSettings] = useState({
    sosAlerts: true,
    messageAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Location Sharing State
  const [locationSettings, setLocationSettings] = useState({
    autoShareOnSOS: true,
    historyRetention: "30",
    shareWithAll: true,
  });

  // SOS Behavior State
  const [sosSettings, setSosSettings] = useState({
    autoCallEmergency: false,
    countdownTimer: "5",
    shakeToActivate: false,
    volumeButtonSOS: false,
    silentMode: false,
  });

  // Theme State
  const [theme, setTheme] = useState("light");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notificationSettings");
    const savedLocation = localStorage.getItem("locationSettings");
    const savedSOS = localStorage.getItem("sosSettings");
    const savedTheme = localStorage.getItem("theme");

    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch (e) {
        console.error("Failed to parse notification settings", e);
      }
    }
    if (savedLocation) {
      try {
        setLocationSettings(JSON.parse(savedLocation));
      } catch (e) {
        console.error("Failed to parse location settings", e);
      }
    }
    if (savedSOS) {
      try {
        setSosSettings(JSON.parse(savedSOS));
      } catch (e) {
        console.error("Failed to parse SOS settings", e);
      }
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem("locationSettings", JSON.stringify(locationSettings));
  }, [locationSettings]);

  useEffect(() => {
    localStorage.setItem("sosSettings", JSON.stringify(sosSettings));
  }, [sosSettings]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const value = {
    notificationSettings,
    setNotificationSettings,
    locationSettings,
    setLocationSettings,
    sosSettings,
    setSosSettings,
    theme,
    setTheme,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
