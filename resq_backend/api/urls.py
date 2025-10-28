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
    SOSAlertListView,
    SOSAlertMarkReadView,
    UserSearchView,
    UserContactCreateView,
    UserContactDeleteView,
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
]
