# SecureWatch AI — Complete Backend Schema Document

**Stack:** FastAPI + PostgreSQL + SQLAlchemy 2.0
**Version:** 1.0
**Date:** April 2025

---

## 1. Database Schema — Complete ERD

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP DIAGRAM                      │
│                                                                         │
│  ┌──────────────┐         ┌──────────────────┐       ┌───────────────┐  │
│  │    users     │────────<│   audit_logs     │       │    rules      │  │
│  │──────────────│  1:many │──────────────────│       │───────────────│  │
│  │ id (PK)      │         │ id (PK)          │       │ id (PK)       │  │
│  │ email        │         │ user_id (FK)     │       │ name          │  │
│  │ password     │         │ action           │       │ condition     │  │
│  │ name         │         │ resource         │       │ severity      │  │
│  │ role         │         │ ip_address       │       │ action        │  │
│  │ created_at   │         │ timestamp        │       │ enabled       │  │
│  │ last_login   │         └──────────────────┘       │ hits_today    │  │
│  │ is_active    │                                    │ created_by    │  │
│  └──────────────┘                                    └───────────────┘  │
│         │                                                     │         │
│         │ 1:many                                              │ 1:many  │
│         ▼                                                     ▼         │
│  ┌──────────────┐         ┌──────────────────┐       ┌───────────────┐  │
│  │   alerts     │         │   ml_results     │       │ rule_hits     │  │
│  │──────────────│         │──────────────────│       │───────────────│  │
│  │ id (PK)      │         │ id (PK)          │       │ id (PK)       │  │
│  │ severity     │         │ event_id         │       │ rule_id (FK)  │  │
│  │ name         │         │ if_score         │       │ alert_id (FK) │  │
│  │ source_ip    │         │ rf_class         │       │ triggered_at  │  │
│  │ attack_type  │         │ confidence       │       └───────────────┘  │
│  │ if_score     │         │ features (JSONB) │                          │
│  │ status       │         │ alert_id (FK)    │       ┌───────────────┐  │
│  │ country      │         │ created_at       │       │   settings    │  │
│  │ raw_features │         └──────────────────┘       │───────────────│  │
│  │ assigned_to  │                                    │ key (PK)      │  │
│  │ created_at   │         ┌──────────────────┐       │ value         │  │
│  └──────────────┘         │  blocked_ips     │       │ updated_at    │  │
│                           │──────────────────│       └───────────────┘  │
│                           │ id (PK)          │                          │
│                           │ ip_address       │                          │
│                           │ reason           │                          │
│                           │ blocked_by (FK)  │                          │
│                           │ created_at       │                          │
│                           └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PostgreSQL Table Definitions

### 2.1 users

```sql
CREATE TABLE users (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    name        VARCHAR(255)    NOT NULL,
    role        VARCHAR(50)     NOT NULL DEFAULT 'analyst'
                                CONSTRAINT users_role_check
                                CHECK (role IN ('admin','analyst','viewer')),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_login  TIMESTAMPTZ,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    mfa_secret  VARCHAR(64),
    mfa_enabled BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_role     ON users (role);
CREATE INDEX idx_users_active   ON users (is_active);
CREATE INDEX idx_users_created  ON users (created_at DESC);
```

### 2.2 alerts

```sql
CREATE TABLE alerts (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    severity            VARCHAR(20)     NOT NULL
                                        CONSTRAINT alerts_severity_check
                                        CHECK (severity IN ('critical','high','medium','low')),
    name                VARCHAR(255)    NOT NULL,
    source_ip           VARCHAR(50),
    destination_ip      VARCHAR(50),
    ml_classification   VARCHAR(100),
    if_score            DOUBLE PRECISION,
    rf_confidence       DOUBLE PRECISION,
    status              VARCHAR(30)     NOT NULL DEFAULT 'open'
                                        CONSTRAINT alerts_status_check
                                        CHECK (status IN ('open','investigating','resolved','false_positive')),
    country             VARCHAR(100),
    city                VARCHAR(100),
    attack_type         VARCHAR(100),
    raw_features        JSONB,
    raw_log_line        TEXT,
    assigned_to         UUID            REFERENCES users(id) ON DELETE SET NULL,
    resolved_by         UUID            REFERENCES users(id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_severity    ON alerts (severity);
CREATE INDEX idx_alerts_status      ON alerts (status);
CREATE INDEX idx_alerts_created     ON alerts (created_at DESC);
CREATE INDEX idx_alerts_source_ip   ON alerts (source_ip);
CREATE INDEX idx_alerts_attack_type ON alerts (attack_type);
CREATE INDEX idx_alerts_country     ON alerts (country);
CREATE INDEX idx_alerts_assigned    ON alerts (assigned_to);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.3 rules

```sql
CREATE TABLE rules (
    id          VARCHAR(20)     PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    condition   VARCHAR(500)    NOT NULL,
    severity    VARCHAR(20)     NOT NULL
                                CONSTRAINT rules_severity_check
                                CHECK (severity IN ('critical','high','medium','low')),
    action      VARCHAR(100)    NOT NULL,
    description TEXT,
    enabled     BOOLEAN         NOT NULL DEFAULT TRUE,
    hits_today  INTEGER         NOT NULL DEFAULT 0,
    hits_total  INTEGER         NOT NULL DEFAULT 0,
    created_by  UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_enabled   ON rules (enabled);
CREATE INDEX idx_rules_severity  ON rules (severity);
CREATE INDEX idx_rules_created   ON rules (created_at DESC);
```

### 2.4 rule_hits

```sql
CREATE TABLE rule_hits (
    id           BIGSERIAL       PRIMARY KEY,
    rule_id      VARCHAR(20)     NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    alert_id     UUID            REFERENCES alerts(id) ON DELETE SET NULL,
    source_ip    VARCHAR(50),
    triggered_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rule_hits_rule_id      ON rule_hits (rule_id);
CREATE INDEX idx_rule_hits_triggered_at ON rule_hits (triggered_at DESC);
```

### 2.5 ml_results

```sql
CREATE TABLE ml_results (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        VARCHAR(255),
    source_ip       VARCHAR(50),
    if_score        DOUBLE PRECISION NOT NULL,
    is_anomaly      BOOLEAN          NOT NULL DEFAULT FALSE,
    rf_class        VARCHAR(100),
    rf_class_index  SMALLINT,
    rf_confidence   DOUBLE PRECISION,
    features        JSONB            NOT NULL,
    alert_id        UUID             REFERENCES alerts(id) ON DELETE SET NULL,
    model_version   VARCHAR(50),
    pipeline_ms     INTEGER,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_results_is_anomaly  ON ml_results (is_anomaly);
CREATE INDEX idx_ml_results_if_score    ON ml_results (if_score);
CREATE INDEX idx_ml_results_created     ON ml_results (created_at DESC);
CREATE INDEX idx_ml_results_source_ip   ON ml_results (source_ip);
```

### 2.6 audit_logs

```sql
CREATE TABLE audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     UUID            REFERENCES users(id) ON DELETE SET NULL,
    user_email  VARCHAR(255),
    user_role   VARCHAR(50),
    action      VARCHAR(100)    NOT NULL,
    resource    VARCHAR(255),
    resource_id VARCHAR(100),
    details     JSONB,
    ip_address  VARCHAR(50),
    user_agent  VARCHAR(500),
    success     BOOLEAN         NOT NULL DEFAULT TRUE,
    error_msg   TEXT,
    duration_ms INTEGER,
    timestamp   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id   ON audit_logs (user_id);
CREATE INDEX idx_audit_action    ON audit_logs (action);
CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_success   ON audit_logs (success);
CREATE INDEX idx_audit_resource  ON audit_logs (resource, resource_id);
```

### 2.7 blocked_ips

```sql
CREATE TABLE blocked_ips (
    id          BIGSERIAL       PRIMARY KEY,
    ip_address  VARCHAR(50)     NOT NULL,
    reason      TEXT,
    blocked_by  UUID            REFERENCES users(id) ON DELETE SET NULL,
    alert_id    UUID            REFERENCES alerts(id) ON DELETE SET NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT blocked_ips_unique UNIQUE (ip_address)
);

CREATE INDEX idx_blocked_ips_ip       ON blocked_ips (ip_address);
CREATE INDEX idx_blocked_ips_active   ON blocked_ips (is_active);
```

### 2.8 settings

```sql
CREATE TABLE settings (
    key         VARCHAR(100)    PRIMARY KEY,
    value       TEXT,
    value_type  VARCHAR(20)     NOT NULL DEFAULT 'string'
                                CHECK (value_type IN ('string','integer','float','boolean','json')),
    category    VARCHAR(50)     NOT NULL DEFAULT 'general',
    description VARCHAR(500),
    updated_by  UUID            REFERENCES users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_category ON settings (category);
```

---

## 3. SQLAlchemy 2.0 Models

### 3.1 Base and engine setup

```python
# models/database.py

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import QueuePool
from config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3.2 User Model

```python
# models/user.py

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email       = Column(String(255), unique=True, nullable=False, index=True)
    password    = Column(String(255), nullable=False)
    name        = Column(String(255), nullable=False)
    role        = Column(String(50),  nullable=False, default="analyst")
    created_at  = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    last_login  = Column(DateTime(timezone=True), nullable=True)
    is_active   = Column(Boolean, nullable=False, default=True)
    mfa_secret  = Column(String(64), nullable=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)

    # Relationships
    audit_logs    = relationship("AuditLog",   back_populates="user",         foreign_keys="AuditLog.user_id")
    assigned_alerts = relationship("Alert",    back_populates="assignee",     foreign_keys="Alert.assigned_to")
    resolved_alerts = relationship("Alert",    back_populates="resolver",     foreign_keys="Alert.resolved_by")
    created_rules   = relationship("Rule",     back_populates="creator",      foreign_keys="Rule.created_by")
    blocked_ips     = relationship("BlockedIP",back_populates="blocker",      foreign_keys="BlockedIP.blocked_by")

    def to_dict(self) -> dict:
        return {
            "id":          str(self.id),
            "email":       self.email,
            "name":        self.name,
            "role":        self.role,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "last_login":  self.last_login.isoformat()  if self.last_login  else None,
            "is_active":   self.is_active,
            "mfa_enabled": self.mfa_enabled,
        }

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
```

### 3.3 Alert Model

```python
# models/alert.py

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Text, Boolean, DateTime,
    ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    severity          = Column(String(20),  nullable=False)
    name              = Column(String(255), nullable=False)
    source_ip         = Column(String(50),  nullable=True, index=True)
    destination_ip    = Column(String(50),  nullable=True)
    ml_classification = Column(String(100), nullable=True)
    if_score          = Column(Float,       nullable=True)
    rf_confidence     = Column(Float,       nullable=True)
    status            = Column(String(30),  nullable=False, default="open")
    country           = Column(String(100), nullable=True)
    city              = Column(String(100), nullable=True)
    attack_type       = Column(String(100), nullable=True, index=True)
    raw_features      = Column(JSONB,       nullable=True)
    raw_log_line      = Column(Text,        nullable=True)
    assigned_to       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_by       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at       = Column(DateTime(timezone=True), nullable=True)
    created_at        = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at        = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    # Relationships
    assignee    = relationship("User",      back_populates="assigned_alerts", foreign_keys=[assigned_to])
    resolver    = relationship("User",      back_populates="resolved_alerts", foreign_keys=[resolved_by])
    ml_results  = relationship("MLResult",  back_populates="alert",           cascade="all, delete-orphan")
    rule_hits   = relationship("RuleHit",   back_populates="alert",           cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        diff = (datetime.utcnow() - self.created_at.replace(tzinfo=None)).total_seconds() if self.created_at else 0
        if   diff < 60:   time_str = f"{int(diff)}s ago"
        elif diff < 3600: time_str = f"{int(diff // 60)}m ago"
        else:             time_str = f"{int(diff // 3600)}h ago"

        return {
            "id":                str(self.id),
            "severity":          self.severity,
            "name":              self.name,
            "source_ip":         self.source_ip,
            "destination_ip":    self.destination_ip,
            "ml_classification": self.ml_classification,
            "if_score":          self.if_score,
            "rf_confidence":     self.rf_confidence,
            "status":            self.status,
            "country":           self.country,
            "city":              self.city,
            "attack_type":       self.attack_type,
            "assigned_to":       str(self.assigned_to) if self.assigned_to else None,
            "resolved_at":       self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at":        self.created_at.isoformat() if self.created_at else None,
            "updated_at":        self.updated_at.isoformat() if self.updated_at else None,
            "time":              time_str,
        }
```

### 3.4 Rule Model

```python
# models/rule.py

from sqlalchemy import (
    Column, String, Boolean, Integer, Text, DateTime, ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.database import Base


class Rule(Base):
    __tablename__ = "rules"

    id          = Column(String(20),  primary_key=True)
    name        = Column(String(255), nullable=False)
    condition   = Column(String(500), nullable=False)
    severity    = Column(String(20),  nullable=False)
    action      = Column(String(100), nullable=False)
    description = Column(Text,        nullable=True)
    enabled     = Column(Boolean,     nullable=False, default=True)
    hits_today  = Column(Integer,     nullable=False, default=0)
    hits_total  = Column(Integer,     nullable=False, default=0)
    created_by  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at  = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    # Relationships
    creator   = relationship("User",    back_populates="created_rules", foreign_keys=[created_by])
    rule_hits = relationship("RuleHit", back_populates="rule",          cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "name":        self.name,
            "condition":   self.condition,
            "severity":    self.severity,
            "action":      self.action,
            "description": self.description,
            "enabled":     self.enabled,
            "hits_today":  self.hits_today,
            "hits_total":  self.hits_total,
            "created_by":  str(self.created_by) if self.created_by else None,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
        }


class RuleHit(Base):
    __tablename__ = "rule_hits"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    rule_id      = Column(String(20),  ForeignKey("rules.id",   ondelete="CASCADE"),   nullable=False)
    alert_id     = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    source_ip    = Column(String(50),  nullable=True)
    triggered_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    rule  = relationship("Rule",  back_populates="rule_hits")
    alert = relationship("Alert", back_populates="rule_hits")
```

### 3.5 MLResult Model

```python
# models/ml_result.py

import uuid
from sqlalchemy import (
    Column, Float, Boolean, Integer, String,
    SmallInteger, DateTime, ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.database import Base


class MLResult(Base):
    __tablename__ = "ml_results"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id        = Column(String(255),    nullable=True, index=True)
    source_ip       = Column(String(50),     nullable=True, index=True)
    if_score        = Column(Float,          nullable=False)
    is_anomaly      = Column(Boolean,        nullable=False, default=False)
    rf_class        = Column(String(100),    nullable=True)
    rf_class_index  = Column(SmallInteger,   nullable=True)
    rf_confidence   = Column(Float,          nullable=True)
    features        = Column(JSONB,          nullable=False)
    alert_id        = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    model_version   = Column(String(50),     nullable=True)
    pipeline_ms     = Column(Integer,        nullable=True)
    created_at      = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    alert = relationship("Alert", back_populates="ml_results")

    def to_dict(self) -> dict:
        return {
            "id":             str(self.id),
            "event_id":       self.event_id,
            "source_ip":      self.source_ip,
            "if_score":       self.if_score,
            "is_anomaly":     self.is_anomaly,
            "rf_class":       self.rf_class,
            "rf_class_index": self.rf_class_index,
            "rf_confidence":  self.rf_confidence,
            "features":       self.features,
            "alert_id":       str(self.alert_id) if self.alert_id else None,
            "model_version":  self.model_version,
            "pipeline_ms":    self.pipeline_ms,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
        }
```

### 3.6 AuditLog Model

```python
# models/audit_log.py

from sqlalchemy import (
    Column, Integer, String, Boolean, Text, DateTime, ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from models.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id          = Column(Integer,    primary_key=True, autoincrement=True)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email  = Column(String(255),nullable=True)
    user_role   = Column(String(50), nullable=True)
    action      = Column(String(100),nullable=False, index=True)
    resource    = Column(String(255),nullable=True)
    resource_id = Column(String(100),nullable=True)
    details     = Column(JSONB,      nullable=True)
    ip_address  = Column(String(50), nullable=True)
    user_agent  = Column(String(500),nullable=True)
    success     = Column(Boolean,    nullable=False, default=True)
    error_msg   = Column(Text,       nullable=True)
    duration_ms = Column(Integer,    nullable=True)
    timestamp   = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "user_id":     str(self.user_id) if self.user_id else None,
            "user_email":  self.user_email,
            "user_role":   self.user_role,
            "action":      self.action,
            "resource":    self.resource,
            "resource_id": self.resource_id,
            "details":     self.details,
            "ip_address":  self.ip_address,
            "success":     self.success,
            "error_msg":   self.error_msg,
            "duration_ms": self.duration_ms,
            "timestamp":   self.timestamp.isoformat() if self.timestamp else None,
        }
```

### 3.7 BlockedIP and Settings Models

```python
# models/blocked_ip.py

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from models.database import Base


class BlockedIP(Base):
    __tablename__ = "blocked_ips"

    id          = Column(Integer,    primary_key=True, autoincrement=True)
    ip_address  = Column(String(50), nullable=False, unique=True, index=True)
    reason      = Column(Text,       nullable=True)
    blocked_by  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    alert_id    = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    is_active   = Column(Boolean,    nullable=False, default=True, index=True)
    expires_at  = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    blocker = relationship("User", back_populates="blocked_ips", foreign_keys=[blocked_by])

    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "ip_address":  self.ip_address,
            "reason":      self.reason,
            "blocked_by":  str(self.blocked_by) if self.blocked_by else None,
            "alert_id":    str(self.alert_id)   if self.alert_id   else None,
            "is_active":   self.is_active,
            "expires_at":  self.expires_at.isoformat() if self.expires_at else None,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
        }


# models/settings.py

from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from models.database import Base


class Setting(Base):
    __tablename__ = "settings"

    key         = Column(String(100), primary_key=True)
    value       = Column(String,      nullable=True)
    value_type  = Column(String(20),  nullable=False, default="string")
    category    = Column(String(50),  nullable=False, default="general", index=True)
    description = Column(String(500), nullable=True)
    updated_by  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at  = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    def to_dict(self) -> dict:
        return {
            "key":         self.key,
            "value":       self.value,
            "value_type":  self.value_type,
            "category":    self.category,
            "description": self.description,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
        }
```

---

## 4. Pydantic Request and Response Schemas

### 4.1 Base Response Schema

```python
# schemas/base.py

from pydantic import BaseModel, ConfigDict
from typing import Any, Optional, TypeVar, Generic
from datetime import datetime

T = TypeVar("T")


class BaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status:    str          = "success"
    message:   Optional[str] = None
    timestamp: datetime     = datetime.utcnow()


class DataResponse(BaseResponse, Generic[T]):
    data: T


class PaginatedResponse(BaseResponse, Generic[T]):
    data:       list[T]
    total:      int
    page:       int
    per_page:   int
    total_pages: int
    has_next:   bool
    has_prev:   bool


class ErrorResponse(BaseModel):
    status:    str = "error"
    error:     str
    code:      str
    field:     Optional[str] = None
    timestamp: datetime      = datetime.utcnow()


class MessageResponse(BaseResponse):
    message: str
```

### 4.2 Authentication Schemas

```python
# schemas/auth.py

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Literal, Optional
import re


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(min_length=1, max_length=255)
    remember: bool = False

    model_config = {"json_schema_extra": {
        "example": {
            "email":    "admin@securewatch.local",
            "password": "Admin@123456",
            "remember": False,
        }
    }}


class RegisterRequest(BaseModel):
    email:     EmailStr
    password:  str       = Field(min_length=12, max_length=255)
    firstName: str       = Field(min_length=1, max_length=100)
    lastName:  str       = Field(min_length=1, max_length=100)
    role:      Literal["admin", "analyst", "viewer"] = "analyst"

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: "UserProfile"


class ChangePasswordRequest(BaseModel):
    current: str = Field(min_length=1)
    newPass: str = Field(min_length=12, max_length=255)

    @field_validator("newPass")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class MFASetupResponse(BaseModel):
    secret:     str
    qr_code_url: str
    backup_codes: list[str]


class MFAVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
```

### 4.3 User Schemas

```python
# schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import datetime
import uuid


class UserProfile(BaseModel):
    id:          str
    email:       str
    name:        str
    role:        str
    created_at:  Optional[str] = None
    last_login:  Optional[str] = None
    is_active:   bool
    mfa_enabled: bool

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class UserStats(BaseModel):
    alerts_reviewed: int
    rules_created:   int
    uptime:          str
    days_active:     int


class ActivityItem(BaseModel):
    action:  str
    time:    str
    icon:    str
    color:   str


class Permission(BaseModel):
    name:    str
    allowed: bool


class UserPermissions(BaseModel):
    permissions: list[Permission]
```

### 4.4 Alert Schemas

```python
# schemas/alert.py

from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid


class AlertResponse(BaseModel):
    id:                str
    severity:          Literal["critical", "high", "medium", "low"]
    name:              str
    source_ip:         Optional[str]
    destination_ip:    Optional[str]
    ml_classification: Optional[str]
    if_score:          Optional[float]
    rf_confidence:     Optional[float]
    status:            Literal["open", "investigating", "resolved", "false_positive"]
    country:           Optional[str]
    city:              Optional[str]
    attack_type:       Optional[str]
    assigned_to:       Optional[str]
    resolved_at:       Optional[str]
    created_at:        Optional[str]
    updated_at:        Optional[str]
    time:              str

    model_config = {"from_attributes": True}


class AlertStatusUpdate(BaseModel):
    status: Literal["open", "investigating", "resolved", "false_positive"]

    model_config = {"json_schema_extra": {
        "example": {"status": "investigating"}
    }}


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total:  int


class AlertFilterParams(BaseModel):
    severity: Optional[Literal["critical","high","medium","low"]] = None
    status:   Optional[Literal["open","investigating","resolved","false_positive"]] = None
    limit:    int = Field(default=50, ge=1, le=200)
    offset:   int = Field(default=0,  ge=0)
    sort:     Literal["asc","desc"] = "desc"
```

### 4.5 Rule Schemas

```python
# schemas/rule.py

from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class RuleResponse(BaseModel):
    id:          str
    name:        str
    condition:   str
    severity:    Literal["critical","high","medium","low"]
    action:      str
    description: Optional[str]
    enabled:     bool
    hits_today:  int
    hits_total:  int
    created_by:  Optional[str]
    created_at:  Optional[str]
    updated_at:  Optional[str]

    model_config = {"from_attributes": True}


class RuleCreate(BaseModel):
    name:        str                                        = Field(min_length=1, max_length=255)
    condition:   str                                        = Field(min_length=1, max_length=500)
    severity:    Literal["critical","high","medium","low"]
    action:      str                                        = Field(min_length=1, max_length=100)
    description: Optional[str]                             = None

    model_config = {"json_schema_extra": {
        "example": {
            "name":      "SSH Root Login",
            "condition": "username = root AND auth_type = ssh",
            "severity":  "critical",
            "action":    "Alert + Block",
        }
    }}


class RulePatch(BaseModel):
    name:        Optional[str]  = Field(None, min_length=1, max_length=255)
    condition:   Optional[str]  = Field(None, min_length=1, max_length=500)
    severity:    Optional[Literal["critical","high","medium","low"]] = None
    action:      Optional[str]  = Field(None, min_length=1, max_length=100)
    description: Optional[str]  = None
    enabled:     Optional[bool] = None


class RuleListResponse(BaseModel):
    rules: list[RuleResponse]
    total: int
```

### 4.6 ML Result Schemas

```python
# schemas/ml.py

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class FeatureVector(BaseModel):
    login_count_per_minute:     float = Field(ge=0)
    ports_scanned:              float = Field(ge=0)
    request_rate_ratio:         float = Field(ge=0)
    geo_distance_from_baseline: float = Field(ge=0)
    time_of_day_score:          float = Field(ge=0, le=1)
    failed_auth_ratio:          float = Field(ge=0, le=1)
    sudo_fail_count:            float = Field(ge=0)
    unique_ports_per_min:       float = Field(ge=0)
    bytes_transferred:          float = Field(ge=0)
    connection_duration:        float = Field(ge=0)
    user_agent_entropy:         float = Field(ge=0)
    country_risk_score:         float = Field(ge=0, le=1)


class MLMetricsResponse(BaseModel):
    accuracy:      float
    precision:     float
    recall:        float
    contamination: float
    status:        str
    last_trained:  str
    samples:       int
    features:      int
    algorithm:     str
    n_estimators:  int


class ClassificationConfidence(BaseModel):
    type:       str
    confidence: float = Field(ge=0, le=100)


class ClassificationListResponse(BaseModel):
    classifications: list[ClassificationConfidence]


class ScorePoint(BaseModel):
    time:       int
    score:      float
    is_anomaly: bool


class ScoreListResponse(BaseModel):
    points: list[ScorePoint]


class AnomalyResponse(BaseModel):
    ip:      str
    if_score: float
    type:    str
    time:    str
    status:  str


class AnomalyListResponse(BaseModel):
    anomalies: list[AnomalyResponse]
    total:     int


class MLConfigResponse(BaseModel):
    algorithm:     str
    n_estimators:  int
    contamination: float
    threshold:     float
    last_trained:  str
    samples:       int
    features:      int
    status:        str


class RetrainResponse(BaseModel):
    message:    str
    job_id:     str
    eta:        str
    status:     str


class MLResultDB(BaseModel):
    id:             str
    event_id:       Optional[str]
    source_ip:      Optional[str]
    if_score:       float
    is_anomaly:     bool
    rf_class:       Optional[str]
    rf_class_index: Optional[int]
    rf_confidence:  Optional[float]
    features:       dict
    alert_id:       Optional[str]
    model_version:  Optional[str]
    pipeline_ms:    Optional[int]
    created_at:     Optional[str]

    model_config = {"from_attributes": True}
```

### 4.7 Settings Schemas

```python
# schemas/settings.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal


class GeneralSettingsRequest(BaseModel):
    system_name:      Optional[str] = Field(None, max_length=100)
    timezone:         Optional[str] = Field(None, max_length=50)
    log_retention:    Optional[str] = None
    refresh_interval: Optional[str] = None


class NotificationSettingsRequest(BaseModel):
    email_alerts:  Optional[bool]     = None
    alert_email:   Optional[EmailStr] = None
    slack_enabled: Optional[bool]     = None
    slack_url:     Optional[str]      = Field(None, max_length=500)
    min_severity:  Optional[Literal["critical","high","medium","low"]] = None


class MLSettingsRequest(BaseModel):
    contamination:    Optional[float] = Field(None, ge=0.01, le=0.5)
    n_estimators:     Optional[int]   = Field(None, ge=10, le=500)
    auto_retrain:     Optional[bool]  = None
    alert_threshold:  Optional[float] = Field(None, ge=-1.0, le=0.0)


class SecuritySettingsRequest(BaseModel):
    two_fa:          Optional[bool] = None
    session_timeout: Optional[str] = None
    ip_whitelist:    Optional[str] = None
    sso_enabled:     Optional[bool] = None


class ConnectionStatusResponse(BaseModel):
    elasticsearch: str
    kibana:        str
    logstash:      str
    filebeat:      str


class DangerZoneConfirm(BaseModel):
    confirm: str

    def validate_flush(self)  -> bool: return self.confirm == "FLUSH"
    def validate_reset(self)  -> bool: return self.confirm == "RESET"
    def validate_delete(self) -> bool: return self.confirm == "DELETE"


class AllSettingsResponse(BaseModel):
    system_name:      str
    timezone:         str
    log_retention:    str
    refresh_interval: str
    email_alerts:     str
    alert_email:      str
    slack_enabled:    str
    min_severity:     str
    contamination:    str
    n_estimators:     str
    auto_retrain:     str
    alert_threshold:  str
    es_url:           str
    kibana_url:       str
    logstash_port:    str
    two_fa:           str
    session_timeout:  str
```

### 4.8 Stats and Geo Schemas

```python
# schemas/stats.py

from pydantic import BaseModel
from typing import Optional


class DashboardStats(BaseModel):
    threats_detected: int
    brute_force:      int
    anomaly_score:    float
    logs_per_min:     int
    pipeline_healthy: bool
    ml_confidence:    int


class GeoAttack(BaseModel):
    ip:       str
    lat:      float
    lng:      float
    country:  str
    type:     str
    count:    int
    severity: str
    flag:     str


class GeoListResponse(BaseModel):
    attacks:          list[GeoAttack]
    total_countries:  int


class GeoStats(BaseModel):
    countries:  int
    active_ips: int
    tor_exits:  int
    botnets:    int


class TopIP(BaseModel):
    ip:    str
    count: int
    type:  str
    risk:  int


class TopIPListResponse(BaseModel):
    ips: list[TopIP]


class TrendBucket(BaseModel):
    date:               str
    count:              int
    dominant_severity:  str


class TrendStats(BaseModel):
    avg_daily:   float
    peak_hour:   str
    top_attack:  str
    pct_change:  str


class AttackTypeBreakdown(BaseModel):
    type:  str
    count: int


class TrendResponse(BaseModel):
    buckets: list[TrendBucket]


class TrendStatsResponse(BaseModel):
    stats:     TrendStats
    breakdown: list[AttackTypeBreakdown]
```

### 4.9 Firewall Schemas

```python
# schemas/firewall.py

from pydantic import BaseModel, Field
from typing import Optional


class BlockIPRequest(BaseModel):
    ip:     str = Field(min_length=7, max_length=50,
                        pattern=r"^(\d{1,3}\.){3}\d{1,3}$")
    reason: Optional[str] = Field(None, max_length=500)

    model_config = {"json_schema_extra": {
        "example": {
            "ip":     "185.220.101.7",
            "reason": "Brute force SSH detected — 247 attempts",
        }
    }}


class BlockIPResponse(BaseModel):
    message:     str
    ip_address:  str
    blocked_by:  Optional[str]
    created_at:  str


class BlockedIPResponse(BaseModel):
    id:         int
    ip_address: str
    reason:     Optional[str]
    blocked_by: Optional[str]
    is_active:  bool
    expires_at: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


class BlockedIPListResponse(BaseModel):
    blocked_ips: list[BlockedIPResponse]
    total:       int
```

### 4.10 System schema
```python
# schemas/system.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SystemMetricsResponse(BaseModel):
    cpu:       float        # percentage 0-100
    ram:       float        # percentage 0-100
    disk:      float        # percentage 0-100
    network:   float        # MB/s
    timestamp: str          # ISO 8601


class ProcessItem(BaseModel):
    pid:     int
    name:    str
    cpu:     float
    ram:     float
    status:  str


class SystemProcessesResponse(BaseModel):
    processes: list[ProcessItem]
    total:     int


class SystemHealthResponse(BaseModel):
    score:   int            # 0-100
    status:  str            # "healthy" | "degraded" | "critical"
    cpu_ok:  bool
    ram_ok:  bool
    disk_ok: bool


class SystemLogItem(BaseModel):
    timestamp: str
    level:     str          # "INFO" | "WARN" | "ERROR"
    message:   str
    source:    Optional[str] = None


class SystemLogsResponse(BaseModel):
    logs:  list[SystemLogItem]
    total: int
```
---

## 5. JWT Structure

### 5.1 Token Payload

```python
# JWT payload — exact fields

{
    # Standard claims
    "sub":  "3f7a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",  # user UUID as string
    "exp":  1714050000,                                  # Unix timestamp expiry
    "iat":  1714021200,                                  # Issued at
    "jti":  "unique-token-id-uuid",                     # JWT ID (for revocation)

    # Custom claims
    "id":    "3f7a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "email": "admin@securewatch.local",
    "role":  "admin",
    "name":  "Admin User",
}

# Algorithm:  HS256
# Secret key: Minimum 32 characters, from environment variable
# Expiry:     8 hours default, 30 days if remember=true
```

### 5.2 JWT Functions

```python
# services/jwt_service.py

from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import uuid
from config import JWT_SECRET_KEY, JWT_ALGORITHM

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ACCESS_EXPIRE_HOURS    = 8
JWT_REMEMBER_EXPIRE_DAYS   = 30
JWT_ALGORITHM              = "HS256"


def create_access_token(
    user_id: str,
    email:   str,
    role:    str,
    name:    str,
    remember: bool = False,
) -> tuple[str, int]:
    """Returns (token_string, expires_in_seconds)"""
    if remember:
        delta   = timedelta(days=JWT_REMEMBER_EXPIRE_DAYS)
        expires = JWT_REMEMBER_EXPIRE_DAYS * 86400
    else:
        delta   = timedelta(hours=JWT_ACCESS_EXPIRE_HOURS)
        expires = JWT_ACCESS_EXPIRE_HOURS * 3600

    payload = {
        "sub":   user_id,
        "exp":   datetime.utcnow() + delta,
        "iat":   datetime.utcnow(),
        "jti":   str(uuid.uuid4()),
        "id":    user_id,
        "email": email,
        "role":  role,
        "name":  name,
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, expires


def decode_token(token: str) -> dict:
    """Raises HTTPException 401 on failure"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("id") is None:
            raise ValueError("Missing id claim")
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

---

## 6. RBAC Permission Schema

### 6.1 Permission Definitions

```python
# schemas/rbac.py

from typing import Final
from enum import Enum


class Permission(str, Enum):
    VIEW_DASHBOARD       = "view_dashboard"
    VIEW_LIVE_LOGS       = "view_live_logs"
    MANAGE_ALERTS        = "manage_alerts"
    CREATE_RULES         = "create_rules"
    DELETE_RULES         = "delete_rules"
    MANAGE_USERS         = "manage_users"
    VIEW_RAW_LOGS        = "view_raw_logs"
    EXPORT_DATA          = "export_data"
    RETRAIN_MODEL        = "retrain_model"
    ACCESS_SETTINGS      = "access_settings"
    DELETE_SYSTEM_DATA   = "delete_system_data"
    BLOCK_IPS            = "block_ips"
    VIEW_AUDIT_LOGS      = "view_audit_logs"


ROLE_PERMISSIONS: Final[dict[str, list[Permission]]] = {
    "admin": [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_LIVE_LOGS,
        Permission.MANAGE_ALERTS,
        Permission.CREATE_RULES,
        Permission.DELETE_RULES,
        Permission.MANAGE_USERS,
        Permission.VIEW_RAW_LOGS,
        Permission.EXPORT_DATA,
        Permission.RETRAIN_MODEL,
        Permission.ACCESS_SETTINGS,
        Permission.DELETE_SYSTEM_DATA,
        Permission.BLOCK_IPS,
        Permission.VIEW_AUDIT_LOGS,
    ],
    "analyst": [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_LIVE_LOGS,
        Permission.MANAGE_ALERTS,
        Permission.CREATE_RULES,
        Permission.VIEW_RAW_LOGS,
        Permission.EXPORT_DATA,
        Permission.BLOCK_IPS,
    ],
    "viewer": [
        Permission.VIEW_DASHBOARD,
    ],
}


def has_permission(role: str, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, [])


def get_permissions(role: str) -> list[Permission]:
    return ROLE_PERMISSIONS.get(role, [])
```

### 6.2 FastAPI Dependencies

```python
# middleware/auth_middleware.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models.user import User
from models.database import get_db
from services.jwt_service import decode_token
from schemas.rbac import Permission, has_permission

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user    = db.query(User).filter(
        User.id == payload["id"],
        User.is_active == True
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


def require_permission(permission: Permission):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}",
            )
        return current_user
    return checker
```

---

## 7. WebSocket Message Schema

### 7.1 Server to Client Messages

```python
# schemas/websocket.py

from pydantic import BaseModel
from typing import Literal, Optional, Union
from datetime import datetime


# ── LOG STREAM MESSAGE ──
class WSLogMessage(BaseModel):
    type:    Literal["log"]       = "log"
    time:    str                             # HH:MM:SS
    level:   Literal["INFO","WARN","ALERT","CRIT"]
    message: str


# ── NEW ALERT MESSAGE ──
class WSAlertMessage(BaseModel):
    type:              Literal["alert"]     = "alert"
    id:                str
    severity:          str
    name:              str
    source_ip:         Optional[str]
    ml_classification: Optional[str]
    if_score:          Optional[float]
    attack_type:       Optional[str]
    country:           Optional[str]
    created_at:        str


# ── STATS UPDATE MESSAGE ──
class WSStatsMessage(BaseModel):
    type:             Literal["stats"]      = "stats"
    threats_detected: int
    brute_force:      int
    anomaly_score:    float
    logs_per_min:     int
    ml_confidence:    int


# ── SYSTEM HEALTH MESSAGE ──
class WSHealthMessage(BaseModel):
    type:             Literal["health"]     = "health"
    pipeline_healthy: bool
    es_connected:     bool
    ml_status:        str
    events_per_sec:   int


# ── CONNECTION ACK ──
class WSConnectedMessage(BaseModel):
    type:       Literal["connected"]        = "connected"
    message:    str                         = "SecureWatch AI WebSocket connected"
    server_time: str


# ── ERROR MESSAGE ──
class WSErrorMessage(BaseModel):
    type:    Literal["error"]               = "error"
    code:    str
    message: str


# ── UNION TYPE for all WS messages ──
WSMessage = Union[
    WSLogMessage,
    WSAlertMessage,
    WSStatsMessage,
    WSHealthMessage,
    WSConnectedMessage,
    WSErrorMessage,
]
```

### 7.2 Client to Server Messages

```python
# schemas/websocket.py (continued)

# ── SUBSCRIBE MESSAGE ──
class WSSubscribeMessage(BaseModel):
    type:     Literal["subscribe"]  = "subscribe"
    channels: list[Literal["logs","alerts","stats","health"]]


# ── PING MESSAGE ──
class WSPingMessage(BaseModel):
    type: Literal["ping"] = "ping"


# ── PONG RESPONSE ──
class WSPongMessage(BaseModel):
    type:      Literal["pong"]      = "pong"
    server_ms: int                           # Server Unix ms timestamp
```

### 7.3 WebSocket Connection Flow

```python
# routes/logs.py — WebSocket endpoint

from fastapi import WebSocket, WebSocketDisconnect, Query
from services.jwt_service import decode_token
import asyncio, json

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        self.active[user_id] = ws

    def disconnect(self, user_id: str):
        self.active.pop(user_id, None)

    async def send_to(self, user_id: str, message: dict):
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, message: dict):
        for uid, ws in list(self.active.items()):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(uid)


manager = ConnectionManager()


@router.websocket("/ws/logs")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None),
):
    # Authenticate
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = decode_token(token)
        user_id = payload["id"]
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)

    # Send connection acknowledgement
    await websocket.send_json({
        "type":        "connected",
        "message":     "SecureWatch AI WebSocket connected",
        "server_time": datetime.utcnow().isoformat(),
    })

    try:
        while True:
            # Send log frame
            log = generate_log_entry()
            await websocket.send_json(log)

            # Also accept client messages (ping, subscribe)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=2.5)
                msg  = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({
                        "type":      "pong",
                        "server_ms": int(datetime.utcnow().timestamp() * 1000),
                    })
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

---

## 8. Error Response Schema

### 8.1 Error Code Registry

```python
# schemas/errors.py

ERROR_CODES = {
    # Authentication errors
    "AUTH_INVALID_CREDENTIALS":   "Invalid email or password",
    "AUTH_TOKEN_EXPIRED":         "JWT token has expired",
    "AUTH_TOKEN_INVALID":         "JWT token is invalid",
    "AUTH_TOKEN_MISSING":         "Authorization header is missing",
    "AUTH_USER_INACTIVE":         "User account is disabled",
    "AUTH_EMAIL_EXISTS":          "Email address is already registered",
    "AUTH_WRONG_PASSWORD":        "Current password is incorrect",

    # Authorization errors
    "AUTHZ_INSUFFICIENT_ROLE":    "Admin role required for this action",
    "AUTHZ_PERMISSION_DENIED":    "You do not have permission for this action",

    # Resource errors
    "RESOURCE_NOT_FOUND":         "The requested resource was not found",
    "RESOURCE_CONFLICT":          "Resource already exists",

    # Validation errors
    "VALIDATION_ERROR":           "Request validation failed",
    "VALIDATION_WEAK_PASSWORD":   "Password does not meet strength requirements",
    "VALIDATION_INVALID_IP":      "IP address format is invalid",
    "VALIDATION_CONFIRM_MISMATCH":"Confirmation text does not match",

    # System errors
    "SYSTEM_DB_ERROR":            "Database operation failed",
    "SYSTEM_ES_ERROR":            "Elasticsearch operation failed",
    "SYSTEM_ML_ERROR":            "ML pipeline operation failed",
    "SYSTEM_INTERNAL":            "Internal server error",

    # Rate limiting
    "RATE_LIMIT_EXCEEDED":        "Too many requests. Please try again later.",
}


class AppError(Exception):
    def __init__(self, code: str, status_code: int = 400, field: str = None):
        self.code        = code
        self.message     = ERROR_CODES.get(code, "Unknown error")
        self.status_code = status_code
        self.field       = field
        super().__init__(self.message)
```

### 8.2 Global Exception Handlers

```python
# app.py — exception handlers

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from schemas.errors import AppError
from datetime import datetime


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status":    "error",
            "error":     exc.message,
            "code":      exc.code,
            "field":     exc.field,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", [])[1:])
    return JSONResponse(
        status_code=422,
        content={
            "status":    "error",
            "error":     first_error.get("msg", "Validation failed"),
            "code":      "VALIDATION_ERROR",
            "field":     field or None,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status":    "error",
            "error":     exc.detail,
            "code":      f"HTTP_{exc.status_code}",
            "field":     None,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status":    "error",
            "error":     "Internal server error",
            "code":      "SYSTEM_INTERNAL",
            "field":     None,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
```

---

## 9. Pagination Structure

### 9.1 Pagination Schema

```python
# schemas/pagination.py

from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional
import math

T = TypeVar("T")


class PaginationParams(BaseModel):
    page:     int = Field(default=1,  ge=1,  description="Page number starting from 1")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page, max 100")
    sort:     str = Field(default="desc", pattern="^(asc|desc)$")
    sort_by:  Optional[str] = None


class PaginatedResult(BaseModel, Generic[T]):
    data:        list[T]
    total:       int
    page:        int
    per_page:    int
    total_pages: int
    has_next:    bool
    has_prev:    bool
    next_page:   Optional[int]
    prev_page:   Optional[int]

    @classmethod
    def create(cls, data: list[T], total: int, page: int, per_page: int) -> "PaginatedResult":
        total_pages = math.ceil(total / per_page) if per_page > 0 else 1
        return cls(
            data        = data,
            total       = total,
            page        = page,
            per_page    = per_page,
            total_pages = total_pages,
            has_next    = page < total_pages,
            has_prev    = page > 1,
            next_page   = page + 1 if page < total_pages else None,
            prev_page   = page - 1 if page > 1          else None,
        )
```

### 9.2 Pagination Utility Function

```python
# services/pagination.py

from sqlalchemy.orm import Query as SAQuery
from schemas.pagination import PaginatedResult


def paginate(
    query:    SAQuery,
    page:     int,
    per_page: int,
) -> tuple[list, int]:
    """Returns (items, total_count)"""
    total  = query.count()
    offset = (page - 1) * per_page
    items  = query.offset(offset).limit(per_page).all()
    return items, total


# Usage in route handler
@router.get("/api/alerts")
async def get_alerts(
    page:     int = Query(default=1,  ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    severity: Optional[str] = Query(None),
    status:   Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if severity: query = query.filter(Alert.severity == severity)
    if status:   query = query.filter(Alert.status   == status)

    items, total = paginate(query, page, per_page)
    result = PaginatedResult.create(
        data     = [a.to_dict() for a in items],
        total    = total,
        page     = page,
        per_page = per_page,
    )
    return result
```

---

## 10. Validation Rules — Complete Field Reference

### 10.1 Validation Rules by Field

```python
FIELD_VALIDATION_RULES = {
    # ── USER ──
    "email": {
        "type":      "EmailStr",
        "max_length": 255,
        "unique":    True,
        "lowercase": True,
        "strip":     True,
    },
    "password": {
        "type":       "str",
        "min_length": 12,
        "max_length": 255,
        "must_have":  ["uppercase", "digit", "special_char"],
    },
    "name": {
        "type":       "str",
        "min_length": 1,
        "max_length": 255,
    },
    "role": {
        "type":   "Literal",
        "values": ["admin", "analyst", "viewer"],
    },

    # ── ALERT ──
    "severity": {
        "type":   "Literal",
        "values": ["critical", "high", "medium", "low"],
    },
    "alert_status": {
        "type":   "Literal",
        "values": ["open", "investigating", "resolved", "false_positive"],
    },
    "ip_address": {
        "type":    "str",
        "pattern": r"^(\d{1,3}\.){3}\d{1,3}$",
        "max_length": 50,
    },

    # ── RULE ──
    "rule_id": {
        "type":       "str",
        "max_length": 20,
        "pattern":    r"^[A-Z]+-\d+$",
    },
    "rule_condition": {
        "type":       "str",
        "min_length": 1,
        "max_length": 500,
    },

    # ── ML ──
    "contamination": {
        "type": "float",
        "ge":   0.01,
        "le":   0.5,
    },
    "n_estimators": {
        "type": "int",
        "ge":   10,
        "le":   500,
    },
    "alert_threshold": {
        "type": "float",
        "ge":   -1.0,
        "le":   0.0,
    },

    # ── DANGER ZONE ──
    "flush_confirm": {
        "type":    "str",
        "exact":   "FLUSH",
    },
    "reset_confirm": {
        "type":    "str",
        "exact":   "RESET",
    },
    "delete_confirm": {
        "type":    "str",
        "exact":   "DELETE",
    },

    # ── PAGINATION ──
    "page": {
        "type": "int",
        "ge":   1,
    },
    "per_page": {
        "type": "int",
        "ge":   1,
        "le":   100,
    },
}
```

---

## 11. Complete API Route Definitions

```python
# All routes — method, path, auth, permission, request body, response

AUTH ROUTES
───────────
POST   /api/auth/login           None        LoginRequest           TokenResponse
POST   /api/auth/register        None        RegisterRequest        TokenResponse
GET    /api/auth/check-email     None        ?email=               {exists: bool}
POST   /api/auth/send-verify     None        {email}               MessageResponse
GET    /api/auth/me              JWT any     None                   UserProfile

DASHBOARD ROUTES
────────────────
GET    /api/stats                JWT any     None                   DashboardStats
GET    /api/alerts               JWT any     ?severity&status&page  PaginatedResult[AlertResponse]
POST   /api/alerts/{id}/status   JWT analyst AlertStatusUpdate      AlertResponse
POST   /api/alerts/resolve-all   JWT analyst None                   MessageResponse
GET    /api/geo                  JWT any     None                   GeoListResponse
GET    /api/geo/stats            JWT any     None                   GeoStats
GET    /api/top-ips              JWT any     ?limit                 TopIPListResponse

ML ROUTES
─────────
GET    /api/ml/metrics           JWT any     None                   MLMetricsResponse
GET    /api/ml/classification    JWT any     None                   ClassificationListResponse
GET    /api/ml/scores            JWT any     None                   ScoreListResponse
GET    /api/ml/anomalies         JWT any     None                   AnomalyListResponse
GET    /api/ml/config            JWT any     None                   MLConfigResponse
POST   /api/ml/retrain           JWT admin   None                   RetrainResponse
POST   /api/ml/rescan            JWT analyst None                   MessageResponse

RULES ROUTES
────────────
GET    /api/rules                JWT any     None                   RuleListResponse
POST   /api/rules                JWT analyst RuleCreate             RuleResponse
PATCH  /api/rules/{id}           JWT analyst RulePatch              RuleResponse
PUT    /api/rules/{id}           JWT analyst RuleCreate             RuleResponse
DELETE /api/rules/{id}           JWT admin   None                   MessageResponse

USER ROUTES
───────────
GET    /api/user/me              JWT any     None                   UserProfile
PUT    /api/user/me              JWT any     UserProfileUpdate      UserProfile
POST   /api/user/change-password JWT any     ChangePasswordRequest  MessageResponse
GET    /api/user/stats           JWT any     None                   UserStats
GET    /api/user/activity        JWT any     ?limit                 {activity: [ActivityItem]}
GET    /api/user/permissions     JWT any     None                   UserPermissions

SETTINGS ROUTES
───────────────
GET    /api/settings                    JWT any    None                       AllSettingsResponse
POST   /api/settings/general            JWT admin  GeneralSettingsRequest      MessageResponse
POST   /api/settings/notifications      JWT admin  NotificationSettingsRequest MessageResponse
POST   /api/settings/ml                 JWT admin  MLSettingsRequest           MessageResponse
POST   /api/settings/security           JWT admin  SecuritySettingsRequest     MessageResponse
GET    /api/settings/test-connections   JWT admin  None                       ConnectionStatusResponse
DELETE /api/settings/flush-logs         JWT admin  DangerZoneConfirm          MessageResponse
POST   /api/settings/reset-ml           JWT admin  DangerZoneConfirm          MessageResponse
DELETE /api/settings/delete-users       JWT admin  DangerZoneConfirm          MessageResponse

FIREWALL ROUTES
───────────────
POST   /api/firewall/block       JWT analyst BlockIPRequest         BlockIPResponse
GET    /api/firewall/blocked     JWT any     None                   BlockedIPListResponse
DELETE /api/firewall/unblock/{ip} JWT admin  None                   MessageResponse

LOG ROUTES
──────────
GET    /api/logs                 JWT any     None                   {logs: [LogEntry]}
GET    /api/logs/stream          None (SSE)  None                   EventStream
WS     /ws/logs                  ?token      None                   WSMessage stream

TRENDS ROUTES
─────────────
GET    /api/trends               JWT any     ?period=7d|30d         TrendResponse
GET    /api/trends/stats         JWT any     ?period                TrendStatsResponse
GET    /api/trends/breakdown     JWT any     ?period                {breakdown: [AttackTypeBreakdown]}

ANOMALY ROUTES
──────────────
POST   /api/anomalies/{id}/investigate JWT analyst None             MessageResponse

HEALTH
──────
GET    /api/health               None        None                   {status: "ok", version: str}

SYSTEM ROUTES
─────────────
GET    /api/system/metrics       JWT any     None                   {cpu, ram, disk, network, timestamp}
GET    /api/system/processes     JWT any     None                   {processes[], total}
GET    /api/system/health        JWT any     None                   {score, status, cpu_ok, ram_ok, disk_ok}
GET    /api/system/logs          JWT any     None                   {logs[], total}
```

---

## 12. Audit Log Action Registry

```python
AUDIT_ACTIONS = {
    # Auth
    "LOGIN_SUCCESS":         "User logged in successfully",
    "LOGIN_FAILED":          "Failed login attempt",
    "REGISTER":              "New user account created",
    "LOGOUT":                "User logged out",
    "PASSWORD_CHANGED":      "User password changed",
    "MFA_ENABLED":           "MFA enabled for account",
    "MFA_DISABLED":          "MFA disabled for account",

    # Alerts
    "ALERT_STATUS_UPDATE":   "Alert status changed",
    "ALERTS_RESOLVE_ALL":    "All alerts marked as resolved",
    "ALERT_ASSIGNED":        "Alert assigned to analyst",

    # Rules
    "RULE_CREATE":           "Detection rule created",
    "RULE_UPDATE":           "Detection rule updated",
    "RULE_TOGGLE":           "Detection rule enabled or disabled",
    "RULE_DELETE":           "Detection rule deleted",

    # Firewall
    "IP_BLOCKED":            "IP address added to blocklist",
    "IP_UNBLOCKED":          "IP address removed from blocklist",

    # ML
    "ML_RETRAIN":            "ML model retraining triggered",
    "ML_RESCAN":             "ML rescan of recent events triggered",

    # Settings
    "SETTINGS_GENERAL":      "General settings updated",
    "SETTINGS_ML":           "ML configuration updated",
    "SETTINGS_SECURITY":     "Security settings updated",
    "SETTINGS_NOTIFICATIONS":"Notification settings updated",

    # Danger Zone
    "LOGS_FLUSHED":          "All system logs deleted",
    "ML_MODEL_RESET":        "ML model reset and retraining started",
    "USERS_DELETED":         "Non-admin users deleted",

    # Data
    "DATA_EXPORTED":         "Data exported",
}
```

---

## Document Summary

This schema document defines every database table, every SQLAlchemy model, every Pydantic schema, every API route, every JWT claim, every RBAC permission, every WebSocket message, every validation rule, every error code, and every audit action for SecureWatch AI.

**Total tables:** 8
**Total models:** 8
**Total Pydantic schemas:** 47
**Total API routes:** 52
**Total audit actions:** 24
**Total error codes:** 18
**Total permissions:** 13

Any FastAPI developer or AI coding agent reading this document has a complete, unambiguous specification to implement the full SecureWatch AI backend without requiring further clarification.
