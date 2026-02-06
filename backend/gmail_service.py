from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import base64
import os

def get_service(access_token, refresh_token):
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=["https://www.googleapis.com/auth/gmail.modify"]
    )
    return build("gmail", "v1", credentials=creds)


def get_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode()
            if 'parts' in part:
                for sub in part['parts']:
                    if sub['mimeType'] == 'text/plain':
                        data = sub['body'].get('data')
                        if data:
                            return base64.urlsafe_b64decode(data).decode()
    else:
        data = payload['body'].get('data')
        if data:
            return base64.urlsafe_b64decode(data).decode()
    return ""


def get_emails(access_token, refresh_token):
    service = get_service(access_token, refresh_token)
    res = service.users().messages().list(userId='me', maxResults=5).execute()
    msgs = []

    for m in res.get('messages', []):
        msg = service.users().messages().get(userId='me', id=m['id'], format='full').execute()
        payload = msg['payload']
        body = get_body(payload) or msg.get("snippet", "")

        msgs.append({
            "id": m['id'],
            "subject": next((h['value'] for h in payload['headers'] if h['name']=="Subject"), ""),
            "from": next((h['value'] for h in payload['headers'] if h['name']=="From"), ""),
            "body": body
        })

    return msgs


def delete_email(access_token, refresh_token, msg_id):
    service = get_service(access_token, refresh_token)
    service.users().messages().trash(userId='me', id=msg_id).execute()


def send_email(access_token, refresh_token, to, subject, message_text):
    service = get_service(access_token, refresh_token)
    message = f"To: {to}\r\nSubject: {subject}\r\n\r\n{message_text}"
    encoded = base64.urlsafe_b64encode(message.encode()).decode()

    service.users().messages().send(
        userId='me',
        body={'raw': encoded}
    ).execute()
