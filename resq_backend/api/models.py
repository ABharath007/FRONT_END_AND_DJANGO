from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class SOSReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=100)  # e.g., "Fire Alert", "Medical Emergency"
    status = models.CharField(max_length=20, default='Pending')  # e.g., "Pending", "Resolved"

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
    expires_at = models.DateTimeField() # This will be set in the view

    def __str__(self):
        return f"{self.get_incident_type_display()} by {self.user.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class UserContact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_contacts")
    contact = models.ForeignKey(User, on_delete=models.CASCADE, related_name="contacted_by")

    def __str__(self):
        return f"{self.user.username} -> {self.contact.username}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}: {self.text[:30]}"
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True)
    alt_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"    
