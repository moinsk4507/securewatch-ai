import os
import random
import threading
import time
from typing import List

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


def _pick_entry() -> str:
    ip = random.choice(ATTACK_IPS)
    username = random.choice(USERNAMES)
    log_type = random.choice(_LOG_TYPES)

    if log_type == "ssh_fail":
        return generate_ssh_fail(ip, username)
    if log_type == "ssh_success":
        return generate_ssh_success(ip, username)
    if log_type == "sudo_fail":
        return generate_sudo_fail(username)
    if log_type == "apache_log":
        return generate_apache_log(ip)
    if log_type == "port_scan":
        return generate_port_scan(ip)

    return generate_ssh_fail(ip, username)


def start_log_generator() -> None:
    os.makedirs(_DATA_DIR, exist_ok=True)

    def _worker():
        # Daemon thread: run forever
        while True:
            entry = _pick_entry()
            ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

            line = f"{ts} {entry}\n"
            try:
                with open(_AUTH_LOG_PATH, "a", encoding="utf-8") as f:
                    f.write(line)
            except Exception:
                # Keep generator running even if filesystem write fails
                pass

            with _recent_logs_lock:
                _recent_logs.append(line.rstrip("\n"))
                if len(_recent_logs) > _MAX_RECENT:
                    _recent_logs[:] = _recent_logs[-_MAX_RECENT:]

            print(f"Generated log entry: {entry}")
            time.sleep(3)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def get_recent_logs(limit: int = 20) -> List[str]:
    with _recent_logs_lock:
        return list(_recent_logs[-limit:])
