from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import CheckConstraint, Float, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey

from models.database import Base


def _relative_time(value: datetime | None) -> str | None:
    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    seconds = max(int((datetime.now(timezone.utc) - value).total_seconds()), 0)
    if seconds < 60:
        return f"{seconds}s ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    return f"{hours // 24}d ago"


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint("severity IN ('critical', 'high', 'medium', 'low')", name="alerts_severity_check"),
        CheckConstraint(
            "status IN ('open', 'investigating', 'resolved', 'false_positive')",
            name="alerts_status_check",
        ),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    destination_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ml_classification: Mapped[str | None] = mapped_column(String(100), nullable=True)
    if_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rf_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, server_default=text("'open'"))
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    attack_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    raw_features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_log_line: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))

    assignee = relationship("User", back_populates="assigned_alerts", foreign_keys=[assigned_to])
    resolver = relationship("User", back_populates="resolved_alerts", foreign_keys=[resolved_by])
    ml_results = relationship("MLResult", back_populates="alert")
    rule_hits = relationship("RuleHit", back_populates="alert")
    blocked_ips = relationship("BlockedIP", back_populates="alert")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "severity": self.severity,
            "name": self.name,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "ml_classification": self.ml_classification,
            "if_score": self.if_score,
            "rf_confidence": self.rf_confidence,
            "status": self.status,
            "country": self.country,
            "city": self.city,
            "attack_type": self.attack_type,
            "raw_features": self.raw_features,
            "raw_log_line": self.raw_log_line,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "resolved_by": str(self.resolved_by) if self.resolved_by else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "relative_time": _relative_time(self.created_at),
        }
