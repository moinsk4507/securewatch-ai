from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from config import DATABASE_URL

from routes.auth import router as auth_router
from routes.stats import router as stats_router
from routes.alerts import router as alerts_router
from routes.geo import router as geo_router
from routes.rules import router as rules_router
from routes.user import router as user_router
from routes.settings import router as settings_router
from routes.firewall import router as firewall_router
from routes.trends import router as trends_router

from routes.ml import router as ml_router
from routes.logs import router as logs_router
from routes.system import router as system_router

from utils.log_generator import start_log_generator

import contextlib
import threading

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    t = threading.Thread(target=start_log_generator, daemon=True)
    t.start()
    yield

app = FastAPI(lifespan=lifespan)

engine = create_engine(DATABASE_URL)


@app.get("/")
def home():
    return {
        "message": "SecureWatch AI Backend Running"
    }

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "3.0.0"
    }

@app.get("/test-db")
def test_db():
    try:
        connection = engine.connect()
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()
        connection.close()
        return {
            "database": "Connected",
            "version": str(version[0]),
        }
    except Exception as e:
        return {
            "database": "Failed",
            "error": str(e),
        }


app.include_router(auth_router, prefix="/api/auth")
app.include_router(stats_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(geo_router, prefix="/api")
app.include_router(rules_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(firewall_router, prefix="/api")
app.include_router(trends_router, prefix="/api")

app.include_router(ml_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(system_router, prefix="/api")


@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

