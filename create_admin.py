from database import SessionLocal
from models import User
from auth import get_password_hash

def create_admin():
    db = SessionLocal()
    email = "admin@clv.com"
    existing = db.query(User).filter(User.email == email).first()
    if not existing:
        admin = User(
            email=email,
            name="Super Admin",
            hashed_password=get_password_hash("AdminPass123!"),
            role="admin",
            is_verified=True
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully!")
    else:
        existing.hashed_password = get_password_hash("AdminPass123!")
        existing.role = "admin"
        existing.is_verified = True
        db.commit()
        print("Admin user updated successfully!")

if __name__ == "__main__":
    create_admin()
