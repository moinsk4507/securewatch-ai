from __future__ import annotations

import numpy as np

# IMPORTANT: Must match FEATURE_NAMES (12 strings) from SCHEMA.md in exact order.
FEATURE_NAMES = [
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
]


def extract_features(log_event: dict) -> np.ndarray:
    """Extract a single 12-dim feature vector from a log_event.

    Rules:
    - each feature from dict or default 0.0
    - convert all to float
    - clip to [0, 1e6]
    - return shape (1, 12)
    """
    vec = []
    for name in FEATURE_NAMES:
        val = log_event.get(name, 0.0)
        try:
            f = float(val)
        except Exception:
            f = 0.0
        f = float(np.clip(f, 0.0, 1e6))
        vec.append(f)
    return np.array(vec, dtype=float).reshape(1, 12)

