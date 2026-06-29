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

app = FastAPI()

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


@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

