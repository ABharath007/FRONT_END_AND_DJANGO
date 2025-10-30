#!/usr/bin/env python
"""Add team leaders to their teams if not already members"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resq_backend.settings')
django.setup()

from api.models import Team, TeamMembership

# Get all teams
teams = Team.objects.all()

for team in teams:
    leader = team.leader
    membership, created = TeamMembership.objects.get_or_create(
        team=team,
        member=leader,
        defaults={
            'role_in_team': leader.role,
            'is_approved': True
        }
    )
    
    if created:
        print(f"✅ Added {leader.user.username} to {team.name}")
    else:
        print(f"ℹ️  {leader.user.username} already in {team.name}")

print("\n✅ Done!")
