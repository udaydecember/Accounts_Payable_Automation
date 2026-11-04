import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env file into environment variables automatically
load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='allow')

    PROJECT_NAME: str = 'Accounts Payable Automation Platform'
    API_V1_STR: str = '/api/v1'
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'enterprise_super_secret_jwt_key_ap_automation_2026')
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # PostgreSQL Database Configuration
    POSTGRES_SERVER: str = os.getenv('POSTGRES_SERVER', os.getenv('POSTGRES_HOST', 'localhost'))
    POSTGRES_PORT: str = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_USER: str = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD: str = os.getenv('POSTGRES_PASSWORD', '')
    POSTGRES_DB: str = os.getenv('POSTGRES_DB', 'ap_automation')

    # Direct connection string or fallback
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///./ap_automation.db')

    # Storage
    STORAGE_DIR: str = os.getenv('STORAGE_DIR', os.path.abspath('backend/app/uploads'))

    # OCR Settings
    TESSERACT_CMD: str = os.getenv('TESSERACT_CMD', '')
    OCR_PROVIDER: str = os.getenv('OCR_PROVIDER', 'local')  # local, tesseract, mock, aws_textract

    # Financial Tolerances
    AMOUNT_TOLERANCE: float = 0.05
    PRICE_VARIANCE_TOLERANCE_PCT: float = 2.0

    @property
    def get_database_url(self) -> str:
        """
        Returns the resolved database connection URL.
        Priority:
        1. Explicit DATABASE_URL environment variable if provided.
        2. Assembled PostgreSQL URL if POSTGRES_PASSWORD, POSTGRES_USER, or USE_POSTGRES is set.
        3. Configured default DATABASE_URL.
        """
        explicit_url = os.getenv('DATABASE_URL')
        if explicit_url:
            return explicit_url

        if os.getenv('POSTGRES_PASSWORD') or os.getenv('USE_POSTGRES', '').lower() in ['true', '1', 'yes']:
            pwd = f":{self.POSTGRES_PASSWORD}" if self.POSTGRES_PASSWORD else ""
            return f"postgresql+psycopg2://{self.POSTGRES_USER}{pwd}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

        return self.DATABASE_URL

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
