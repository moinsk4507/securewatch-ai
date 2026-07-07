from fastapi import APIRouter, Depends
from utils.security import get_current_user, require_admin
from utils.system_monitor import (
    get_cpu_metrics,
    get_ram_metrics,
    get_disk_metrics,
    get_network_metrics,
    get_system_health_score,
    get_top_processes,
)
from utils.log_generator import (
    get_recent_logs,
    enable_simulation,
    disable_simulation,
    is_simulation_enabled,
)

router = APIRouter()


@router.get("/api/system/metrics")
def system_metrics(user=Depends(get_current_user)):
    cpu = get_cpu_metrics()
    ram = get_ram_metrics()
    disk = get_disk_metrics()
    network = get_network_metrics()
    import time

    return {
        "cpu": cpu,
        "ram": ram,
        "disk": disk,
        "network": network,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
    }


@router.get("/api/system/processes")
def system_processes(limit: int = 10, user=Depends(get_current_user)):
    try:
        top = get_top_processes(limit=limit)
        return {"processes": top["processes"], "total": top["total"]}
    except Exception:
        return {"processes": [], "total": 0}


@router.get("/api/system/health")
def system_health(user=Depends(get_current_user)):
    return get_system_health_score()


@router.get("/api/system/logs")
def system_logs(limit: int = 20, user=Depends(get_current_user)):
    logs = get_recent_logs(limit=limit)
    return {"logs": logs, "total": len(logs)}


# ---------------------------------------------------------------------------
# Attack simulation control
# ---------------------------------------------------------------------------

@router.post("/api/system/simulate/start")
def simulate_start(user=Depends(require_admin)):
    enable_simulation()
    return {"message": "Attack simulation started", "enabled": True}


@router.post("/api/system/simulate/stop")
def simulate_stop(user=Depends(require_admin)):
    disable_simulation()
    return {"message": "Attack simulation stopped", "enabled": False}


@router.get("/api/system/simulate/status")
def simulate_status(user=Depends(get_current_user)):
    return {"enabled": is_simulation_enabled()}

