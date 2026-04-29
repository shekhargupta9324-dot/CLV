import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_registration():
    print("Testing Registration...")
    data = {
        "name": "Test User",
        "email": "demotest123@example.com",
        "password": "securepassword123"
    }
    response = requests.post(f"{BASE_URL}/users/register", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_login_unverified():
    print("\nTesting Login (Should fail because unverified)...")
    data = {"email": "demotest123@example.com", "password": "securepassword123"}
    response = requests.post(f"{BASE_URL}/users/login", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 403

if __name__ == "__main__":
    test_registration()
    test_login_unverified()
