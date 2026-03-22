from rest_framework.permissions import BasePermission


class IsChildOwner(BasePermission):
    """Only allow a parent to access their own children."""

    def has_object_permission(self, request, view, obj):
        return obj.parent == request.user
