from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import base64

def get_service(token):
    creds = Credentials(token)
    return build("gmail", "v1", credentials=creds)

def get_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode()

            # Sometimes nested parts
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


def get_emails(token):
    service = get_service(token)
    res = service.users().messages().list(userId='me', maxResults=5).execute()
    msgs = []

    for m in res.get('messages', []):
        msg = service.users().messages().get(userId='me', id=m['id'], format='full').execute()

        payload = msg['payload']
        body = get_body(payload)

        # Fallback to snippet if body missing
        if not body:
            body = msg.get("snippet", "")

        msgs.append({
            "id": m['id'],
            "subject": next((h['value'] for h in msg['payload']['headers'] if h['name']=="Subject"), ""),
            "from": next((h['value'] for h in msg['payload']['headers'] if h['name']=="From"), ""),
            "body": body
        })

    return msgs



# 🗑 DELETE EMAIL
def delete_email(token, msg_id):
    service = get_service(token)
    service.users().messages().trash(userId='me', id=msg_id).execute()
    return "Email deleted successfully"


# 📤 SEND EMAIL
def send_email(token, to, subject, message_text):
    service = get_service(token)

    message = f"To: {to}\r\nSubject: {subject}\r\n\r\n{message_text}"
    encoded = base64.urlsafe_b64encode(message.encode()).decode()

    service.users().messages().send(
        userId='me',
        body={'raw': encoded}
    ).execute()

    return "Email sent successfully"
