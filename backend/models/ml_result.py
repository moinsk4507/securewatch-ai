from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, Float, ForeignKey, Integer, SmallInteger, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.database import Base


class MLResult(Base):
    __tablename__ = "ml_results"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    event_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    if_score: Mapped[float] = mapped_column(Float, nullable=False)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    rf_class: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rf_class_index: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    rf_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    features: Mapped[dict] = mapped_column(JSONB, nullable=False)
    alert_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pipeline_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=text("NOW()"))

    alert = relationship("Alert", back_populates="ml_results")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "event_id": self.event_id,
            "source_ip": self.source_ip,
            "if_score": self.if_score,
            "is_anomaly": self.is_anomaly,
            "rf_class": self.rf_class,
            "rf_class_index": self.rf_class_index,
            "rf_confidence": self.rf_confidence,
            "features": self.features,
            "alert_id": str(self.alert_id) if self.alert_id else None,
            "model_version": self.model_version,
            "pipeline_ms": self.pipeline_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
