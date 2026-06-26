from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('admin', 'analyst', 'viewer')", name="users_role_check"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), server_default=text("'analyst'"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))
    last_login: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("TRUE"))
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))

    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    assigned_alerts = relationship("Alert", back_populates="assignee", foreign_keys="Alert.assigned_to")
    resolved_alerts = relationship("Alert", back_populates="resolver", foreign_keys="Alert.resolved_by")
    created_rules = relationship("Rule", back_populates="creator", foreign_keys="Rule.created_by")
    blocked_ips = relationship("BlockedIP", back_populates="blocker", foreign_keys="BlockedIP.blocked_by")
    updated_settings = relationship("Setting", back_populates="updater", foreign_keys="Setting.updated_by")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "is_active": self.is_active,
            "mfa_enabled": self.mfa_enabled,
        }
