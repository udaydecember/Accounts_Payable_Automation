import os
import hashlib
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException
from backend.app.core.config import settings

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

class StorageService:
    def __init__(self, base_dir: str = settings.STORAGE_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save_upload_file(self, upload_file: UploadFile) -> Tuple[str, str, int, str]:
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f'Unsupported file type {ext}. Allowed: PDF, JPG, PNG, TIFF')

        unique_id = str(uuid.uuid4())
        safe_filename = f'{unique_id}_{upload_file.filename}'
        file_path = os.path.join(self.base_dir, safe_filename)

        sha256 = hashlib.sha256()
        file_size = 0

        with open(file_path, 'wb') as buffer:
            while chunk := upload_file.file.read(8192):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    buffer.close()
                    os.remove(file_path)
                    raise HTTPException(status_code=400, detail=f'File exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB')
                sha256.update(chunk)
                buffer.write(chunk)

        return safe_filename, file_path, file_size, sha256.hexdigest()

storage_service = StorageService()
