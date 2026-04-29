"""
manage_users.py — Quick CLI to view and manage users in the CLV DB.
Run from the backend/ directory:
  python manage_users.py list
  python manage_users.py verify user@example.com
"""
import sys
import os

# Make sure we can find models, database etc.
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models


def list_users():
    db = SessionLocal()
    users = db.query(models.User).all()
    db.close()

    if not users:
        print("\n  No users found in the database.\n")
        return

    print(f"\n{'ID':<5} {'Name':<25} {'Email':<35} {'Role':<12} {'Verified'}")
    print("-" * 85)
    for u in users:
        verified_str = "✅ Yes" if u.is_verified else "❌ No"
        print(f"{u.id:<5} {u.name:<25} {u.email:<35} {u.role:<12} {verified_str}")
    print()


def verify_user(email: str):
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        print(f"\n  ❌ No user found with email: {email}\n")
        db.close()
        return

    if user.is_verified:
        print(f"\n  ✅ User '{user.name}' ({email}) is already verified.\n")
        db.close()
        return

    user.is_verified = True
    db.commit()
    print(f"\n  ✅ User '{user.name}' ({email}) has been manually verified. They can now log in.\n")
    db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python manage_users.py list              — show all users")
        print("  python manage_users.py verify EMAIL      — manually verify a user\n")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "list":
        list_users()
    elif command == "verify":
        if len(sys.argv) < 3:
            print("\n  Please provide an email address: python manage_users.py verify user@example.com\n")
            sys.exit(1)
        verify_user(sys.argv[2])
    else:
        print(f"\n  Unknown command: {command}. Use 'list' or 'verify'.\n")
        sys.exit(1)
