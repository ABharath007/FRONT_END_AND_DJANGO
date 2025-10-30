from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class SOSReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=100)  # e.g., "Fire Alert", "Medical Emergency"
    status = models.CharField(max_length=20, default='Pending')  # e.g., "Pending", "Resolved"
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.type} on {self.date.strftime('%Y-%m-%d %H:%M')} by {self.user.username}"


class LocationShare(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    latitude = models.FloatField()
    longitude = models.FloatField()
    shared_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Location by {self.user.username} at {self.shared_at}"


class Alert(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert for {self.user.username} at {self.created_at}"


class Contact(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_contacts')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.phone_number})"
class HeatmapPoint(models.Model):
    INCIDENT_TYPES = [
        ('flood', 'Flood'),
        ('earthquake', 'Earthquake'),
        ('fire', 'Fire'),
        ('roadblock', 'Roadblock'),
        ('other', 'Other'),
    ]

    # MODIFIED: Link to the user who created the incident
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    lat = models.FloatField()
    lng = models.FloatField()
    # intensity field is no longer needed as it's handled on the frontend
    incident_type = models.CharField(max_length=20, choices=INCIDENT_TYPES, default='other')
    description = models.TextField(blank=True)

    # NEW: Timestamps for creation and expiration
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=60)

    def __str__(self):
        return f"{self.get_incident_type_display()} by {self.user.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class UserContact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_contacts")
    contact = models.ForeignKey(User, on_delete=models.CASCADE, related_name="contacted_by")

    def __str__(self):
        return f"{self.user.username} -> {self.contact.username}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages", null=True, blank=True)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.receiver:
            return f"From {self.sender.username} to {self.receiver.username}: {self.text[:30]}"
        return f"From {self.sender.username} (Global): {self.text[:30]}"
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True)
    alt_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

class SOSAlert(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_sos_alerts')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_sos_alerts')
    message = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    sos_type = models.CharField(max_length=100, default='General Emergency')

    def __str__(self):
        return f"SOS from {self.sender.username} to {self.receiver.username} at {self.created_at}"

class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('team_leader', 'Team Leader'),
        ('coordinator', 'Coordinator'),
        ('field_responder', 'Field Responder'),
        ('medical_staff', 'Medical Staff'),
        ('logistics', 'Logistics'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('fire', 'Fire Department'),
        ('medical', 'Medical Emergency'),
        ('police', 'Police'),
        ('rescue', 'Rescue Team'),
        ('relief', 'Relief Distribution'),
    ]
    
    STATUS_CHOICES = [
        ('on_duty', 'On Duty'),
        ('off_duty', 'Off Duty'),
        ('busy', 'Busy'),
        ('available', 'Available'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='team_profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES)
    badge_number = models.CharField(max_length=50, unique=True)
    certification = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='off_duty')
    is_verified = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} ({self.get_department_display()})"

class IncidentAssignment(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('dispatched', 'Dispatched'),
        ('en_route', 'En Route'),
        ('on_scene', 'On Scene'),
        ('resolved', 'Resolved'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    sos_report = models.ForeignKey(SOSReport, on_delete=models.CASCADE, related_name='assignments')
    assigned_to = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='assigned_incidents')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    notes = models.TextField(blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Incident #{self.sos_report.id} assigned to {self.assigned_to.user.username}"
    
    @property
    def response_time(self):
        if self.arrived_at and self.assigned_at:
            return (self.arrived_at - self.assigned_at).total_seconds() / 60  # in minutes
        return None

class IncidentLog(models.Model):
    assignment = models.ForeignKey(IncidentAssignment, on_delete=models.CASCADE, related_name='logs')
    logged_by = models.ForeignKey(TeamMember, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Log for Incident #{self.assignment.sos_report.id} at {self.timestamp}"

# ========== PHASE 2: RESOURCE MANAGEMENT ==========
class ResourceType(models.Model):
    CATEGORY_CHOICES = [
        ('vehicle', 'Vehicle'),
        ('equipment', 'Equipment'),
        ('medical', 'Medical Supplies'),
        ('communication', 'Communication Device'),
    ]
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

class Resource(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in_use', 'In Use'),
        ('maintenance', 'Under Maintenance'),
        ('unavailable', 'Unavailable'),
    ]
    
    resource_type = models.ForeignKey(ResourceType, on_delete=models.CASCADE, related_name='resources')
    identifier = models.CharField(max_length=100, unique=True)  # e.g., Vehicle plate number, Equipment ID
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    assigned_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_resources')
    location = models.CharField(max_length=200, blank=True)
    last_maintenance = models.DateField(null=True, blank=True)
    next_maintenance = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.resource_type.name} - {self.identifier}"

class ResourceAssignment(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='assignments')
    team_member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='resource_assignments')
    incident = models.ForeignKey(IncidentAssignment, on_delete=models.SET_NULL, null=True, blank=True, related_name='resource_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.resource.identifier} assigned to {self.team_member.user.username}"

# ========== PHASE 2: TEAM COMMUNICATION ==========
class TeamMessage(models.Model):
    sender = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='sent_team_messages')
    department = models.CharField(max_length=20, choices=TeamMember.DEPARTMENT_CHOICES, null=True, blank=True)  # null = broadcast to all
    message = models.TextField()
    is_broadcast = models.BooleanField(default=False)  # True for emergency broadcasts
    priority = models.CharField(max_length=20, choices=[('normal', 'Normal'), ('urgent', 'Urgent'), ('emergency', 'Emergency')], default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.sender.user.username} at {self.created_at}"

class TeamMessageRead(models.Model):
    message = models.ForeignKey(TeamMessage, on_delete=models.CASCADE, related_name='read_by')
    team_member = models.ForeignKey(TeamMember, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'team_member']
    
    def __str__(self):
        return f"{self.team_member.user.username} read message #{self.message.id}"

# ========== PHASE 2: ANALYTICS ==========
class IncidentStatistics(models.Model):
    date = models.DateField(unique=True)
    total_incidents = models.IntegerField(default=0)
    resolved_incidents = models.IntegerField(default=0)
    average_response_time = models.FloatField(default=0.0)  # in minutes
    critical_incidents = models.IntegerField(default=0)
    high_priority_incidents = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Statistics for {self.date}"
    
    class Meta:
        ordering = ['-date']

# ========== TEAM MANAGEMENT ==========
class Team(models.Model):
    """Teams that members can join"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    leader = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='led_teams')
    department = models.CharField(max_length=20, choices=TeamMember.DEPARTMENT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    max_members = models.IntegerField(default=50)
    
    def __str__(self):
        return f"{self.name} - {self.get_department_display()}"

class TeamMembership(models.Model):
    """Links team members to teams"""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='team_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    role_in_team = models.CharField(max_length=20, choices=TeamMember.ROLE_CHOICES, default='field_responder')
    
    class Meta:
        unique_together = ['team', 'member']
    
    def __str__(self):
        return f"{self.member.user.username} in {self.team.name}"

class TeamJoinRequest(models.Model):
    """Requests to join a team"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='join_requests')
    member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='join_requests')
    requested_role = models.CharField(max_length=20, choices=TeamMember.ROLE_CHOICES, default='field_responder')
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests')
    
    class Meta:
        unique_together = ['team', 'member']
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"{self.member.user.username} -> {self.team.name} ({self.status})"
