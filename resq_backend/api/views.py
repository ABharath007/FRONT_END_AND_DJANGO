from rest_framework import generics
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    SOSReportSerializer,
    HeatmapPointSerializer,
    UserContactSerializer,
    MessageSerializer,
    ContactSerializer,
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
class SOSCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sos_type = request.data.get("type", "General Emergency")

        sos = SOSReport.objects.create(
            user=request.user,
            type=sos_type,
            status="Pending"
        )

        return Response(
            {
                "message": "SOS sent successfully!",
                "sos_calls": SOSReport.objects.filter(user=request.user).count(),
                "sos_id": sos.id,
                "sos_type": sos.type,
            },
            status=status.HTTP_201_CREATED,
        )
