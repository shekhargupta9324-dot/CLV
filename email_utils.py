import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

# To make this work, you need to provide your Gmail and App Password
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465 # SSL port
SENDER_EMAIL = os.environ.get("SENDER_EMAIL") 
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD")

def send_verification_email(recipient_email: str, verification_token: str):
    # This URL points to the backend verify endpoint linking to React
    verification_url = f"http://localhost:8000/users/verify-email?token={verification_token}"
    
    msg = EmailMessage()
    msg['Subject'] = 'Verify your email for CLV Predictor AI'
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    
    content = f"""
    Welcome to CLV Predictor AI!
    
    Please click the link below to verify your email address:
    {verification_url}
    
    If you did not request this, please ignore this email.
    """
    msg.set_content(content)
    
    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        print(f"Verification email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
