"""
QUANTUMANIA - Database Model for Quantum Circuits
Persists user created circuits with canonical JSON schemas and optional Qiskit code.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, JSON, DateTime, ForeignKey
import uuid

from app.db.base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CircuitModel(Base):
    __tablename__ = "circuits"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False, default="Untitled Circuit")
    qubits = Column(Integer, nullable=False, default=2)
    classical_bits = Column(Integer, nullable=False, default=2)
    canonical_json = Column(JSON, nullable=False)
    qiskit_code = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    @property
    def canonical(self):
        return self.canonical_json

    @canonical.setter
    def canonical(self, val):
        self.canonical_json = val
