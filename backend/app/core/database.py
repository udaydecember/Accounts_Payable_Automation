import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

resolved_db_url = settings.get_database_url
connect_args = {'check_same_thread': False} if 'sqlite' in resolved_db_url else {}

# Connection pooling optimized for PostgreSQL and enterprise workloads
engine_kwargs = {
    'connect_args': connect_args,
    'pool_pre_ping': True,
}

if 'postgresql' in resolved_db_url:
    engine_kwargs.update({
        'pool_size': 10,
        'max_overflow': 20,
        'pool_recycle': 1800,
    })

try:
    engine = create_engine(resolved_db_url, **engine_kwargs)
    # Quick probe if postgresql to ensure immediate availability
    if 'postgresql' in resolved_db_url:
        with engine.connect() as probe:
            pass
except Exception as exc:
    logger.warning(
        f"Could not connect to PostgreSQL at {resolved_db_url}: {exc}. "
        "Falling back to local SQLite database (ap_automation.db)."
    )
    fallback_url = 'sqlite:///./ap_automation.db'
    engine = create_engine(
        fallback_url,
        connect_args={'check_same_thread': False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
