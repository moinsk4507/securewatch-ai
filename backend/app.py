from fastapi import FastAPI
from sqlalchemy import create_engine, text
from config import DATABASE_URL

app = FastAPI()

engine = create_engine(DATABASE_URL)

@app.get("/")
def home():
    return {
        "message": "SecureWatch AI Backend Running"
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
            "version": str(version[0])
        }

    except Exception as e:
        return {
            "database": "Failed",
            "error": str(e)
        }