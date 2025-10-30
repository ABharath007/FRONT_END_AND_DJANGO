from rest_framework import generics
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.db import models
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    SOSReportSerializer,
    HeatmapPointSerializer,
    UserContactSerializer,
    MessageSerializer,
    ContactSerializer,
    SOSAlertSerializer,
    TeamMemberSerializer,
    TeamMemberRegistrationSerializer,
    IncidentAssignmentSerializer,
    IncidentLogSerializer,
    ResourceTypeSerializer,
    ResourceSerializer,
    ResourceAssignmentSerializer,
    TeamMessageSerializer,
    TeamMessageReadSerializer,
    IncidentStatisticsSerializer,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import (
    SOSReport,
    LocationShare,
    Alert,
    Contact,
    HeatmapPoint,
    UserContact,
    Message,
    SOSAlert,
    TeamMember,
    IncidentAssignment,
    IncidentLog,
    ResourceType,
    Resource,
    ResourceAssignment,
    TeamMessage,
    TeamMessageRead,
    IncidentStatistics,
)

# ---------- USER REGISTRATION ----------
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# ---------- DASHBOARD ----------
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        sos_calls_count = SOSReport.objects.filter(user=user).count()
        locations_shared_count = LocationShare.objects.filter(user=user).count()
        alerts_received_count = Alert.objects.filter(user=user).count()
        contacts_added_count = Contact.objects.filter(owner=user).count()
        recent_sos = SOSReport.objects.filter(user=user).order_by('-date')[:5]

        data = {
            "sos_calls": sos_calls_count,
            "locations_shared": locations_shared_count,
            "alerts_received": alerts_received_count,
            "contacts_added": contacts_added_count,
            "recent_sos": SOSReportSerializer(recent_sos, many=True).data,
        }
        return Response(data)

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the incident.
        return obj.user == request.user

# ---------- HEATMAP ----------
# MODIFIED: Replaced HeatmapDataView with two more specific generic views

class HeatmapDataListCreateView(generics.ListCreateAPIView):
    """
    View to list active heatmap incidents and create new ones.
    """
    serializer_class = HeatmapPointSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all active (non-expired) heatmap points.
        """
        return HeatmapPoint.objects.filter(expires_at__gt=timezone.now())

    def perform_create(self, serializer):
        """
        Set the user and calculate the expiration time upon creation.
        """
        duration_seconds = self.request.data.get("duration", 60)
        expires_at = timezone.now() + timedelta(seconds=duration_seconds)
        serializer.save(user=self.request.user, expires_at=expires_at)


class HeatmapDataDetailView(generics.RetrieveDestroyAPIView):
    """
    View to retrieve or delete a heatmap incident.
    Deletion is only allowed for the user who created it.
    """
    queryset = HeatmapPoint.objects.all()
    serializer_class = HeatmapPointSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


# ---------- CONTACTS ----------
class ContactList(generics.ListCreateAPIView):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# Delete individual contact
class ContactDetail(generics.RetrieveDestroyAPIView):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user)

# ---------- USER CONTACTS ----------
class UserContactList(generics.ListAPIView):
    serializer_class = UserContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserContact.objects.filter(user=self.request.user)

# ---------- MESSAGES ----------
class MessageListCreate(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.all().order_by('timestamp')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class MessageDelete(generics.DestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only delete their own messages
        return Message.objects.filter(sender=self.request.user)

# ---------- ALL USERS FOR MESSAGING ----------
class AllUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return all users except the current user
        return User.objects.exclude(id=self.request.user.id).order_by('username')

# ---------- USER INFO ----------
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# ---------- SOS CREATION ----------
class AllSOSReportsView(generics.ListAPIView):
    serializer_class = SOSReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only team members can view all SOS reports
        try:
            TeamMember.objects.get(user=self.request.user)
            return SOSReport.objects.all().order_by('-date')
        except TeamMember.DoesNotExist:
            return SOSReport.objects.filter(user=self.request.user).order_by('-date')

class SOSCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sos_type = request.data.get("type", "General Emergency")
        selected_contacts = request.data.get("contacts", [])
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        sos = SOSReport.objects.create(
            user=request.user,
            type=sos_type,
            status="Pending"
        )

        # Send SOS alerts to selected contacts
        alerts_sent = 0
        for contact_id in selected_contacts:
            try:
                receiver = User.objects.get(id=contact_id)
                message = f"{request.user.username} sent an SOS alert: {sos_type}"
                SOSAlert.objects.create(
                    sender=request.user,
                    receiver=receiver,
                    message=message,
                    latitude=latitude,
                    longitude=longitude,
                    sos_type=sos_type
                )
                alerts_sent += 1
            except User.DoesNotExist:
                continue

        return Response(
            {
                "message": f"SOS sent successfully to {alerts_sent} contact(s)!",
                "sos_calls": SOSReport.objects.filter(user=request.user).count(),
                "sos_id": sos.id,
                "sos_type": sos.type,
                "alerts_sent": alerts_sent,
            },
            status=status.HTTP_201_CREATED,
        )

# ---------- SOS ALERTS ----------
class SOSAlertListView(generics.ListAPIView):
    serializer_class = SOSAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SOSAlert.objects.filter(receiver=self.request.user).order_by('-created_at')

class SOSAlertMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            alert = SOSAlert.objects.get(pk=pk, receiver=request.user)
            alert.is_read = True
            alert.save()
            return Response({"message": "Alert marked as read"}, status=status.HTTP_200_OK)
        except SOSAlert.DoesNotExist:
            return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

# ---------- USER SEARCH ----------
class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)
        
        users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)[:10]
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# ---------- USER CONTACT MANAGEMENT ----------
class UserContactCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        contact_id = request.data.get('contact_id')
        try:
            contact_user = User.objects.get(id=contact_id)
            # Check if already exists
            if UserContact.objects.filter(user=request.user, contact=contact_user).exists():
                return Response({"error": "Contact already added"}, status=status.HTTP_400_BAD_REQUEST)
            
            UserContact.objects.create(user=request.user, contact=contact_user)
            return Response({"message": "Contact added successfully"}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class UserContactDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            user_contact = UserContact.objects.get(pk=pk, user=request.user)
            user_contact.delete()
            return Response({"message": "Contact removed successfully"}, status=status.HTTP_200_OK)
        except UserContact.DoesNotExist:
            return Response({"error": "Contact not found"}, status=status.HTTP_404_NOT_FOUND)

# ---------- TEAM MEMBER REGISTRATION ----------
class TeamMemberRegistrationView(generics.CreateAPIView):
    serializer_class = TeamMemberRegistrationSerializer
    permission_classes = [AllowAny]

class TeamMemberListView(generics.ListAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by department if provided
        department = self.request.query_params.get('department', None)
        status_filter = self.request.query_params.get('status', None)
        queryset = TeamMember.objects.filter(is_verified=True)
        
        if department:
            queryset = queryset.filter(department=department)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-joined_at')

class TeamMemberDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TeamMember.objects.all()

class TeamMemberStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            new_status = request.data.get('status')
            
            if new_status not in dict(TeamMember.STATUS_CHOICES):
                return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
            
            team_member.status = new_status
            team_member.save()
            
            serializer = TeamMemberSerializer(team_member)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)

# ---------- INCIDENT ASSIGNMENT ----------
class IncidentAssignmentListView(generics.ListAPIView):
    serializer_class = IncidentAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Check if user is a team member
        try:
            team_member = TeamMember.objects.get(user=self.request.user)
            # Team members see their assigned incidents
            return IncidentAssignment.objects.filter(assigned_to=team_member).order_by('-assigned_at')
        except TeamMember.DoesNotExist:
            # Regular users don't see assignments
            return IncidentAssignment.objects.none()

class IncidentAssignmentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Only team leaders and coordinators can assign incidents
        try:
            assigner = TeamMember.objects.get(user=request.user)
            if assigner.role not in ['team_leader', 'coordinator']:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        except TeamMember.DoesNotExist:
            return Response({"error": "Only team members can assign incidents"}, status=status.HTTP_403_FORBIDDEN)
        
        sos_report_id = request.data.get('sos_report_id')
        assigned_to_id = request.data.get('assigned_to_id')
        priority = request.data.get('priority', 'medium')
        notes = request.data.get('notes', '')
        
        try:
            sos_report = SOSReport.objects.get(id=sos_report_id)
            assigned_to = TeamMember.objects.get(id=assigned_to_id)
            
            assignment = IncidentAssignment.objects.create(
                sos_report=sos_report,
                assigned_to=assigned_to,
                assigned_by=request.user,
                priority=priority,
                notes=notes
            )
            
            serializer = IncidentAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except SOSReport.DoesNotExist:
            return Response({"error": "SOS Report not found"}, status=status.HTTP_404_NOT_FOUND)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member not found"}, status=status.HTTP_404_NOT_FOUND)

class IncidentAssignmentUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            assignment = IncidentAssignment.objects.get(pk=pk)
            
            # Check if user is the assigned team member
            team_member = TeamMember.objects.get(user=request.user)
            if assignment.assigned_to != team_member:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
            # Update status and timestamps
            new_status = request.data.get('status')
            if new_status:
                assignment.status = new_status
                
                # Update timestamps based on status
                if new_status == 'dispatched' and not assignment.dispatched_at:
                    assignment.dispatched_at = timezone.now()
                elif new_status == 'on_scene' and not assignment.arrived_at:
                    assignment.arrived_at = timezone.now()
                elif new_status == 'resolved' and not assignment.resolved_at:
                    assignment.resolved_at = timezone.now()
            
            # Update notes if provided
            notes = request.data.get('notes')
            if notes:
                assignment.notes = notes
            
            assignment.save()
            
            serializer = IncidentAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except IncidentAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)

class IncidentLogCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            assignment_id = request.data.get('assignment_id')
            message = request.data.get('message')
            
            assignment = IncidentAssignment.objects.get(pk=assignment_id)
            
            log = IncidentLog.objects.create(
                assignment=assignment,
                logged_by=team_member,
                message=message
            )
            
            serializer = IncidentLogSerializer(log)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except IncidentAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

# ---------- TEAM DASHBOARD ----------
class TeamDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            
            # Get all unassigned SOS reports
            unassigned_sos = SOSReport.objects.filter(
                assignments__isnull=True,
                status='Pending'
            ).order_by('-date')
            
            # Get active assignments
            active_assignments = IncidentAssignment.objects.filter(
                status__in=['received', 'dispatched', 'en_route', 'on_scene']
            ).order_by('-assigned_at')
            
            # Get team member's assignments
            my_assignments = IncidentAssignment.objects.filter(
                assigned_to=team_member,
                status__in=['received', 'dispatched', 'en_route', 'on_scene']
            ).order_by('-assigned_at')
            
            # Get available team members
            available_team = TeamMember.objects.filter(
                status__in=['available', 'on_duty'],
                is_verified=True
            ).exclude(id=team_member.id)
            
            data = {
                "team_member": TeamMemberSerializer(team_member).data,
                "unassigned_sos": SOSReportSerializer(unassigned_sos, many=True).data,
                "active_assignments": IncidentAssignmentSerializer(active_assignments, many=True).data,
                "my_assignments": IncidentAssignmentSerializer(my_assignments, many=True).data,
                "available_team": TeamMemberSerializer(available_team, many=True).data,
                "stats": {
                    "total_unassigned": unassigned_sos.count(),
                    "total_active": active_assignments.count(),
                    "my_active": my_assignments.count(),
                    "available_members": available_team.count(),
                }
            }
            
            return Response(data, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)

# ========== PHASE 2: RESOURCE MANAGEMENT ==========
class ResourceTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = ResourceTypeSerializer
    permission_classes = [IsAuthenticated]
    queryset = ResourceType.objects.all()

class ResourceListCreateView(generics.ListCreateAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Resource.objects.all()
        status_filter = self.request.query_params.get('status', None)
        category = self.request.query_params.get('category', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category:
            queryset = queryset.filter(resource_type__category=category)
        
        return queryset.order_by('-created_at')

class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    queryset = Resource.objects.all()

class ResourceAssignView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            resource_id = request.data.get('resource_id')
            incident_id = request.data.get('incident_id', None)
            notes = request.data.get('notes', '')
            
            resource = Resource.objects.get(id=resource_id)
            
            if resource.status != 'available':
                return Response({"error": "Resource is not available"}, status=status.HTTP_400_BAD_REQUEST)
            
            incident = None
            if incident_id:
                incident = IncidentAssignment.objects.get(id=incident_id)
            
            # Create assignment
            assignment = ResourceAssignment.objects.create(
                resource=resource,
                team_member=team_member,
                incident=incident,
                notes=notes
            )
            
            # Update resource status
            resource.status = 'in_use'
            resource.assigned_to = team_member
            resource.save()
            
            serializer = ResourceAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Resource.DoesNotExist:
            return Response({"error": "Resource not found"}, status=status.HTTP_404_NOT_FOUND)

class ResourceReturnView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            assignment = ResourceAssignment.objects.get(pk=pk, returned_at__isnull=True)
            
            # Mark as returned
            assignment.returned_at = timezone.now()
            assignment.save()
            
            # Update resource status
            resource = assignment.resource
            resource.status = 'available'
            resource.assigned_to = None
            resource.save()
            
            return Response({"message": "Resource returned successfully"}, status=status.HTTP_200_OK)
        except ResourceAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

# ========== PHASE 2: TEAM COMMUNICATION ==========
class TeamMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            team_member = TeamMember.objects.get(user=self.request.user)
            # Get messages for team member's department or broadcasts
            return TeamMessage.objects.filter(
                models.Q(department=team_member.department) | 
                models.Q(department__isnull=True) |
                models.Q(is_broadcast=True)
            ).order_by('-created_at')
        except TeamMember.DoesNotExist:
            return TeamMessage.objects.none()
    
    def perform_create(self, serializer):
        team_member = TeamMember.objects.get(user=self.request.user)
        serializer.save(sender=team_member)

class TeamMessageMarkReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            message = TeamMessage.objects.get(pk=pk)
            
            # Create read record if not exists
            TeamMessageRead.objects.get_or_create(
                message=message,
                team_member=team_member
            )
            
            return Response({"message": "Message marked as read"}, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except TeamMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)

class BroadcastMessageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            
            # Only team leaders and coordinators can broadcast
            if team_member.role not in ['team_leader', 'coordinator']:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
            message_text = request.data.get('message')
            priority = request.data.get('priority', 'normal')
            
            message = TeamMessage.objects.create(
                sender=team_member,
                message=message_text,
                is_broadcast=True,
                priority=priority
            )
            
            serializer = TeamMessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)

# ========== PHASE 2: ANALYTICS ==========
class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            
            # Get last 30 days statistics
            from datetime import date, timedelta
            today = date.today()
            thirty_days_ago = today - timedelta(days=30)
            
            stats = IncidentStatistics.objects.filter(
                date__gte=thirty_days_ago
            ).order_by('-date')
            
            # Calculate overall metrics
            total_incidents = IncidentAssignment.objects.count()
            resolved_incidents = IncidentAssignment.objects.filter(status='resolved').count()
            active_incidents = IncidentAssignment.objects.filter(
                status__in=['received', 'dispatched', 'en_route', 'on_scene']
            ).count()
            
            # Calculate average response time
            completed_assignments = IncidentAssignment.objects.filter(
                arrived_at__isnull=False
            )
            avg_response = 0
            if completed_assignments.exists():
                total_time = sum([a.response_time for a in completed_assignments if a.response_time])
                avg_response = total_time / completed_assignments.count() if completed_assignments.count() > 0 else 0
            
            # Department performance
            department_stats = {}
            for dept_code, dept_name in TeamMember.DEPARTMENT_CHOICES:
                dept_assignments = IncidentAssignment.objects.filter(
                    assigned_to__department=dept_code
                )
                department_stats[dept_name] = {
                    'total': dept_assignments.count(),
                    'resolved': dept_assignments.filter(status='resolved').count(),
                    'active': dept_assignments.filter(status__in=['received', 'dispatched', 'en_route', 'on_scene']).count()
                }
            
            data = {
                "overall": {
                    "total_incidents": total_incidents,
                    "resolved_incidents": resolved_incidents,
                    "active_incidents": active_incidents,
                    "average_response_time": round(avg_response, 2),
                    "resolution_rate": round((resolved_incidents / total_incidents * 100) if total_incidents > 0 else 0, 2)
                },
                "daily_stats": IncidentStatisticsSerializer(stats, many=True).data,
                "department_performance": department_stats,
                "team_member": TeamMemberSerializer(team_member).data
            }
            
            return Response(data, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)

# ========== TEAM MANAGEMENT ==========
from .models import Team, TeamMembership, TeamJoinRequest
from .serializers import TeamSerializer, TeamMembershipSerializer, TeamJoinRequestSerializer
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

class TeamListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TeamSerializer
    
    def get_queryset(self):
        return Team.objects.filter(is_active=True).annotate(
            member_count=Count('members', filter=Q(members__is_approved=True))
        )
    
    def perform_create(self, serializer):
        try:
            team_member = TeamMember.objects.get(user=self.request.user)
            if team_member.role not in ['team_leader', 'coordinator']:
                raise PermissionDenied("Only team leaders can create teams")
            serializer.save(leader=team_member)
        except TeamMember.DoesNotExist:
            raise PermissionDenied("You must be a verified team member")

class MyTeamsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            team_member = TeamMember.objects.get(user=request.user)
            memberships = TeamMembership.objects.filter(member=team_member, is_approved=True)
            teams = [m.team for m in memberships]
            serializer = TeamSerializer(teams, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({"error": "Team member profile not found"}, status=status.HTTP_404_NOT_FOUND)
