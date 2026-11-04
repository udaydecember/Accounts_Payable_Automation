import os
import sys

# Ensure project root and backend are on sys.path regardless of where the script is executed
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import engine

def verify():
    url = settings.get_database_url
    print("=" * 60)
    print("DATABASE CONNECTION VERIFICATION")
    print("=" * 60)
    
    # Hide password in displayed URL
    sanitized_url = url
    if "@" in url and ":" in url.split("@")[0]:
        prefix, rest = url.split("://", 1)
        user_pass, host_db = rest.split("@", 1)
        user = user_pass.split(":")[0]
        sanitized_url = f"{prefix}://{user}:******@{host_db}"

    print(f"Target Database URL: {sanitized_url}")
    print(f"Database Engine:     {engine.name.upper()}")

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1;")).scalar()
            print("Connection Test:     SUCCESSFUL (Ping = 1)")
            
            # Check existing tables
            if engine.name == "postgresql":
                tables = conn.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
                )).scalars().all()
            else:
                tables = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
                )).scalars().all()

            print(f"Detected Tables:     {len(tables)} tables found in schema")
            if tables:
                print(f"Sample Tables:       {', '.join(tables[:6])}...")
            else:
                print("Note: Schema is currently empty. Run migrations or schema.sql to initialize tables.")
                
            print("=" * 60)
            if engine.name == "postgresql":
                print("STATUS: Connected to PostgreSQL! Your backend is ready for production.")
            else:
                print("STATUS: Currently using local SQLite fallback.")
            print("=" * 60)
    except Exception as e:
        print("Connection Test:     FAILED")
        print(f"Error Details:       {str(e)}")
        print("=" * 60)
        print("TIP: Please verify your credentials, database name, and that PostgreSQL is running.")
        sys.exit(1)

if __name__ == "__main__":
    verify()
