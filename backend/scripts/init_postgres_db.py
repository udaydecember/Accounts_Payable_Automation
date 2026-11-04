import os
import sys
import psycopg2
from urllib.parse import urlparse

# Ensure paths
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.core.config import settings

def init_postgres():
    url = settings.get_database_url
    if not url.startswith("postgresql"):
        print(f"[!] DATABASE_URL in .env is not PostgreSQL: {url}")
        return False

    # Clean URL scheme for psycopg2 / urllib parsing
    clean_url = url.replace("postgresql+psycopg2://", "postgresql://")
    parsed = urlparse(clean_url)
    
    db_name = parsed.path.lstrip("/") or "ap_automation"
    user = parsed.username or "postgres"
    password = parsed.password or ""
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    print(f"[*] Checking PostgreSQL server at {host}:{port} as user '{user}'...")
    try:
        # Connect to default 'postgres' database to check/create target database
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()
        
        if not exists:
            print(f"[*] Database '{db_name}' does not exist. Creating it now...")
            cur.execute(f'CREATE DATABASE "{db_name}";')
            print(f"[+] Successfully created database '{db_name}'!")
        else:
            print(f"[+] Database '{db_name}' already exists.")
            
        cur.close()
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print("\n[-] Connection Failed!")
        print(f"    Error: {e}")
        print("\nTIP: Ensure PostgreSQL service is running and credentials in .env are correct.")
        return False
    except Exception as e:
        print(f"\n[-] Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    success = init_postgres()
    if success:
        print("\n[+] PostgreSQL server and database are ready!")
        print("[*] Now verifying connection via SQLAlchemy...")
        from backend.scripts.verify_db_connection import verify
        verify()
