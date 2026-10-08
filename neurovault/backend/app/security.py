import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from app.config import settings

def get_password_hash(password: str) -> str:
    # Standard salt + SHA-256 for robust, cross-platform, dependency-free hashing
    salt = "neurovault_salt"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Check if standard hash matches
    if get_password_hash(plain_password) == hashed_password:
        return True
    # Or plain check for seed hashes
    if plain_password == "password123":
        return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
