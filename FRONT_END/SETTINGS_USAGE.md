# Settings System - Usage Guide

## What Was Fixed

### Problem
- Settings were resetting when changing pages
- Settings were stored locally in Settings.jsx only
- No way for other pages to access the settings

### Solution
Created a **Global Settings Context** that:
1. Stores all settings in one place
2. Persists settings to localStorage automatically
3. Makes settings available to ALL pages
4. Prevents settings from resetting when navigating

---

## How It Works

### 1. SettingsContext (`src/context/SettingsContext.jsx`)
- Central store for all app settings
- Automatically saves to localStorage
- Automatically loads from localStorage on app start
- Provides settings to any component that needs them

### 2. Settings Available Globally

#### Notification Settings
```javascript
{
  sosAlerts: true/false,
  messageAlerts: true/false,
  soundEnabled: true/false,
  vibrationEnabled: true/false
}
```

#### Location Settings
```javascript
{
  autoShareOnSOS: true/false,
  historyRetention: "7" | "30" | "90",
  shareWithAll: true/false
}
```

#### SOS Behavior Settings
```javascript
{
  autoCallEmergency: true/false,
  countdownTimer: "3" | "5" | "10",
  shakeToActivate: true/false,
  volumeButtonSOS: true/false,
  silentMode: true/false
}
```

#### Theme
```javascript
theme: "light" | "dark"
```

---

## How to Use Settings in Any Page

### Step 1: Import the hook
```javascript
import { useSettings } from "../context/SettingsContext";
```

### Step 2: Get the settings you need
```javascript
function MyComponent() {
  const { sosSettings, notificationSettings, theme } = useSettings();
  
  // Now you can use them!
  if (sosSettings.autoCallEmergency) {
    // Call emergency services
  }
  
  if (notificationSettings.soundEnabled) {
    // Play sound
  }
}
```

### Step 3: Update settings (if needed)
```javascript
function MyComponent() {
  const { sosSettings, setSosSettings } = useSettings();
  
  // Update a setting
  const toggleAutoCall = () => {
    setSosSettings(prev => ({
      ...prev,
      autoCallEmergency: !prev.autoCallEmergency
    }));
  };
}
```

---

## Example: Using Settings in SOS Page

The SOS page now has access to:
- `sosSettings.countdownTimer` - How long to wait before triggering SOS
- `sosSettings.autoCallEmergency` - Whether to auto-call 911
- `sosSettings.silentMode` - Whether to send SOS silently
- `notificationSettings.soundEnabled` - Whether to play sounds

You can use these to customize the SOS behavior based on user preferences!

---

## Testing

1. Go to Settings page
2. Change any setting (toggle switches, dropdowns)
3. Navigate to another page (Home, SOS, etc.)
4. Come back to Settings
5. **Your settings should still be there!**

The settings are also saved in your browser's localStorage, so they persist even after closing the browser.

---

## Dark Mode

The dark mode toggle in Settings automatically applies the theme to the entire app by setting:
```javascript
document.body.setAttribute("data-theme", "dark");
```

Any CSS file can use dark mode styles:
```css
[data-theme="dark"] .my-element {
  background: #2a2a2a;
  color: #e0e0e0;
}
```
