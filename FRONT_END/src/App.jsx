import React, { useState, useEffect } from "react";
import LandingPageScroll from "./pages/LandingPageScroll";
import LoginRegister from "./pages/LoginRegister";
import Home from "./pages/Home";
import Sos from "./pages/Sos";
import Heatmap from "./pages/Heatmap";
import Messages from "./pages/Messages";
import Contacts from "./pages/Contacts"; 
import Account from "./pages/Account";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import TeamRegister from "./pages/TeamRegister";
import TeamDashboard from "./pages/TeamDashboard";
import { SettingsProvider } from "./context/SettingsContext";
// Phase 2 components are imported within TeamDashboard

export default function App() {
  // Initialize from localStorage
  const savedToken = localStorage.getItem("accessToken");
  const savedUsername = localStorage.getItem("username");
  const savedIsTeamMember = localStorage.getItem("isTeamMember") === "true";
  
  const [user, setUser] = useState(savedUsername || null);
  const [page, setPage] = useState(savedToken && savedUsername ? (savedIsTeamMember ? "team-dashboard" : "home") : "landing");
  const [authMode, setAuthMode] = useState("login");
  const [userToken, setUserToken] = useState(savedToken || "");
  const [username, setUsername] = useState(savedUsername || "");
  const [isTeamMember, setIsTeamMember] = useState(savedIsTeamMember);

  // Registration callback
  const handleRegister = (username) => {
    alert("Registration successful! Please login.");
    setPage("auth");
    setAuthMode("login");
    return true;
  };

  // Login callback
  const handleLogin = (username, token, isTeamMember = false) => {
    setUser(username);
    setUsername(username);
    setUserToken(token);
    setIsTeamMember(isTeamMember);
    
    // Save to localStorage
    localStorage.setItem("username", username);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("isTeamMember", isTeamMember.toString());
    
    // Route to appropriate dashboard
    if (isTeamMember) {
      setPage("team-dashboard");
    } else {
      setPage("home");
    }
    return true;
  };

  // Logout callback
  const handleLogout = () => {
    setUser(null);
    setUserToken("");
    setUsername("");
    setIsTeamMember(false);
    setPage("landing");
    
    // Clear localStorage
    localStorage.removeItem("username");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isTeamMember");
  };

  // Open login/register page
  const openAuth = (mode) => {
    setAuthMode(mode);
    setPage("auth");
  };

  // Go back to landing
  const handleBack = () => {
    if (user) {
      // If logged in, go to appropriate dashboard
      setPage(isTeamMember ? "team-dashboard" : "home");
    } else {
      // If not logged in, go to landing page
      setPage("landing");
    }
  };

  return (
    <SettingsProvider>
      <div>
        {user ? (
          <>
            {page === "home" && (
              <Home username={username} onLogout={handleLogout} onNav={setPage} />
            )}
            {page === "sos" && (
              <Sos
                onLogout={handleLogout}
                onNav={setPage}
              />
            )}
            {page === "contacts" && (
              <Contacts
                onBack={handleBack}
                onLogout={handleLogout}
                onNav={setPage}
              />
            )}
            {page === "account" && (
              <Account
                onBack={handleBack}
                onLogout={handleLogout}
                onNav={setPage}
              />
            )}
            {page === "heatmap" && (
              <Heatmap onLogout={handleLogout} onNav={setPage} />
            )}
            {page === "messages" && (
              <Messages
                userToken={userToken}
                onLogout={handleLogout}
                onNav={setPage}
                currentUsername={username}
              />
            )}
            {page === "alerts" && (
              <Alerts
                onLogout={handleLogout}
                onNav={setPage}
              />
            )}
            {page === "settings" && (
              <Settings
                onLogout={handleLogout}
                onNav={setPage}
              />
            )}
            {page === "team-dashboard" && (
              <TeamDashboard
                onLogout={handleLogout}
              />
            )}
          </>
        ) : (
          <>
            {page === "landing" && (
              <LandingPageScroll
                onLoginClick={() => openAuth("login")}
                onRegisterClick={() => openAuth("register")}
                onTeamRegisterClick={() => setPage("team-register")}
              />
            )}
            {page === "auth" && (
              <LoginRegister
                initialMode={authMode}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onBack={handleBack}
              />
            )}
            {page === "team-register" && (
              <TeamRegister
                onBack={handleBack}
                onSuccess={() => {
                  alert("Registration successful! Please login with your credentials.");
                  setPage("auth");
                  setAuthMode("login");
                }}
              />
            )}
          </>
        )}
      </div>
    </SettingsProvider>
  );
}
