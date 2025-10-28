import React from "react";
import "../style/Settings.css";
import MenuBar from "./MenuBar";

export default function Settings({ onLogout, onNav }) {
  return (
    <div className="page-container">
      <MenuBar onLogout={onLogout} onNav={onNav} />
      <h1>⚙️ Settings Page</h1>
      <p>Adjust settings here.</p>
    </div>
  );
}
