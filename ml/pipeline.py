from __future__ import annotations

import time
from datetime import datetime, timezone

from sqlalchemy import text

from ml.predict import score_event


def run_pipeline() -> None:
    """Continuously score unscored ES events and create alerts in Postgres.

    NOTE: This project currently uses ES for logs/events. This function will:
    - fetch unscored events from ES (ml_scored=false)
    - score each event
    - if anomaly: determine severity and insert into Postgres alerts + ml_results
    - mark ml_scored=true in ES

    The ES and event fetching wiring is intentionally minimal because existing
    route code may already simulate ML engine behavior.
    """

    # Lazy imports to avoid hard dependency during unit tests.
    from models.database import SessionLocal

    # We will attempt ES access only if environment has ES configured.
    try:
        from backend.utils.system_monitor import get_es_client  # type: ignore
    except Exception:
        get_es_client = None

    print("ML Pipeline started")

    db = SessionLocal()
    try:
        while True:
            start = time.time()

            # If ES client isn't available, exit gracefully (demo mode)
            if not get_es_client:
                time.sleep(5)
                continue

            es = get_es_client()
            if es is None:
                time.sleep(5)
                continue

            # Fetch unscored events
            # Expected index/mapping from existing system monitor / log generator.
            # We use a generic query; adapt if ES index differs.
            try:
                res = es.search(
                    index="logs-*",
                    body={
                        "size": 50,
                        "query": {"term": {"ml_scored": False}},
                        "sort": [{"@timestamp": {"order": "asc"}}],
                    },
                )
            except Exception:
                time.sleep(5)
                continue

            hits = res.get("hits", {}).get("hits", [])

            for hit in hits:
                source = hit.get("_source", {})
                score_result = score_event(source)
                if not score_result:
                    # Still mark as scored to avoid rescoring loops
                    try:
                        es.update(index=hit.get("_index"), id=hit.get("_id"), body={"doc": {"ml_scored": True}})
                    except Exception:
                        pass
                    continue

                if_score = score_result["if_score"]

                if if_score < -0.85:
                    severity = "critical"
                elif -0.85 <= if_score < -0.75:
                    severity = "high"
                else:
                    severity = "medium"

                created_at = datetime.now(timezone.utc)

                # Create Alert in Postgres
                alert_name = f"ML Alert: {score_result['rf_class']}"
                status = "open"
                attack_type = score_result["rf_class"]

                alert_row = db.execute(
                    text(
                        """
                        INSERT INTO alerts(
                            severity, name, source_ip, destination_ip, ml_classification, if_score, rf_confidence,
                            status, country, city, attack_type, raw_features, raw_log_line, created_at
                        )
                        VALUES (
                            :severity, :name, :source_ip, :destination_ip, :ml_classification, :if_score, :rf_confidence,
                            :status, :country, :city, :attack_type, :raw_features, :raw_log_line, :created_at
                        )
                        RETURNING id
                        """
                    ),
                    {
                        "severity": severity,
                        "name": alert_name,
                        "source_ip": source.get("source_ip") or source.get("ip"),
                        "destination_ip": source.get("destination_ip"),
                        "ml_classification": score_result["rf_class"],
                        "if_score": float(score_result["if_score"]),
                        "rf_confidence": float(score_result["rf_confidence"]),
                        "status": status,
                        "country": source.get("country"),
                        "city": source.get("city"),
                        "attack_type": attack_type,
                        "raw_features": score_result["features"],
                        "raw_log_line": source.get("message") or source.get("log"),
                        "created_at": created_at,
                    },
                ).fetchone()

                alert_id = alert_row[0] if alert_row else None

                # Create MLResult in Postgres
                db.execute(
                    text(
                        """
                        INSERT INTO ml_results(
                            event_id, source_ip, if_score, is_anomaly, rf_class, rf_class_index, rf_confidence,
                            features, alert_id, model_version, pipeline_ms, created_at
                        )
                        VALUES (
                            :event_id, :source_ip, :if_score, true, :rf_class, :rf_class_index, :rf_confidence,
                            :features, :alert_id, :model_version, :pipeline_ms, :created_at
                        )
                        """
                    ),
                    {
                        "event_id": source.get("event_id") or source.get("_id"),
                        "source_ip": source.get("source_ip") or source.get("ip"),
                        "if_score": float(score_result["if_score"]),
                        "rf_class": score_result["rf_class"],
                        "rf_class_index": int(score_result["rf_class_index"]),
                        "rf_confidence": float(score_result["rf_confidence"]),
                        "features": score_result["features"],
                        "alert_id": alert_id,
                        "model_version": "isoforest+rf_v1",
                        "pipeline_ms": int(score_result["pipeline_ms"]),
                        "created_at": created_at,
                    },
                )

                try:
                    es.update(index=hit.get("_index"), id=hit.get("_id"), body={"doc": {"ml_scored": True}})
                except Exception:
                    pass

                db.commit()

                print(f"Alert created: {alert_name} | score={score_result['if_score']}")

            # Sleep 5 seconds
            elapsed = time.time() - start
            time.sleep(max(0.0, 5.0 - elapsed))

    finally:
        db.close()

