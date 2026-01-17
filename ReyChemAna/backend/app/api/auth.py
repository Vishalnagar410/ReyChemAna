"""Authentication endpoints"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.config import settings
from app.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT access token
    
    Args:
        login_data: Username and password
        db: Database session
    
    Returns:
        JWT access token
    
    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by username
    user = db.query(User).filter(User.username == login_data.username).first()
    
    # Verify user exists and password is correct
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    # Log login action
    log_action(
        db=db,
        user=user,
        action="login",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.username} logged in"
    )
    
    return Token(access_token=access_token)


@router.post("/logout")
async def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Logout endpoint (token invalidation happens on client side)
    Logs the logout action for audit purposes
    """
    # Note: With JWT, actual logout happens on client by deleting token
    # This endpoint is for audit logging only
    
    log_action(
        db=db,
        user=current_user,
        action="logout",
        entity_type="user",
       entity_id=current_user.id,
        details=f"User {current_user.username} logged out"
    )
    
    return {"message": "Logged out successfully"}
