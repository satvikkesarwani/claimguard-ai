"""
ClaimGuard AI — Database setup (SQLite + SQLAlchemy).

MVP Simulation: a single local SQLite file persists claims, audit logs and
feedback events. No real patient data is stored — all records are anonymized
mock data (see app/seed_data.py).
"""
from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Store the SQLite file next to the backend package so it is easy to find/reset.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("CLAIMGUARD_DB", os.path.join(BASE_DIR, "claimguard.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # allow use across FastAPI threads
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db():
    """FastAPI dependency that yields a scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
