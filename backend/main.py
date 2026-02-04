from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import ChatRequest
from gmail_service import get_emails, delete_email, send_email
from ai_service import summarize, reply_email



app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

email_cache = []

@app.post("/chat")
def chat(data: ChatRequest):
    global email_cache
    msg = data.message.lower()

    if "show" in msg:
        emails = get_emails(data.token)
        email_cache = emails
        formatted = "\n\n".join([
            f"{i+1}. From: {e['from']}\nSubject: {e['subject']}\nSummary: {summarize(e['body'])}"
            for i, e in enumerate(emails)
        ])
        return {"reply": formatted}

    if "reply to email" in msg:
        idx = int(msg.split()[-1]) - 1
        email = email_cache[idx]
        reply = reply_email(email["body"])
        email_cache[idx]["draft"] = reply
        return {"reply": f"Draft Reply for email {idx+1}:\n{reply}\n\nType 'send reply {idx+1}' to send."}

    if "send reply" in msg:
        idx = int(msg.split()[-1]) - 1
        email = email_cache[idx]
        send_email(data.token, email["from"], "Re: " + email["subject"], email["draft"])
        return {"reply": "✅ Reply sent successfully."}

    if "delete email" in msg:
        idx = int(msg.split()[-1]) - 1
        delete_email(data.token, email_cache[idx]["id"])
        return {"reply": "🗑 Email deleted successfully."}

    return {"reply": "Try: show emails, reply to email 1, send reply 1, delete email 1"}
