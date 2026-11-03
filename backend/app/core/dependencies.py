from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_token
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/auth/login')

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get('sub')
        token_type: str = payload.get('type')
        if user_id is None or token_type != 'access':
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        user_role_names = [r.name for r in current_user.roles]
        if 'admin' in user_role_names:
            return current_user
        for role in allowed_roles:
            if role in user_role_names:
                return current_user
        roles_str = ', '.join(allowed_roles)
        current_str = ', '.join(user_role_names)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f'Access forbidden: Required one of roles [{roles_str}]. Current roles: [{current_str}]'
        )
    return role_checker

def verify_maker_checker(invoice: Invoice, user: User, is_approval_action: bool = True):
    if is_approval_action and invoice.uploader_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Maker-Checker Violation: You are the creator/uploader of this invoice and cannot approve it.'
        )
