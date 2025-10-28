import React, { useState } from "react";
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

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [userToken, setUserToken] = useState(""); // JWT token after login
  const [username, setUsername] = useState("");   // Logged-in username

  // Registration callback
  const handleRegister = (username) => {
    alert("Registration successful! Please login.");
    setPage("auth");
    setAuthMode("login");
    return true;
  };

  // Login callback
  const handleLogin = (username, token) => {
    setUser(username);
    setUsername(username);
    setUserToken(token);
    setPage("home");
    return true;
  };

  // Logout callback
  const handleLogout = () => {
    setUser(null);
    setUserToken("");
    setUsername("");
    setPage("home");
  };

  // Open login/register page
  const openAuth = (mode) => {
    setAuthMode(mode);
    setPage("auth");
  };

  // Go back to Home
  const handleBack = () => {
    setPage("home");
  };

  return (
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
        </>
      ) : (
        <>
          {page === "home" && (
            <LandingPageScroll
              onLoginClick={() => openAuth("login")}
              onRegisterClick={() => openAuth("register")}
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
        </>
      )}
    </div>
  );
}
