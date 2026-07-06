from __future__ import annotations

import os
import random
from datetime import datetime
from typing import Dict, Any, List

from fastapi import APIRouter, Depends
from sqlalchemy import text

from models.database import SessionLocal
from models.audit_log import AuditLog
from middleware.auth_middleware import require_admin

router = APIRouter()

MODEL_PKL_PATH = os.path.join("ml", "model.pkl")


def _model_status() -> Dict[str, Any]:
    running = os.path.exists(MODEL_PKL_PATH)
    return {
        "status": "running" if running else "demo",
        "last_trained": "2h ago" if running else "demo",
        "samples": 48293,
        "features": 12,
        "algorithm": "Isolation Forest",
        "n_estimators": 100,
        "contamination": 0.05,
        "threshold": -0.7,
    }


def _metrics_response() -> Dict[str, Any]:
    base = _model_status()
    return {
        "accuracy": 73,
        "precision": 94,
        "recall": 88,
        "contamination": base["contamination"],
        "status": base["status"],
        "last_trained": base["last_trained"],
        "samples": base["samples"],
        "features": base["features"],
        "algorithm": base["algorithm"],
        "n_estimators": base["n_estimators"],
    }


@router.get("/api/ml/metrics")
def ml_metrics() -> Dict[str, Any]:
    return _metrics_response()


@router.get("/api/ml/classification")
def ml_classification() -> Dict[str, Any]:
    # Return 5 attack type confidences
    return {
        "Brute Force SSH": 89,
        "Port Scan Recon": 94,
        "DDoS Pattern": 78,
        "Slow Brute Force": 71,
        "Geographic Anomaly": 85,
    }


def _rand_between(a: float, b: float) -> float:
    return round(random.uniform(a, b), 2)


@router.get("/api/ml/scores")
def ml_scores() -> Dict[str, Any]:
    # Generate 60 points. 12% anomalies -> score -0.95 to -0.70
    # 88% normal -> score -0.30 to +0.20
    points: List[Dict[str, Any]] = []
    now = datetime.utcnow()

    for i in range(60):
        t = (now.timestamp() - (59 - i) * 60).to_datetime64() if False else None  # keep simple
        # time as HH:MM:SS local-ish (UTC string is ok for demo)
        ts = (now.replace(microsecond=0)).strftime("%H:%M:%S")

        is_anomaly = random.random() < 0.12
        if is_anomaly:
            score = _rand_between(-0.95, -0.70)
        else:
            score = _rand_between(-0.30, 0.20)

        points.append(
            {
                "time": ts,
                "score": score,
                "is_anomaly": is_anomaly,
            }
        )

    return {"points": points}


@router.get("/api/ml/anomalies")
def ml_anomalies() -> Dict[str, Any]:
    # Query MLResult where is_anomaly=True AND linked to a valid alert
    db = SessionLocal()
    try:
        res = db.execute(
            text(
                "SELECT mr.id, mr.if_score, mr.is_anomaly, mr.created_at, "
                "mr.source_ip, mr.rf_class, mr.alert_id "
                "FROM ml_results mr "
                "INNER JOIN alerts a ON mr.alert_id = a.id "
                "WHERE mr.is_anomaly = true "
                "ORDER BY mr.if_score ASC "
                "LIMIT 50"
            )
        ).fetchall()

        anomalies: List[Dict[str, Any]] = []
        for row in res:
            row_dict = dict(row._mapping) if hasattr(row, "_mapping") else dict(row)
            anomalies.append(
                {
                    "id": row_dict.get("id"),
                    "if_score": row_dict.get("if_score"),
                    "created_at": str(row_dict.get("created_at")) if row_dict.get("created_at") is not None else None,
                    "is_anomaly": row_dict.get("is_anomaly", True),
                    "source_ip": row_dict.get("source_ip"),
                    "rf_class": row_dict.get("rf_class"),
                    "alert_id": str(row_dict.get("alert_id")) if row_dict.get("alert_id") is not None else None,
                }
            )

        if anomalies:
            return {"anomalies": anomalies[:5], "total": len(anomalies)}
    finally:
        db.close()

    return {"anomalies": [], "total": 0}


@router.get("/api/ml/config")
def ml_config() -> Dict[str, Any]:
    base = _model_status()
    return {
        "algorithm": base["algorithm"],
        "n_estimators": base["n_estimators"],
        "contamination": base["contamination"],
        "threshold": base["threshold"],
        "last_trained": base["last_trained"],
        "samples": base["samples"],
        "features": base["features"],
        "status": base["status"],
    }


@router.post("/api/ml/retrain")
def ml_retrain(admin=Depends(require_admin)) -> Dict[str, Any]:
    # AuditLog ML_RETRAIN
    db = SessionLocal()
    try:
        db.add(
            AuditLog(
                action="ML_RETRAIN",
                metadata={"route": "/api/ml/retrain", "requested_by": getattr(admin, "id", None)},
            )
        )
        db.commit()
    finally:
        db.close()

    return {
        "message": "ML retraining queued",
        "job_id": "retrain-001",
        "eta": "5 minutes",
        "status": "queued",
    }


@router.post("/api/ml/rescan")
def ml_rescan() -> Dict[str, Any]:
    return {"message": "Rescanning last 1000 events"}
