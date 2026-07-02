from __future__ import annotations

import time
from typing import Any

import joblib
import numpy as np

from ml.feature_extraction import extract_features


_model = None
_classifier = None
_class_names = None


def load_models() -> None:
    global _model, _classifier, _class_names
    if _model is not None and _classifier is not None:
        return

    _model = joblib.load("ml/model.pkl")
    bundle = joblib.load("ml/classifier.pkl")
    _classifier = bundle["model"]
    _class_names = bundle.get("class_names")


def score_event(log_event: dict) -> dict | None:
    """Return ML score info or None if not anomalous enough.

    Uses model.predict() which respects contamination=0.05 setting.
    -1 means anomaly, 1 means normal.
    """
    load_models()

    start_ms = int(time.time() * 1000)

    features = extract_features(log_event)  # (1, 12)
    if_score = float(_model.decision_function(features)[0])
    prediction = _model.predict(features)[0]

    if prediction != -1:
        return None

    class_idx = int(_classifier.predict(features)[0])

    proba = _classifier.predict_proba(features)[0]
    if class_idx >= len(proba):
        confidence = 0.0
    else:
        confidence = float(proba[class_idx] * 100)

    rf_class = _class_names[class_idx] if _class_names else str(class_idx)

    elapsed = int(time.time() * 1000) - start_ms

    # Convert features into dict to match API requirements (json-serializable)
    # extract_features already clips floats.
    feature_dict = {name: float(val) for name, val in zip(
        [
            "login_count_per_minute",
            "ports_scanned",
            "request_rate_ratio",
            "geo_distance_from_baseline",
            "time_of_day_score",
            "failed_auth_ratio",
            "sudo_fail_count",
            "unique_ports_per_min",
            "bytes_transferred",
            "connection_duration",
            "user_agent_entropy",
            "country_risk_score",
        ],
        features.reshape(-1).tolist(),
    )}

    return {
        "if_score": if_score,
        "is_anomaly": True,
        "rf_class": rf_class,
        "rf_class_index": class_idx,
        "rf_confidence": confidence,
        "features": feature_dict,
        "pipeline_ms": elapsed,
    }

