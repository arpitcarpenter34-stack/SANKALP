"""Pytest configuration and root path resolution for India Impact Graph tests."""

import sys
from pathlib import Path

# Ensure india-impact-graph root and backend package are in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
