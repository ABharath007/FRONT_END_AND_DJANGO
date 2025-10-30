from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (SOSReport, LocationShare, Alert, Contact, HeatmapPoint, UserContact, Message, 
                     UserProfile, SOSAlert, TeamMember, IncidentAssignment, IncidentLog, ResourceType, 
                     Resource, ResourceAssignment, TeamMessage, TeamMessageRead, IncidentStatistics,
                     Team, TeamMembership, TeamJoinRequest)

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password') # Add all fields
        extra_kwargs = {'password': {'write_only': True}} # Make password write-only

    def create(self, validated_data):
        # Use create_user to properly hash the password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

# ---------- USER SERIALIZER ----------
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'alt_phone', 'address']

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="username", read_only=True)
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        # get or create the related profile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        profile.phone = profile_data.get('phone', profile.phone)
        profile.alt_phone = profile_data.get('alt_phone', profile.alt_phone)
        profile.address = profile_data.get('address', profile.address)
        profile.save()
        return instance

# ---------- SOS REPORT SERIALIZER ----------
class SOSReportSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    phone_number = serializers.SerializerMethodField()
    
    class Meta:
        model = SOSReport
        fields = ['id', 'date', 'type', 'status', 'username', 'phone_number', 'latitude', 'longitude', 'description']
    
    def get_phone_number(self, obj):
        try:
            return obj.user.profile.phone
        except:
            return "N/A"

# ---------- LOCATION SHARE SERIALIZER ----------
class LocationShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationShare
        fields = ['latitude', 'longitude', 'shared_at']

# ---------- ALERT SERIALIZER ----------
class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['message', 'created_at', 'is_read']

# ---------- CONTACT SERIALIZER ----------
class ContactSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')  # Owner is automatically assigned, read-only

    class Meta:
        model = Contact
        fields = ['id', 'owner', 'name', 'phone_number', 'email']

    # Optional: validate phone number
    def validate_phone_number(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        return value

# ---------- HEATMAP POINT SERIALIZER ----------
class HeatmapPointSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    duration = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = HeatmapPoint
        fields = [
            'id', 'lat', 'lng', 'incident_type', 'description',
            'username', 'created_at', 'expires_at', 'duration'
        ]
        read_only_fields = ['created_at', 'expires_at', 'username']


# ---------- USER CONTACT SERIALIZER ----------
class UserContactSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    contact_username = serializers.CharField(source='contact.username', read_only=True)

    class Meta:
        model = UserContact
        fields = ['id', 'user', 'user_username', 'contact', 'contact_username']

# ---------- MESSAGE SERIALIZER ----------
class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True, allow_null=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 'text', 'timestamp']
        read_only_fields = ['sender', 'sender_username', 'timestamp']

# ---------- SOS ALERT SERIALIZER ----------
class SOSAlertSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = SOSAlert
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 'message', 'latitude', 'longitude', 'created_at', 'is_read', 'sos_type']
        read_only_fields = ['sender', 'sender_username', 'created_at']

# ---------- TEAM MEMBER SERIALIZER ----------
class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'username', 'email', 'role', 'role_display', 'department', 
                  'department_display', 'badge_number', 'certification', 'phone', 'status', 
                  'status_display', 'is_verified', 'joined_at']
        read_only_fields = ['user', 'username', 'email', 'is_verified', 'joined_at']

class TeamMemberRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = TeamMember
        fields = ['username', 'email', 'password', 'role', 'department', 'badge_number', 
                  'certification', 'phone']
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username already exists. Please choose another.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered. Please use another.")
        return value
    
    def validate_badge_number(self, value):
        if TeamMember.objects.filter(badge_number=value).exists():
            raise serializers.ValidationError("This badge number is already registered.")
        return value
    
    def create(self, validated_data):
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Create team member profile
            team_member = TeamMember.objects.create(user=user, **validated_data)
            return team_member
        except Exception as e:
            # If team member creation fails, delete the user
            if 'user' in locals():
                user.delete()
            raise serializers.ValidationError(f"Registration failed: {str(e)}")

# ---------- INCIDENT ASSIGNMENT SERIALIZER ----------
class IncidentLogSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source='logged_by.user.username', read_only=True)
    
    class Meta:
        model = IncidentLog
        fields = ['id', 'assignment', 'logged_by', 'logged_by_name', 'message', 'timestamp']
        read_only_fields = ['timestamp']

class IncidentAssignmentSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.user.username', read_only=True)
    assigned_to_department = serializers.CharField(source='assigned_to.get_department_display', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True)
    sos_type = serializers.CharField(source='sos_report.type', read_only=True)
    sos_user = serializers.CharField(source='sos_report.user.username', read_only=True)
    sos_date = serializers.DateTimeField(source='sos_report.date', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    logs = IncidentLogSerializer(many=True, read_only=True)
    response_time = serializers.FloatField(read_only=True)
    
    class Meta:
        model = IncidentAssignment
        fields = ['id', 'sos_report', 'sos_type', 'sos_user', 'sos_date', 'assigned_to', 
                  'assigned_to_name', 'assigned_to_department', 'assigned_by', 'assigned_by_name', 
                  'status', 'status_display', 'priority', 'priority_display', 'notes', 
                  'assigned_at', 'dispatched_at', 'arrived_at', 'resolved_at', 'response_time', 'logs']
        read_only_fields = ['assigned_at', 'assigned_by', 'response_time']

# ========== PHASE 2: RESOURCE SERIALIZERS ==========
class ResourceTypeSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = ResourceType
        fields = ['id', 'name', 'category', 'category_display', 'description']

class ResourceSerializer(serializers.ModelSerializer):
    resource_type_name = serializers.CharField(source='resource_type.name', read_only=True)
    resource_category = serializers.CharField(source='resource_type.category', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.user.username', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Resource
        fields = ['id', 'resource_type', 'resource_type_name', 'resource_category', 'identifier', 
                  'status', 'status_display', 'assigned_to', 'assigned_to_name', 'location', 
                  'last_maintenance', 'next_maintenance', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class ResourceAssignmentSerializer(serializers.ModelSerializer):
    resource_identifier = serializers.CharField(source='resource.identifier', read_only=True)
    resource_name = serializers.CharField(source='resource.resource_type.name', read_only=True)
    team_member_name = serializers.CharField(source='team_member.user.username', read_only=True)
    incident_id = serializers.IntegerField(source='incident.id', read_only=True, allow_null=True)
    
    class Meta:
        model = ResourceAssignment
        fields = ['id', 'resource', 'resource_identifier', 'resource_name', 'team_member', 
                  'team_member_name', 'incident', 'incident_id', 'assigned_at', 'returned_at', 'notes']
        read_only_fields = ['assigned_at']

# ========== PHASE 2: TEAM COMMUNICATION SERIALIZERS ==========
class TeamMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.user.username', read_only=True)
    sender_department = serializers.CharField(source='sender.get_department_display', read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True, allow_null=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    read_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMessage
        fields = ['id', 'sender', 'sender_name', 'sender_department', 'department', 'department_display', 
                  'message', 'is_broadcast', 'priority', 'priority_display', 'created_at', 'read_count']
        read_only_fields = ['sender', 'created_at']
    
    def get_read_count(self, obj):
        return obj.read_by.count()

class TeamMessageReadSerializer(serializers.ModelSerializer):
    team_member_name = serializers.CharField(source='team_member.user.username', read_only=True)
    
    class Meta:
        model = TeamMessageRead
        fields = ['id', 'message', 'team_member', 'team_member_name', 'read_at']
        read_only_fields = ['read_at']

# ========== PHASE 2: ANALYTICS SERIALIZERS ==========
class IncidentStatisticsSerializer(serializers.ModelSerializer):
    resolution_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = IncidentStatistics
        fields = ['id', 'date', 'total_incidents', 'resolved_incidents', 'average_response_time', 
                  'critical_incidents', 'high_priority_incidents', 'resolution_rate']
    
    def get_resolution_rate(self, obj):
        if obj.total_incidents > 0:
            return round((obj.resolved_incidents / obj.total_incidents) * 100, 2)
        return 0.0

# ========== TEAM MANAGEMENT SERIALIZERS ==========
class TeamSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.user.username', read_only=True)
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    member_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'leader', 'leader_name', 'department', 
                  'department_display', 'created_at', 'is_active', 'max_members', 'member_count']
        read_only_fields = ['created_at', 'leader', 'leader_name', 'member_count']

class TeamMembershipSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    member_name = serializers.CharField(source='member.user.username', read_only=True)
    role_display = serializers.CharField(source='get_role_in_team_display', read_only=True)
    
    class Meta:
        model = TeamMembership
        fields = ['id', 'team', 'team_name', 'member', 'member_name', 'joined_at', 
                  'is_approved', 'role_in_team', 'role_display']
        read_only_fields = ['joined_at']

class TeamJoinRequestSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    member_name = serializers.CharField(source='member.user.username', read_only=True)
    requested_role_display = serializers.CharField(source='get_requested_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TeamJoinRequest
        fields = ['id', 'team', 'team_name', 'member', 'member_name', 'requested_role', 
                  'requested_role_display', 'message', 'status', 'status_display', 
                  'requested_at', 'reviewed_at', 'reviewed_by']
        read_only_fields = ['requested_at', 'reviewed_at', 'reviewed_by', 'status']
