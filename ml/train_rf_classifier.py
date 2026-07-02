from __future__ import annotations

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score


CLASS_NAMES = [
    "Brute Force SSH",
    "Port Scan / Recon",
    "DDoS Pattern",
    "Slow Brute Force",
    "Geographic Anomaly",
    "Privilege Escalation",
]


def train_rf_classifier(
    labelled_csv: str = "data/labelled_attacks.csv",
    out_path: str = "ml/classifier.pkl",
) -> None:
    df = pd.read_csv(labelled_csv)
    if "label" not in df.columns:
        raise ValueError("label column missing")

    # Shuffle before deterministic split so all classes appear in train/test.
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols].values.astype(float)
    y = df["label"].values.astype(int)

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    # Simple train/test split for assertion; keep deterministic.
    n = len(df)
    split = int(n * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    acc = float(accuracy_score(y_test, preds))
    assert acc >= 0.70, f"RF accuracy below threshold: {acc}"

    report = classification_report(y_test, preds, target_names=CLASS_NAMES)

    joblib.dump({"model": model, "class_names": CLASS_NAMES}, out_path)

    print("RandomForest training complete")
    print(f"- accuracy: {acc:.4f}")
    print("- classification_report:\n" + report)
    print(f"- saved: {out_path}")


if __name__ == "__main__":
    train_rf_classifier()

