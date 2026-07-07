import psutil
from typing import Dict, Any, List


def get_cpu_metrics() -> Dict[str, Any]:
    cpu = psutil.cpu_percent(interval=0.5)
    freq = psutil.cpu_freq()  # may be None on some platforms
    return {
        "percent": cpu,
        "count": psutil.cpu_count(logical=False) or psutil.cpu_count(logical=True) or 0,
        "freq_current": getattr(freq, "current", None),
        "freq_max": getattr(freq, "max", None),
    }


def get_ram_metrics() -> Dict[str, Any]:
    vm = psutil.virtual_memory()
    total_gb = vm.total / (1024 ** 3)
    used_gb = vm.used / (1024 ** 3)
    available_gb = vm.available / (1024 ** 3)
    return {
        "total_gb": round(total_gb, 2),
        "used_gb": round(used_gb, 2),
        "available_gb": round(available_gb, 2),
        "percent": vm.percent,
    }


def get_disk_metrics() -> Dict[str, Any]:
    # Use root filesystem as a reasonable default
    du = psutil.disk_usage("/")
    total_gb = du.total / (1024 ** 3)
    used_gb = du.used / (1024 ** 3)
    free_gb = du.free / (1024 ** 3)
    return {
        "total_gb": round(total_gb, 2),
        "used_gb": round(used_gb, 2),
        "free_gb": round(free_gb, 2),
        "percent": du.percent,
    }


def get_network_metrics() -> Dict[str, Any]:
    net = psutil.net_io_counters()
    return {
        "bytes_sent_mb": round(net.bytes_sent / (1024 ** 2), 2),
        "bytes_recv_mb": round(net.bytes_recv / (1024 ** 2), 2),
        "packets_sent": int(net.packets_sent),
        "packets_recv": int(net.packets_recv),
    }


def get_top_processes(limit: int = 10) -> Dict[str, Any]:
    import time

    try:
        processes: List[Dict[str, Any]] = []
        start = time.time()
        # Overall budget guard: avoid hanging under heavy CPU contention.
        time_budget_s = 3

        for p in psutil.process_iter(attrs=["pid", "name", "cpu_percent", "memory_percent", "status"]):
            if time.time() - start > time_budget_s:
                break

            try:
                cpu_percent = p.info.get("cpu_percent", 0.0) or 0.0
                if cpu_percent <= 0:
                    continue
                processes.append(
                    {
                        "pid": p.info.get("pid"),
                        "name": p.info.get("name") or "",
                        "cpu_percent": round(float(cpu_percent), 2),
                        "memory_percent": round(float(p.info.get("memory_percent", 0.0) or 0.0), 2),
                        "status": p.info.get("status") or "unknown",
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            except Exception:
                continue

        processes.sort(key=lambda x: x["cpu_percent"], reverse=True)
        processes = processes[: max(0, int(limit))]
        return {"processes": processes, "total": len(processes)}
    except Exception:
        return {"processes": [], "total": 0}


def get_system_health_score() -> Dict[str, Any]:
    cpu = get_cpu_metrics()
    ram = get_ram_metrics()
    disk = get_disk_metrics()

    cpu_ok = cpu["percent"] < 50
    ram_ok = ram["percent"] < 70
    disk_ok = disk["percent"] < 80

    score = 0
    if cpu_ok:
        score += 34
    else:
        score += max(0, 34 - int((cpu["percent"] - 50) * 0.5))

    if ram_ok:
        score += 33
    else:
        score += max(0, 33 - int((ram["percent"] - 70) * 0.5))

    if disk_ok:
        score += 33
    else:
        score += max(0, 33 - int((disk["percent"] - 80) * 0.5))

    score = max(0, min(100, int(score)))

    if cpu_ok and ram_ok and disk_ok:
        status = "healthy"
    elif (cpu_ok and ram_ok) or (cpu_ok and disk_ok) or (ram_ok and disk_ok):
        status = "warning"
    else:
        status = "critical"

    return {
        "score": score,
        "status": status,
        "cpu_ok": cpu_ok,
        "ram_ok": ram_ok,
        "disk_ok": disk_ok,
    }
