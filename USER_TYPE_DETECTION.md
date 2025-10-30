# 🎯 User Type Detection System

## Overview
The app now automatically detects whether a logged-in user is a **Team Member** or **Regular User** and routes them to the appropriate dashboard.

---

## ✅ How It Works

### 1. **Login Process**
When a user logs in, the system:
1. Authenticates with username/password
2. Gets JWT token
3. **Automatically checks** if user has a team member profile
4. Routes to appropriate dashboard

### 2. **Detection Logic**
```javascript
// In LoginRegister.jsx
try {
  // Try to access team dashboard endpoint
  const teamCheckResponse = await axios.get(`${API_URL}/api/team/dashboard/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // ✅ Success = User is a verified team member
  onLogin(username, token, true);
} catch (teamErr) {
  // ❌ Failed = Regular user (or unverified team member)
  onLogin(username, token, false);
}
```

### 3. **Automatic Routing**
```javascript
// In App.jsx
if (isTeamMember) {
  setPage("team-dashboard");  // → Team Dashboard
} else {
  setPage("home");            // → Regular User Dashboard
}
```

---

## 🎨 Visual Differentiation

### Team Member Dashboard
- **Badge**: "🚨 TEAM MEMBER DASHBOARD" (animated pulse)
- **Background**: Purple gradient
- **Quick Access**: 3 Phase 2 feature buttons
- **Color Theme**: Purple (#667eea → #764ba2)

### Regular User Dashboard
- **Badge**: "👤 REGULAR USER"
- **Background**: Cream (#FFF5EE)
- **Features**: Personal SOS, contacts, messages
- **Color Theme**: Teal (#326273 → #5f939a)

---

## 💾 Persistence

User type is saved to localStorage:
```javascript
localStorage.setItem("isTeamMember", "true" or "false");
```

This means:
- ✅ User type persists across page refreshes
- ✅ No need to re-check on every page load
- ✅ Cleared on logout

---

## 🔄 Complete Flow

### Team Member Registration & Login
```
1. Click "Team Join" on landing page
2. Fill team registration form
3. Submit → Wait for admin verification
4. Admin verifies in Django admin
5. Login with credentials
6. System detects team member → Routes to Team Dashboard
7. See "🚨 TEAM MEMBER DASHBOARD" badge
```

### Regular User Registration & Login
```
1. Click "Register" on landing page
2. Fill regular registration form
3. Submit → Account created
4. Login with credentials
5. System detects regular user → Routes to Home Dashboard
6. See "👤 REGULAR USER" badge
```

---

## 🔐 Security

### Team Member Requirements
- Must have `TeamMember` profile in database
- Must be verified (`is_verified = True`)
- Team dashboard endpoint returns 404 if not verified

### Regular User
- Only needs `User` account
- No team member profile required
- Cannot access team features

---

## 📊 Comparison Table

| Feature | Team Member | Regular User |
|---------|------------|--------------|
| **Badge** | 🚨 TEAM MEMBER DASHBOARD | 👤 REGULAR USER |
| **Background** | Purple gradient | Cream |
| **Dashboard** | Team Dashboard | Home Dashboard |
| **Resources** | ✅ Yes | ❌ No |
| **Team Chat** | ✅ Yes | ❌ No |
| **Analytics** | ✅ Yes | ❌ No |
| **Assign Incidents** | ✅ Yes (Leaders) | ❌ No |
| **SOS Reports** | ✅ View all | ✅ Personal only |
| **Status Management** | ✅ Yes | ❌ No |

---

## 🧪 Testing

### Test as Regular User
1. Register normally (not team join)
2. Login
3. Should see "👤 REGULAR USER" badge
4. Should be on Home dashboard
5. Should NOT see team features

### Test as Team Member
1. Click "Team Join"
2. Register with role/department/badge
3. Admin verifies in Django admin
4. Login
5. Should see "🚨 TEAM MEMBER DASHBOARD" badge
6. Should be on Team Dashboard
7. Should see Quick Access buttons

### Test Persistence
1. Login as team member
2. Refresh page
3. Should still be on team dashboard
4. Badge should still show

---

## 🔧 Technical Details

### Files Modified
```
✅ LoginRegister.jsx - Added team check on login
✅ App.jsx - Updated handleLogin with isTeamMember parameter
✅ App.jsx - Added localStorage persistence
✅ Home.jsx - Added regular user badge
✅ Home.css - Added badge styling
```

### localStorage Keys
```javascript
"username"       // User's username
"accessToken"    // JWT token
"isTeamMember"   // "true" or "false"
```

### API Endpoint Used
```
GET /api/team/dashboard/
- Returns 200 + data if user is verified team member
- Returns 404 if user is not team member or not verified
```

---

## 🎯 Benefits

1. **Automatic Detection**: No manual selection needed
2. **Secure**: Based on backend verification
3. **Persistent**: Survives page refresh
4. **Clear Visual**: Users know their account type
5. **Proper Routing**: Each user type gets appropriate dashboard

---

## 🚀 Summary

The system now **automatically knows** if you're a team member or regular user:

- **Team Members** → Purple dashboard with team features
- **Regular Users** → Cream dashboard with personal features

No confusion, no manual selection, just seamless routing! 🎉
