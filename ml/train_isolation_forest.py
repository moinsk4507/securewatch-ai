from __future__ import annotations

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest


def train_isolation_forest(
    normal_csv: str = "data/normal_logs.csv",
    out_path: str = "ml/model.pkl",
) -> None:
    df = pd.read_csv(normal_csv)
    X = df.values.astype(float)

    # Assert no NaN
    assert not np.isnan(X).any(), "NaN found in normal logs"

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    # Anomaly rate estimate on training data
    pred = model.predict(X)  # -1 anomaly, 1 normal
    anomaly_rate = float((pred == -1).mean())
    assert 0.02 <= anomaly_rate <= 0.10, f"Anomaly rate out of expected range: {anomaly_rate}"

    joblib.dump(model, out_path)

    print("IsolationForest training complete")
    print(f"- anomaly_rate: {anomaly_rate:.4f}")
    print(f"- saved: {out_path}")


if __name__ == "__main__":
    train_isolation_forest()

