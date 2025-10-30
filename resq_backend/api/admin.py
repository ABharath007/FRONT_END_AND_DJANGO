from django.contrib import admin
from .models import (SOSReport, LocationShare, Alert, Contact, HeatmapPoint, TeamMember, IncidentAssignment, 
                     IncidentLog, ResourceType, Resource, ResourceAssignment, TeamMessage, TeamMessageRead, 
                     IncidentStatistics, Team, TeamMembership, TeamJoinRequest)

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'badge_number', 'status', 'is_verified']
    list_filter = ['role', 'department', 'status', 'is_verified']
    search_fields = ['user__username', 'badge_number', 'phone']
    actions = ['verify_members']
    
    def verify_members(self, request, queryset):
        queryset.update(is_verified=True)
    verify_members.short_description = "Verify selected team members"

@admin.register(IncidentAssignment)
class IncidentAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'sos_report', 'assigned_to', 'status', 'priority', 'assigned_at']
    list_filter = ['status', 'priority', 'assigned_at']
    search_fields = ['sos_report__type', 'assigned_to__user__username']

@admin.register(IncidentLog)
class IncidentLogAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'logged_by', 'timestamp']
    list_filter = ['timestamp']

admin.site.register(SOSReport)
admin.site.register(LocationShare)
admin.site.register(Alert)
admin.site.register(Contact)
admin.site.register(HeatmapPoint)

# Phase 2 Admin
@admin.register(ResourceType)
class ResourceTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    list_filter = ['category']

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['identifier', 'resource_type', 'status', 'assigned_to', 'location']
    list_filter = ['status', 'resource_type__category']
    search_fields = ['identifier', 'location']

@admin.register(ResourceAssignment)
class ResourceAssignmentAdmin(admin.ModelAdmin):
    list_display = ['resource', 'team_member', 'assigned_at', 'returned_at']
    list_filter = ['assigned_at', 'returned_at']

@admin.register(TeamMessage)
class TeamMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'department', 'is_broadcast', 'priority', 'created_at']
    list_filter = ['is_broadcast', 'priority', 'department', 'created_at']

@admin.register(IncidentStatistics)
class IncidentStatisticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_incidents', 'resolved_incidents', 'average_response_time']
    list_filter = ['date']

admin.site.register(TeamMessageRead)

# Team Management Admin
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'leader', 'department', 'is_active', 'created_at']
    list_filter = ['department', 'is_active', 'created_at']
    search_fields = ['name', 'leader__user__username']

@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ['team', 'member', 'role_in_team', 'is_approved', 'joined_at']
    list_filter = ['is_approved', 'role_in_team', 'joined_at']
    search_fields = ['team__name', 'member__user__username']
    actions = ['approve_memberships']
    
    def approve_memberships(self, request, queryset):
        queryset.update(is_approved=True)
    approve_memberships.short_description = "Approve selected memberships"

@admin.register(TeamJoinRequest)
class TeamJoinRequestAdmin(admin.ModelAdmin):
    list_display = ['member', 'team', 'requested_role', 'status', 'requested_at']
    list_filter = ['status', 'requested_role', 'requested_at']
    search_fields = ['member__user__username', 'team__name']
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        from django.utils import timezone
        for req in queryset.filter(status='pending'):
            req.status = 'approved'
            req.reviewed_at = timezone.now()
            req.reviewed_by = request.user
            req.save()
            # Create team membership
            TeamMembership.objects.get_or_create(
                team=req.team,
                member=req.member,
                defaults={'role_in_team': req.requested_role, 'is_approved': True}
            )
    approve_requests.short_description = "Approve selected requests"
    
    def reject_requests(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='rejected', reviewed_at=timezone.now(), reviewed_by=request.user)
    reject_requests.short_description = "Reject selected requests"