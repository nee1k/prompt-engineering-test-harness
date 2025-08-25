#!/usr/bin/env python3
"""
Email service for sending alert notifications
"""

import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)

    def send_alert_email(
        self,
        recipients: List[str],
        subject: str,
        message: str,
        schedule_name: str,
        test_run_id: str,
        avg_score: float,
        total_samples: int,
    ) -> bool:
        """
        Send alert email to recipients

        Args:
            recipients: List of email addresses
            subject: Email subject
            message: Alert message
            schedule_name: Name of the test schedule
            test_run_id: ID of the test run
            avg_score: Average score from the test
            total_samples: Total number of samples tested

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        print(f"=== Email Service Debug ===")
        print(f"SMTP Server: {self.smtp_server}")
        print(f"SMTP Port: {self.smtp_port}")
        print(f"SMTP Username: {self.smtp_username}")
        print(f"SMTP Password: {'Set' if self.smtp_password else 'Not set'}")
        print(f"From Email: {self.from_email}")
        print(f"Recipients: {recipients}")
        print(f"Subject: {subject}")

        if not self.smtp_username or not self.smtp_password:
            print("❌ SMTP credentials not configured. Skipping email notification.")
            return False

        if not recipients:
            print("❌ No recipients specified. Skipping email notification.")
            return False

        try:
            # Create message
            msg = MIMEMultipart()
            msg["From"] = self.from_email
            msg["To"] = ", ".join(recipients)
            msg["Subject"] = f"[Alert] {subject}"

            # Create HTML body
            html_body = f"""
            <html>
            <body>
                <h2>Test Schedule Alert</h2>
                <p><strong>Schedule:</strong> {schedule_name}</p>
                <p><strong>Test Run ID:</strong> {test_run_id}</p>
                <p><strong>Average Score:</strong> {avg_score:.2%}</p>
                <p><strong>Total Samples:</strong> {total_samples}</p>
                <p><strong>Alert:</strong> {message}</p>
                <hr>
                <p><em>This is an automated alert from Prompt Engineering Test Harness.</em></p>
            </body>
            </html>
            """

            msg.attach(MIMEText(html_body, "html"))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            print(f"✅ Alert email sent to {len(recipients)} recipients")
            return True

        except Exception as e:
            print(f"❌ Failed to send alert email: {e}")
            print(f"Error type: {type(e)}")
            import traceback

            print(f"Full traceback: {traceback.format_exc()}")
            return False

    def send_score_drop_alert(
        self,
        recipients: List[str],
        schedule_name: str,
        test_run_id: str,
        avg_score: float,
        prev_score: float,
        total_samples: int,
    ) -> bool:
        """Send score drop alert email"""
        score_drop = prev_score - avg_score
        subject = f"Score Drop Alert - {schedule_name}"
        message = f"Test score dropped by {score_drop:.2%} (from {prev_score:.2%} to {avg_score:.2%})"

        return self.send_alert_email(
            recipients=recipients,
            subject=subject,
            message=message,
            schedule_name=schedule_name,
            test_run_id=test_run_id,
            avg_score=avg_score,
            total_samples=total_samples,
        )

    def send_failure_alert(
        self,
        recipients: List[str],
        schedule_name: str,
        test_run_id: str,
        error_message: str,
        total_samples: int,
    ) -> bool:
        """Send test failure alert email"""
        subject = f"Test Failure Alert - {schedule_name}"
        message = f"Test run failed: {error_message}"

        return self.send_alert_email(
            recipients=recipients,
            subject=subject,
            message=message,
            schedule_name=schedule_name,
            test_run_id=test_run_id,
            avg_score=0.0,
            total_samples=total_samples,
        )


# Global email service instance
email_service = EmailService()
