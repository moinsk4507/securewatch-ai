import os
import random
import re
import threading
import time
from typing import List

# Import robustly whether the app is launched from project root or from backend/.
# We need to access top-level packages: ml/, models/.
try:
    from ml.feature_extraction import FEATURE_NAMES as _ML_FEATURE_NAMES
    from ml.predict import score_event
    from models.alert import Alert
    from models.database import SessionLocal
except ModuleNotFoundError:
    import sys
    from pathlib import Path

    PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../securewatch-ai
    BACKEND_DIR = PROJECT_ROOT / "backend"

    # Ensure both:
    #  - PROJECT_ROOT so `ml/` is importable
    #  - backend/ so `models/` is importable (as a top-level `models` package)
    for p in (PROJECT_ROOT, BACKEND_DIR):
        if str(p) not in sys.path:
            sys.path.insert(0, str(p))

    from ml.feature_extraction import FEATURE_NAMES as _ML_FEATURE_NAMES
    from ml.predict import score_event
    from models.alert import Alert
    from models.database import SessionLocal


# ---------------------------------------------------------------------------
# Simulation toggle (default OFF — dashboard starts clean/quiet)
# ---------------------------------------------------------------------------
_simulation_enabled = False
_simulation_lock = threading.Lock()


def enable_simulation():
    global _simulation_enabled
    with _simulation_lock:
        _simulation_enabled = True
    print("Attack simulation ENABLED")


def disable_simulation():
    global _simulation_enabled
    with _simulation_lock:
        _simulation_enabled = False
    print("Attack simulation DISABLED")


def is_simulation_enabled() -> bool:
    with _simulation_lock:
        return _simulation_enabled


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ATTACK_IPS = [

    "185.220.101.7",
    "103.22.18.44",
    "46.182.21.100",
    "192.168.1.44",
    "10.0.0.182",
    "203.88.12.5",
    "45.142.212.100",
]
USERNAMES = ["root", "admin", "ubuntu", "user", "test", "oracle", "postgres"]

_recent_logs: List[str] = []
_recent_logs_lock = threading.Lock()
_MAX_RECENT = 100

_LOG_TYPES = ["ssh_fail", "ssh_success", "sudo_fail", "apache_log", "port_scan"]

_DATA_DIR = os.path.join("data", "logs")
_AUTH_LOG_PATH = os.path.join(_DATA_DIR, "auth.log")

_IP_REGEX = re.compile(r"from\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)")


# ---------------------------------------------------------------------------
# The 6 attack classes and their RF-trained feature ranges.
# Copied EXACTLY from ml/generate_training_data.py's _attack_row() so the RF
# classifier recognises them with high confidence and maps to all 6 classes.
#
# Index mapping (matches FEATURE_NAMES order):
#   0: login_count_per_minute   4: time_of_day_score     8: bytes_transferred
#   1: ports_scanned            5: failed_auth_ratio     9: connection_duration
#   2: request_rate_ratio       6: sudo_fail_count      10: user_agent_entropy
#   3: geo_distance_from_base   7: unique_ports_per_min  11: country_risk_score
# ---------------------------------------------------------------------------
CLASS_NAMES = [
    "Brute Force SSH",
    "Port Scan / Recon",
    "DDoS Pattern",
    "Slow Brute Force",
    "Geographic Anomaly",
    "Privilege Escalation",
]

# Each entry: dict of feature_name -> (lo, hi) overrides on top of a normal base.

# Canonical attack ranges (keys must match ml/feature_extraction.FEATURE_NAMES exactly).
_ATTACK_RANGES = {
    "Brute Force SSH": {
        "login_count_per_minute": (180, 320),
        "failed_auth_ratio": (0.85, 1.0),
    },
    "Port Scan / Recon": {
        "ports_scanned": (120, 450),
        "unique_ports_per_min": (20, 120),
    },
    "DDoS Pattern": {
        "request_rate_ratio": (9.0, 18.0),
        "bytes_transferred": (4e5, 9e5),
        "connection_duration": (0.2, 2.5),
    },
    "Slow Brute Force": {
        "login_count_per_minute": (3, 12),
        "failed_auth_ratio": (0.45, 0.75),
    },
    "Geographic Anomaly": {
        "geo_distance_from_baseline": (4000, 12000),
        "country_risk_score": (0.6, 1.0),
    },
    "Privilege Escalation": {
        "sudo_fail_count": (3, 12),
        "failed_auth_ratio": (0.55, 0.95),
    },
}



# Normal-row baseline ranges (also from generate_training_data.py)
_NORMAL_RANGES = {
    "login_count_per_minute": (0, 60),
    "ports_scanned": (0, 25),
    "request_rate_ratio": (0, 2.5),
    "geo_distance_from_baseline": (0, 2500),
    "time_of_day_score": (0, 1),
    "failed_auth_ratio": (0, 0.35),
    "sudo_fail_count": (0, 1),
    "unique_ports_per_min": (0, 15),
    "bytes_transferred": (5e5, 3e7),
    "connection_duration": (0.1, 10),
    "user_agent_entropy": (0.1, 0.6),
    "country_risk_score": (0.05, 0.6),
}


# ---------------------------------------------------------------------------
# Log-line generators
# ---------------------------------------------------------------------------
def generate_ssh_fail(ip: str, username: str) -> str:
    return f"sshd: Failed password for invalid user {username} from {ip} port 22 ssh2"


def generate_ssh_success(ip: str, username: str) -> str:
    return f"sshd: Accepted password for {username} from {ip} port 22 ssh2"


def generate_sudo_fail(username: str) -> str:
    return (
        f"sudo: {username} : command not allowed; TTY=pts/0 ; "
        f"PWD=/home/{username} ; USER=root ; COMMAND=/usr/bin/passwd"
    )


def generate_apache_log(ip: str) -> str:
    path = random.choice(["/admin", "/wp-login.php", "/login", "/robots.txt", "/cgi-bin/test"])
    status = random.choice([404, 403, 500])
    return f'Apache: {ip} - - [auth] "GET {path} HTTP/1.1" {status} 512 "-" "Mozilla/5.0"'


def generate_port_scan(ip: str) -> str:
    port = random.choice([22, 80, 443, 8080, 3306, 5432])
    return f"IDS: Port scan detected from {ip} to port {port} (SYN flood pattern)"


def _pick_entry() -> tuple[str, str]:
    ip = random.choice(ATTACK_IPS)
    username = random.choice(USERNAMES)
    log_type = random.choice(_LOG_TYPES)

    if log_type == "ssh_fail":
        return generate_ssh_fail(ip, username), ip
    if log_type == "ssh_success":
        return generate_ssh_success(ip, username), ip
    if log_type == "sudo_fail":
        # sudo_fail line doesn't include IP; return placeholder IP for enrichment.
        return generate_sudo_fail(username), ip
    if log_type == "apache_log":
        return generate_apache_log(ip), ip
    if log_type == "port_scan":
        return generate_port_scan(ip), ip

    return generate_ssh_fail(ip, username), ip


def _build_normal_features() -> dict:
    """Generate a normal (benign) feature vector using trained normal ranges."""
    return {k: random.uniform(lo, hi) for k, (lo, hi) in _NORMAL_RANGES.items()}


def _build_attack_features(class_name: str) -> dict:
    """Generate an attack feature vector using the RF-trained class ranges.

    This must produce keys that match ml.feature_extraction.FEATURE_NAMES.
    """
    fv = _build_normal_features()

    overrides = _ATTACK_RANGES.get(class_name, {})
    # Apply only known ML feature keys to avoid accidental drift.
    for feat, (lo, hi) in overrides.items():
        if feat in _ML_FEATURE_NAMES:
            fv[feat] = random.uniform(lo, hi)

    # Ensure all ML feature keys exist.
    for name in _ML_FEATURE_NAMES:
        fv.setdefault(name, 0.0)

    return {k: float(v) for k, v in fv.items()}



def _extract_ip_from_entry(entry: str) -> str | None:
    m = _IP_REGEX.search(entry)
    if not m:
        return None
    return m.group(1)


def _process_generated_event(log_line: str, feature_event: dict, source_ip: str | None) -> None:
    # ml/predict.py uses relative paths like "ml/model.pkl".
    # When backend is started from backend/ cwd, those relative paths break.
    # Temporarily switch cwd to project root so the model files resolve correctly.
    import os
    from pathlib import Path

    prev_cwd = os.getcwd()
    try:
        project_root = Path(__file__).resolve().parents[2]  # .../securewatch-ai
        os.chdir(project_root)
        result = score_event(feature_event)
    finally:
        os.chdir(prev_cwd)

    if result is None:
        return

    severity = (
        "critical" if result["if_score"] < -0.85 else
        "high" if result["if_score"] < -0.75 else
        "medium"
    )

    db = SessionLocal()
    try:
        alert = Alert(
            severity=severity,
            name=f"{result['rf_class']} Detected",
            source_ip=source_ip,
            destination_ip=None,
            ml_classification=f"{result['rf_class']} ({result['rf_confidence']:.0f}%)",
            if_score=result["if_score"],
            rf_confidence=result["rf_confidence"],
            status="open",
            attack_type=result["rf_class"],
            raw_features=result["features"],
            raw_log_line=log_line,
        )
        db.add(alert)
        db.commit()
        print(f"LIVE ALERT: {alert.name} | severity={severity} | IF:{result['if_score']:.3f}")
    finally:
        db.close()


def start_log_generator() -> None:
    os.makedirs(_DATA_DIR, exist_ok=True)

    def _worker():
        # Daemon thread: run forever.
        # When simulation is OFF: still writes harmless log lines for the LiveLogs panel,
        # but does NOT call score_event() or create any Alert rows.
        while True:
            entry, source_ip = _pick_entry()
            ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

            line = f"{ts} {entry}\n"
            try:
                with open(_AUTH_LOG_PATH, "a", encoding="utf-8") as f:
                    f.write(line)
            except Exception:
                # Keep generator running even if filesystem write fails
                pass

            # Keep recent logs for UI even when simulation is off.
            with _recent_logs_lock:
                _recent_logs.append(line.rstrip("\n"))
                if len(_recent_logs) > _MAX_RECENT:
                    _recent_logs[:] = _recent_logs[-_MAX_RECENT:]

            print(f"Generated log entry: {entry}")

            # --- ML scoring (only when simulation is enabled) ---------
            if is_simulation_enabled():
                # ~18% of events are attack-like; rest are normal
                attack_like = random.random() < 0.18

                if attack_like:
                    # Pick a random attack class from all 6 — ensures variety
                    chosen_class = random.choice(CLASS_NAMES)
                    feature_event = _build_attack_features(chosen_class)
                else:
                    feature_event = _build_normal_features()

                _process_generated_event(
                    log_line=line.rstrip("\n"),
                    feature_event=feature_event,
                    source_ip=_extract_ip_from_entry(entry) or source_ip,
                )

            time.sleep(3)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def get_recent_logs(limit: int = 20) -> List[str]:
    with _recent_logs_lock:
        return list(_recent_logs[-limit:])
