from __future__ import annotations

import csv
import os
import random
import sys
from pathlib import Path

import numpy as np

# Allow running this file directly (e.g. `python ml/generate_training_data.py`
# or `python ./ml/generate_training_data.py`) without ModuleNotFoundError.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.feature_extraction import FEATURE_NAMES


CLASS_NAMES = [
    "Brute Force SSH",
    "Port Scan / Recon",
    "DDoS Pattern",
    "Slow Brute Force",
    "Geographic Anomaly",
    "Privilege Escalation",
]

# Keep labels/features linearly separable enough for RandomForest.
# We’ll generate class-specific signals with low overlap. 


def _clip(v: float, lo: float, hi: float) -> float:
    return float(np.clip(v, lo, hi))


def _normal_row(rng: random.Random) -> list[float]:
    # Realistic normal ranges
    return [
        _clip(rng.uniform(0, 60), 0, 1e6),  # login_count_per_minute
        _clip(rng.uniform(0, 25), 0, 1e6),  # ports_scanned
        _clip(rng.uniform(0, 2.5), 0, 1e6),  # request_rate_ratio
        _clip(rng.uniform(0, 2500), 0, 1e6),  # geo_distance_from_baseline
        _clip(rng.uniform(0, 1), 0, 1),  # time_of_day_score
        _clip(rng.uniform(0, 0.35), 0, 1e6),  # failed_auth_ratio
        _clip(rng.uniform(0, 1), 0, 1e6),  # sudo_fail_count
        _clip(rng.uniform(0, 15), 0, 1e6),  # unique_ports_per_min
        _clip(rng.uniform(5e5, 3e7), 0, 1e6),  # bytes_transferred (note clip)
        _clip(rng.uniform(0.1, 10), 0, 1e6),  # connection_duration
        _clip(rng.uniform(0.1, 0.6), 0, 1),  # user_agent_entropy
        _clip(rng.uniform(0.05, 0.6), 0, 1),  # country_risk_score
    ]


def _attack_row(rng: random.Random, class_name: str) -> list[float]:
    # Realistic attack feature ranges per class
    base = _normal_row(rng)

    # Mutate base according to class
    if class_name == "Brute Force SSH":
        base[0] = _clip(rng.uniform(180, 320), 0, 1e6)
        base[5] = _clip(rng.uniform(0.85, 1.0), 0, 1e6)
    elif class_name == "Port Scan / Recon":
        base[1] = _clip(rng.uniform(120, 450), 0, 1e6)
        base[7] = _clip(rng.uniform(20, 120), 0, 1e6)
    elif class_name == "DDoS Pattern":
        base[2] = _clip(rng.uniform(9.0, 18.0), 0, 1e6)
        base[8] = _clip(rng.uniform(4e5, 9e5), 0, 1e6)  # keep within 1e6 clip target
        base[9] = _clip(rng.uniform(0.2, 2.5), 0, 1e6)
    elif class_name == "Slow Brute Force":
        base[0] = _clip(rng.uniform(3, 12), 0, 1e6)
        base[5] = _clip(rng.uniform(0.45, 0.75), 0, 1e6)
    elif class_name == "Geographic Anomaly":
        base[3] = _clip(rng.uniform(4000, 12000), 0, 1e6)
        base[11] = _clip(rng.uniform(0.6, 1.0), 0, 1e6)
    elif class_name == "Privilege Escalation":
        base[6] = _clip(rng.uniform(3, 12), 0, 1e6)
        base[5] = _clip(rng.uniform(0.55, 0.95), 0, 1e6)

    # Keep time_of_day_score and entropy/country in reasonable bounds
    base[4] = _clip(base[4] if base[4] <= 1 else 1, 0, 1)
    base[10] = _clip(base[10] if base[10] <= 1 else 1, 0, 1)
    base[11] = _clip(base[11] if base[11] <= 1 else 1, 0, 1)

    return [float(x) for x in base]


def generate(output_normal: str = "data/normal_logs.csv", output_labelled: str = "data/labelled_attacks.csv") -> None:
    os.makedirs(os.path.dirname(output_normal), exist_ok=True)
    os.makedirs(os.path.dirname(output_labelled), exist_ok=True)

    rng = random.Random(42)

    # Generate normal logs: 50000 rows
    with open(output_normal, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(FEATURE_NAMES)
        for _ in range(50000):
            writer.writerow(_normal_row(rng))

    # Generate labelled attacks: 600 rows total (100 per class)
    with open(output_labelled, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(FEATURE_NAMES + ["label"])
        for class_idx, class_name in enumerate(CLASS_NAMES):
            for _ in range(100):
                row = _attack_row(rng, class_name)
                writer.writerow(row + [class_idx])


if __name__ == "__main__":
    generate()
    print("Generated training data:")
    print("- data/normal_logs.csv (50000 rows)")
    print("- data/labelled_attacks.csv (600 rows)")

