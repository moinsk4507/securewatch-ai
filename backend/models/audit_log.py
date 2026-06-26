from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("TRUE"))
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))

    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": str(self.user_id) if self.user_id else None,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "action": self.action,
            "resource": self.resource,
            "resource_id": self.resource_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "success": self.success,
            "error_msg": self.error_msg,
            "duration_ms": self.duration_ms,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
