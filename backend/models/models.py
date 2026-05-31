from sqlalchemy import create_engine
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)

try:
    connection = engine.connect()
    print("✅ PostgreSQL Connected Successfully!")
    connection.close()

except Exception as e:
    print("❌ Database Connection Failed")
    print(e)