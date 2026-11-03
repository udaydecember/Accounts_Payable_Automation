import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = 'Accounts Payable Automation Platform'
    API_V1_STR: str = '/api/v1'
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'enterprise_super_secret_jwt_key_ap_automation_2026')
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///./ap_automation.db')
    
    # Storage
    STORAGE_DIR: str = os.getenv('STORAGE_DIR', os.path.abspath('backend/app/uploads'))
    
    # OCR Settings
    TESSERACT_CMD: str = os.getenv('TESSERACT_CMD', '')
    OCR_PROVIDER: str = os.getenv('OCR_PROVIDER', 'local')  # local, tesseract, mock, aws_textract
    
    # Tolerances
    AMOUNT_TOLERANCE: float = 0.05
    PRICE_VARIANCE_TOLERANCE_PCT: float = 2.0
    
    class Config:
        env_file = '.env'
        extra = 'allow'

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
