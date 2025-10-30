# 🎯 Team Creation & Management System

## Overview
Complete team management system where leaders can create teams and members can request to join.

---

## ✅ What's Being Added

### Backend Models:
1. **Team** - Teams that can be created by leaders
2. **TeamMembership** - Links members to teams
3. **TeamJoinRequest** - Join requests that need approval

### Features:
1. **Team Creation** (Leaders only)
2. **Browse Teams** (All team members)
3. **Request to Join** (Team members)
4. **Approve/Reject Requests** (Team leaders)
5. **View Team Members**
6. **Leave Team**

---

## 🔧 API Endpoints (To Be Added)

### Team Management:
```
GET    /api/teams/                    - List all active teams
POST   /api/teams/                    - Create new team (leaders only)
GET    /api/teams/{id}/               - Get team details
PUT    /api/teams/{id}/               - Update team (leader only)
DELETE /api/teams/{id}/               - Delete team (leader only)
GET    /api/teams/{id}/members/       - Get team members
```

### Join Requests:
```
GET    /api/team-join-requests/       - List my join requests
POST   /api/team-join-requests/       - Request to join a team
GET    /api/teams/{id}/requests/      - Get pending requests (leader only)
POST   /api/teams/{id}/requests/{req_id}/approve/  - Approve request
POST   /api/teams/{id}/requests/{req_id}/reject/   - Reject request
```

### Membership:
```
GET    /api/my-teams/                 - Get teams I'm in
DELETE /api/teams/{id}/leave/         - Leave a team
```

---

## 📊 Database Schema

### Team Model:
- `name` - Team name (unique)
- `description` - Team description
- `leader` - ForeignKey to TeamMember (leader)
- `department` - Department (fire, medical, police, etc.)
- `created_at` - When team was created
- `is_active` - Active status
- `max_members` - Maximum team size (default 50)

### TeamMembership Model:
- `team` - ForeignKey to Team
- `member` - ForeignKey to TeamMember
- `joined_at` - When joined
- `is_approved` - Approval status
- `role_in_team` - Role within the team

### TeamJoinRequest Model:
- `team` - ForeignKey to Team
- `member` - ForeignKey to TeamMember
- `requested_role` - Desired role
- `message` - Message to leader
- `status` - pending/approved/rejected
- `requested_at` - Request timestamp
- `reviewed_at` - Review timestamp
- `reviewed_by` - Who reviewed

---

## 🎨 Frontend Components (To Be Added)

### For Team Leaders:
1. **Create Team Modal**
   - Team name
   - Description
   - Department
   - Max members

2. **My Teams Dashboard**
   - Teams I lead
   - Pending join requests
   - Team members list
   - Approve/reject buttons

3. **Team Management**
   - Edit team details
   - Remove members
   - View team stats

### For Team Members:
1. **Browse Teams**
   - List all active teams
   - Filter by department
   - Search teams
   - View team details

2. **Join Team Modal**
   - Select desired role
   - Write message to leader
   - Submit request

3. **My Teams**
   - Teams I'm in
   - My role in each team
   - Leave team button

---

## 🔄 Workflow

### Team Creation (Leader):
```
1. Leader clicks "Create Team"
2. Fills form (name, description, department)
3. Submits → Team created
4. Leader is automatically added as member
```

### Joining Team (Member):
```
1. Member browses available teams
2. Clicks "Request to Join"
3. Selects desired role
4. Writes message (optional)
5. Submits request
6. Request goes to team leader
```

### Approval Process (Leader):
```
1. Leader sees pending requests
2. Views member profile
3. Clicks "Approve" or "Reject"
4. If approved → Member added to team
5. Member gets notification
```

---

## 🔐 Permissions

### Anyone Can:
- View list of teams
- View team details
- See team members

### Team Members Can:
- Request to join teams
- Leave teams they're in
- View their join requests

### Team Leaders Can:
- Create teams
- Edit their teams
- Approve/reject join requests
- Remove members
- Delete teams

---

## 📱 UI Features

### Team Card:
- Team name
- Department badge
- Leader name
- Member count / max members
- "Request to Join" button

### Join Request Card:
- Member name & role
- Requested role
- Message
- Request date
- Approve/Reject buttons

### Team Member Card:
- Member name
- Role in team
- Status (available/busy)
- Contact info
- Remove button (leader only)

---

## 🎯 Next Steps

1. ✅ Create models (DONE)
2. ✅ Create migrations (DONE)
3. ✅ Add to admin (DONE)
4. ✅ Create serializers (DONE)
5. ⏳ Create API views
6. ⏳ Add URL routes
7. ⏳ Create frontend components
8. ⏳ Add to team dashboard
9. ⏳ Test complete workflow

---

## 🚀 Benefits

- **Better Organization**: Teams organized by department/specialty
- **Controlled Access**: Leaders approve who joins
- **Clear Structure**: Know who's on which team
- **Easy Coordination**: Assign tasks to specific teams
- **Scalability**: Support multiple teams per department

---

This system will make team management professional and organized! 🎉
