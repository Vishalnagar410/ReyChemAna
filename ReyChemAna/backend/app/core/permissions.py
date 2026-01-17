"""
Role-based access control utilities
"""
from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole
from app.dependencies import get_current_user


class PermissionChecker:
    """
    Dependency class for checking user permissions
    """

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user: User = Depends(get_current_user)
    ) -> bool:
        """
        Check if current user has required role
        """

        # Normalize role (safe for Enum + DB)
        user_role = (
            current_user.role
            if isinstance(current_user.role, UserRole)
            else UserRole(current_user.role)
        )

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}"
            )

        return True


# ---- Predefined permission checkers ----

require_chemist = PermissionChecker([
    UserRole.CHEMIST,
    UserRole.ADMIN
])

require_analyst = PermissionChecker([
    UserRole.ANALYST,
    UserRole.ADMIN
])

require_admin = PermissionChecker([
    UserRole.ADMIN
])

require_any_role = PermissionChecker([
    UserRole.CHEMIST,
    UserRole.ANALYST,
    UserRole.ADMIN
])
