"""
Compatibility auth module.

The existing codebase uses auth dependencies from `backend/middleware/auth_middleware.py`
(e.g., `get_current_user`, `require_admin`, etc). Some of our new routes import
these names from `utils.security`.

This file re-exports those dependencies so imports remain consistent.
"""

from middleware.auth_middleware import (  # noqa: F401
    get_current_user,
    require_admin,
    require_permission,
)
