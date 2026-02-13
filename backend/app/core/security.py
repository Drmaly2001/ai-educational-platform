"""
Security utilities for authentication and authorization
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Payload data to encode
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_ACCESS_TOKEN_EXPIRY)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create JWT refresh token
    
    Args:
        data: Payload data to encode
        
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=settings.JWT_REFRESH_TOKEN_EXPIRY)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Verify JWT token from Authorization header
    
    Usage:
        @app.get("/protected")
        async def protected_route(payload: dict = Depends(verify_token)):
            return {"user_id": payload["sub"]}
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    # Verify token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    return payload


async def get_current_user_id(payload: Dict[str, Any] = Depends(verify_token)) -> str:
    """
    Get current user ID from token
    
    Usage:
        @app.get("/me")
        async def get_me(user_id: str = Depends(get_current_user_id)):
            return {"user_id": user_id}
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    return user_id


def require_permission(permission: str):
    """
    Dependency to require specific permission
    
    Usage:
        @app.delete("/users/{id}")
        async def delete_user(
            id: str,
            payload: dict = Depends(require_permission("user:delete"))
        ):
            # Delete user logic
    """
    async def check_permission(payload: Dict[str, Any] = Depends(verify_token)):
        permissions = payload.get("permissions", [])
        
        # Super admin has all permissions
        if "*" in permissions:
            return payload
        
        # Check specific permission
        if permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}"
            )
        
        return payload
    
    return check_permission


def require_role(role: str):
    """
    Dependency to require specific role
    
    Usage:
        @app.get("/admin/dashboard")
        async def admin_dashboard(
            payload: dict = Depends(require_role("super_admin"))
        ):
            # Admin dashboard logic
    """
    async def check_role(payload: Dict[str, Any] = Depends(verify_token)):
        roles = payload.get("roles", [])
        
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {role} role"
            )
        
        return payload
    
    return check_role


def get_permissions_for_roles(roles: List[str]) -> List[str]:
    """
    Get all permissions for given roles
    
    Args:
        roles: List of role names
        
    Returns:
        List of permission strings
    """
    role_permissions = {
        "super_admin": ["*"],
        "school_admin": [
            "school:read", "school:write",
            "user:read", "user:write",
            "class:read", "class:write",
            "analytics:read"
        ],
        "teacher": [
            "class:read", "class:write",
            "lesson:read", "lesson:write",
            "assessment:read", "assessment:write",
            "student:read",
            "ai:generate",
            "analytics:read"
        ],
        "student": [
            "lesson:read",
            "assessment:read", "assessment:submit",
            "tutor:chat",
            "progress:read"
        ]
    }
    
    permissions = set()
    for role in roles:
        permissions.update(role_permissions.get(role, []))
    
    return list(permissions)
