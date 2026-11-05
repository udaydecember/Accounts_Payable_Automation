"""
PostgreSQL Setup & Seeding Script for Accounts Payable (AP) Automation Platform.
This script checks the PostgreSQL connection, initializes tables, and seeds enterprise test data.
"""
import os
import sys

# Ensure root and backend directories are on sys.path
_current = os.path.dirname(os.path.abspath(__file__))
_root = os.path.abspath(os.path.join(_current, ".."))
_backend = os.path.join(_root, "backend")
for p in [_root, _backend]:
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy import create_engine, text
from backend.app.core.config import settings
from backend.app.core.database import Base, SessionLocal, engine
from backend.app.seed.seeder import seed_database
import backend.app.models

def setup_postgresql():
    print("=" * 70)
    print("Accounts Payable (AP) Automation - PostgreSQL Database Setup")
    print("=" * 70)

    db_url = settings.get_database_url
    print(f"Target Database URL: {db_url.split('@')[-1] if '@' in db_url else db_url}")

    # Check if target is PostgreSQL
    if "postgresql" in db_url:
        print("\n[1/3] Testing PostgreSQL connectivity...")
        # Attempt to create database if it doesn't exist
        try:
            # Connect to default postgres DB first to create target DB if needed
            default_pg_url = f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
            temp_engine = create_engine(default_pg_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                res = conn.execute(
                    text("SELECT 1 FROM pg_database WHERE datname=:name"),
                    {"name": settings.POSTGRES_DB}
                ).fetchone()
                if not res:
                    print(f"  Creating database '{settings.POSTGRES_DB}'...")
                    conn.execute(text(f'CREATE DATABASE "{settings.POSTGRES_DB}"'))
                    print(f"  Database '{settings.POSTGRES_DB}' successfully created.")
                else:
                    print(f"  Database '{settings.POSTGRES_DB}' already exists.")
            temp_engine.dispose()
        except Exception as e:
            print(f"  Note during database check: {e}")

    print("\n[2/3] Generating database schema & tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("  All PostgreSQL tables, indexes, and foreign keys created successfully.")
    except Exception as e:
        print(f"  Error creating tables: {e}")
        return False

    print("\n[3/3] Seeding initial enterprise personas, vendors, POs & workflows...")
    db = SessionLocal()
    try:
        seed_database(db)
        print("  Database seeding complete.")
    except Exception as e:
        print(f"  Error during seeding: {e}")
        db.rollback()
        return False
    finally:
        db.close()

    print("\n" + "=" * 70)
    print("PostgreSQL Database is READY!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    setup_postgresql()
