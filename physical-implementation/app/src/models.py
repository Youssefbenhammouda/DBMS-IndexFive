"""Compatibility exports for legacy model imports.

The dedicated billing models now live in ``src.pages.billing``. Importing this
module keeps ``from src.models import *`` working without refactoring existing
callers.
"""

from .pages.billing import *  # noqa: F401,F403 re-export billing models
# Patient model

# /api/core-dashboard

