from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, CheckConstraint, ForeignKey, Integer, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.database import Base


class Rule(Base):
    __tablename__ = "rules"
    __table_args__ = (CheckConstraint("severity IN ('critical', 'high', 'medium', 'low')", name="rules_severity_check"),)

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    condition: Mapped[str] = mapped_column(String(500), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("TRUE"))
    hits_today: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    hits_total: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    created_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))

    creator = relationship("User", back_populates="created_rules", foreign_keys=[created_by])
    rule_hits = relationship("RuleHit", back_populates="rule", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "condition": self.condition,
            "severity": self.severity,
            "action": self.action,
            "description": self.description,
            "enabled": self.enabled,
            "hits_today": self.hits_today,
            "hits_total": self.hits_total,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RuleHit(Base):
    __tablename__ = "rule_hits"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    rule_id: Mapped[str] = mapped_column(String(20), ForeignKey("rules.id", ondelete="CASCADE"), nullable=False)
    alert_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    source_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    triggered_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))

    rule = relationship("Rule", back_populates="rule_hits")
    alert = relationship("Alert", back_populates="rule_hits")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "rule_id": self.rule_id,
            "alert_id": str(self.alert_id) if self.alert_id else None,
            "source_ip": self.source_ip,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
        }
