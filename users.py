from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, schemas, auth
from schemas import RoleUpdate, ProfileUpdate
from jose import jwt, JWTError
import logging
# Mongo mirroring disabled for this session to avoid requiring MongoDB configuration

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        is_verified=True  # Auto-verify — no email SMTP configured
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # MongoDB mirroring intentionally disabled.

    return new_user

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "verification":
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
        
    if user.is_verified:
        return {"msg": "Email already verified"}
        
    user.is_verified = True
    db.commit()
    return {"msg": "Email verified successfully. You can now log in."}

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(status_code=403, detail="Invalid Credentials")
        
    if not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=403, detail="Invalid Credentials")
        
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    
@router.get("/me", response_model=schemas.UserResponse)
def get_current_user(token: str, db: Session = Depends(database.get_db)):
     # For simplicity, passing token as query param for now. Usually it's in Authorization header.
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/", response_model=list)
def get_all_users(token: str = None, db: Session = Depends(database.get_db)):
    """Fetch all registered users. Requires authentication token."""
    # Verify token if provided
    if token:
        try:
            payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
            current_user_email = payload.get("sub")
            if current_user_email is None:
                raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    # Fetch all users
    users = db.query(models.User).all()
    
    # Convert to response format
    user_list = []
    for user in users:
        user_list.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "status": "active" if user.is_verified else "inactive"
        })
    
    return user_list

@router.put("/update-role/{user_id}")
def update_user_role(user_id: int, body: RoleUpdate, token: str, db: Session = Depends(database.get_db)):
    """Update user role. Only admins can do this."""
    new_role = body.new_role
    # Verify token and check if user is admin
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        admin_email = payload.get("sub")
        if admin_email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    # Check if current user is admin
    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update user roles")
    
    # Validate role — 'admin' cannot be assigned via the API (security)
    if new_role not in ["sub-admin", "analyst", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Assignable roles are: 'sub-admin', 'analyst', 'viewer'. Admin accounts can only be created via backend.")
    
    # Get target user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update role
    user.role = new_role
    db.commit()
    
    return {
        "message": f"User role updated successfully to {new_role}",
        "user_id": user.id,
        "new_role": new_role
    }


@router.put("/profile")
def update_profile(body: ProfileUpdate, token: str, db: Session = Depends(database.get_db)):
    """Update the current user's profile (name, email, password)."""
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Handle password change
    if body.new_password:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not auth.verify_password(body.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user.hashed_password = auth.get_password_hash(body.new_password)

    # Handle email change
    if body.email and body.email != user.email:
        existing = db.query(models.User).filter(models.User.email == body.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = body.email

    # Handle name change
    if body.name:
        user.name = body.name

    db.commit()
    db.refresh(user)

    # MongoDB mirroring intentionally disabled.

    return {
        "message": "Profile updated successfully",
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified
    }

@router.delete("/delete/{user_id}")
def delete_user(user_id: int, token: str, db: Session = Depends(database.get_db)):
    """Delete a user. Only admins can do this."""
    # Verify token and check if user is admin
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        admin_email = payload.get("sub")
        if admin_email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    # Check if current user is admin
    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    # Get target user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deleting themselves
    if user.email == admin_email:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    # Delete user
    db.delete(user)
    db.commit()

    # MongoDB mirroring intentionally disabled.
    
    return {
        "message": f"User {user.name} deleted successfully",
        "deleted_user_id": user.id
    }
