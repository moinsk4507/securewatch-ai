from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.database import Base


class Setting(Base):
    __tablename__ = "settings"
    __table_args__ = (
        CheckConstraint("value_type IN ('string', 'integer', 'float', 'boolean', 'json')", name="settings_value_type_check"),
    )

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'string'"))
    category: Mapped[str] = mapped_column(String(50), nullable=False, server_default=text("'general'"))
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))

    updater = relationship("User", back_populates="updated_settings", foreign_keys=[updated_by])

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "value": self.value,
            "value_type": self.value_type,
            "category": self.category,
            "description": self.description,
            "updated_by": str(self.updated_by) if self.updated_by else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
