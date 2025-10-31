from django.urls import path
from .views import (
    CreateUserView,
    DashboardView,
    HeatmapDataListCreateView,
    HeatmapDataDetailView,
    ContactList,
    ContactDetail,
    UserContactList,
    MessageListCreate,
    MessageDelete,
    AllUsersView,
    MeView,
    SOSCreateView,
    AllSOSReportsView,
    SOSAlertListView,
    SOSAlertMarkReadView,
    UserSearchView,
    UserContactCreateView,
    UserContactDeleteView,
    TeamMemberRegistrationView,
    TeamMemberListView,
    TeamMemberDetailView,
    TeamMemberStatusUpdateView,
    IncidentAssignmentListView,
    IncidentAssignmentCreateView,
    IncidentAssignmentUpdateView,
    IncidentLogCreateView,
    TeamDashboardView,
    ResourceTypeListCreateView,
    ResourceListCreateView,
    ResourceDetailView,
    ResourceAssignView,
    ResourceReturnView,
    TeamMessageListCreateView,
    TeamMessageMarkReadView,
    BroadcastMessageView,
    AnalyticsDashboardView,
    TeamListCreateView,
    MyTeamsView,
    TeamJoinRequestView,
    MyTeamRequestsView,
    ApproveJoinRequestView,
    RejectJoinRequestView,
    TeamMembersView,
    TeamIncidentsView,
)

urlpatterns = [
    path('register/', CreateUserView.as_view(), name='register'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('heatmap-data/', HeatmapDataListCreateView.as_view(), name='heatmap-list-create'),
    path('heatmap-data/<int:pk>/', HeatmapDataDetailView.as_view(), name='heatmap-detail'),

    # Contacts
    path('contacts/', ContactList.as_view(), name='contacts'),          # list & add
    path('contacts/<int:pk>/', ContactDetail.as_view(), name='contact-detail'),  # delete individual

    # User-specific contacts
    path('user-contacts/', UserContactList.as_view(), name='user-contacts'),

    # Messages
    path('messages/', MessageListCreate.as_view(), name='messages'),
    path('messages/<int:pk>/', MessageDelete.as_view(), name='message-delete'),

    # All users for messaging
    path('users/', AllUsersView.as_view(), name='all-users'),

    # User info
    path('me/', MeView.as_view(), name='me'),

    # SOS
    path('sos/', SOSCreateView.as_view(), name='send-sos'),
    path('sos-alerts/', SOSAlertListView.as_view(), name='sos-alerts'),
    path('sos-alerts/<int:pk>/mark-read/', SOSAlertMarkReadView.as_view(), name='sos-alert-mark-read'),

    # User search
    path('search-users/', UserSearchView.as_view(), name='search-users'),

    # User contact management
    path('user-contacts/add/', UserContactCreateView.as_view(), name='user-contact-add'),
    path('user-contacts/<int:pk>/delete/', UserContactDeleteView.as_view(), name='user-contact-delete'),

    # Team Member Management
    path('team/register/', TeamMemberRegistrationView.as_view(), name='team-register'),
    path('team/members/', TeamMemberListView.as_view(), name='team-members'),
    path('team/members/<int:pk>/', TeamMemberDetailView.as_view(), name='team-member-detail'),
    path('team/status/', TeamMemberStatusUpdateView.as_view(), name='team-status-update'),
    path('team/dashboard/', TeamDashboardView.as_view(), name='team-dashboard'),

    # Incident Management
    path('incidents/', AllSOSReportsView.as_view(), name='all-sos-reports'),
    path('incidents/assignments/', IncidentAssignmentListView.as_view(), name='incident-assignments'),
    path('incidents/assignments/create/', IncidentAssignmentCreateView.as_view(), name='incident-assignment-create'),
    path('incidents/assignments/<int:pk>/update/', IncidentAssignmentUpdateView.as_view(), name='incident-assignment-update'),
    path('incidents/logs/create/', IncidentLogCreateView.as_view(), name='incident-log-create'),

    # Phase 2: Resource Management
    path('resources/types/', ResourceTypeListCreateView.as_view(), name='resource-types'),
    path('resources/', ResourceListCreateView.as_view(), name='resources'),
    path('resources/<int:pk>/', ResourceDetailView.as_view(), name='resource-detail'),
    path('resources/assign/', ResourceAssignView.as_view(), name='resource-assign'),
    path('resources/return/<int:pk>/', ResourceReturnView.as_view(), name='resource-return'),

    # Phase 2: Team Communication
    path('team/messages/', TeamMessageListCreateView.as_view(), name='team-messages'),
    path('team/messages/<int:pk>/mark-read/', TeamMessageMarkReadView.as_view(), name='team-message-mark-read'),
    path('team/broadcast/', BroadcastMessageView.as_view(), name='broadcast-message'),

    # Phase 2: Analytics
    path('analytics/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),

    # Team Management
    path('teams/', TeamListCreateView.as_view(), name='teams-list-create'),
    path('my-teams/', MyTeamsView.as_view(), name='my-teams'),
    path('teams/join/', TeamJoinRequestView.as_view(), name='team-join-request'),
    path('teams/requests/', MyTeamRequestsView.as_view(), name='my-team-requests'),
    path('teams/requests/<int:request_id>/approve/', ApproveJoinRequestView.as_view(), name='approve-request'),
    path('teams/requests/<int:request_id>/reject/', RejectJoinRequestView.as_view(), name='reject-request'),
    path('teams/<int:team_id>/members/', TeamMembersView.as_view(), name='team-members'),
    path('incidents/heatmap/', TeamIncidentsView.as_view(), name='team-incidents-heatmap'),
]
