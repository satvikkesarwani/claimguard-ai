"""Shared pytest fixtures — uses an isolated temp SQLite DB for the test app."""
import os
import tempfile

import pytest

# Point the app at a throwaway DB before importing it.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["CLAIMGUARD_DB"] = _tmp.name
# Force API-only mode for tests (no built SPA), independent of any local build.
os.environ["STATIC_DIR"] = os.path.join(tempfile.gettempdir(), "claimguard_no_static")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed_data import seed_database  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _seed():
    seed_database(reset=True)
    yield
    try:
        os.unlink(_tmp.name)
    except OSError:
        pass


@pytest.fixture()
def client():
    return TestClient(app)
