#!/usr/bin/env python3
"""
Test script to verify email configuration
"""

import os

from dotenv import load_dotenv

from email_service import email_service

load_dotenv()


def test_email_config():
    """Test email configuration and send a test email"""

    # Check environment variables
    print("=== Email Configuration Check ===")
    print(f"SMTP_SERVER: {os.getenv('SMTP_SERVER', 'Not set')}")
    print(f"SMTP_PORT: {os.getenv('SMTP_PORT', 'Not set')}")
    print(f"SMTP_USERNAME: {os.getenv('SMTP_USERNAME', 'Not set')}")
    print(f"SMTP_PASSWORD: {'Set' if os.getenv('SMTP_PASSWORD') else 'Not set'}")
    print(f"FROM_EMAIL: {os.getenv('FROM_EMAIL', 'Not set')}")

    # Test email service
    print("\n=== Testing Email Service ===")

    # Get test recipient from user input
    test_recipient = input("Enter test email address: ").strip()

    if not test_recipient:
        print("No email address provided. Exiting.")
        return

    # Send test email
    success = email_service.send_alert_email(
        recipients=[test_recipient],
        subject="Test Email - Prompt Engineering Test Harness",
        message="This is a test email to verify your email configuration is working correctly.",
        schedule_name="Test Schedule",
        test_run_id="test-123",
        avg_score=0.85,
        total_samples=10,
    )

    if success:
        print("✅ Test email sent successfully!")
    else:
        print("❌ Failed to send test email. Check your configuration.")


if __name__ == "__main__":
    test_email_config()
