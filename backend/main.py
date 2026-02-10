from dotenv import load_dotenv  # require('dotenv').config()
load_dotenv()

import os  # process.env
import requests  # axios/fetch in Node
from fastapi import FastAPI, HTTPException  # FastAPI = Express app
from fastapi.middleware.cors import CORSMiddleware  # cors() middleware
from models import ChatRequest, SendEmailRequest, Session as UserSession, OAuthToken  # Mongoose models
from gmail_service import get_emails, delete_email, send_email  # service layer
from ai_service import summarize, reply_email, generate_replies  # business logic layer
from database import Base, engine, SessionLocal  # DB connection (Sequelize setup)
from auth_service import save_google_user, get_user_from_session  # auth controller logic
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

Base.metadata.create_all(bind=engine)  # auto-create tables (sync DB)

app = FastAPI()  # same as const app = express()

app.add_middleware(  # middleware registration
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

email_cache = []  # temporary in-memory store (server variable)

def get_token_from_session(session_id: str):  # auth middleware to get access token
    db = SessionLocal()  # open DB session
    session = db.query(UserSession).filter_by(id=session_id).first()

    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")  # res.status(401)

    oauth = db.query(OAuthToken).filter_by(user_id=session.user_id).first()
    if not oauth:
        raise HTTPException(status_code=401, detail="Authorization revoked. Please login again.")

    return oauth.access_token, oauth.refresh_token  # return both tokens for route usage


@app.post("/chat")  #  app.post('/chat', ...)
def chat(data: ChatRequest):  # req.body automatically parsed & validated
    global email_cache
    msg = data.message.lower()
    access_token, refresh_token = get_token_from_session(data.session_id)

    if "show" in msg:
        emails = get_emails(access_token, refresh_token)
        email_cache = emails
        formatted = "\n\n".join([
            f"{i+1}. From: {e['from']}\nSubject: {e['subject']}\nSummary: {summarize(e['body'])}"
            for i, e in enumerate(emails)
        ])
        return {"reply": formatted}  # res.json()

    if "reply to email" in msg:
        idx = int(msg.split()[-1]) - 1
        if idx >= len(email_cache):
            return {"reply": "Invalid email number."}
        email = email_cache[idx]
        reply = reply_email(email["body"])
        email_cache[idx]["draft"] = reply
        return {"reply": f"Draft Reply for email {idx+1}:\n{reply}\n\nType 'send reply {idx+1}' to send."}

    if "send reply" in msg:
        idx = int(msg.split()[-1]) - 1
        if idx >= len(email_cache):
            return {"reply": "Invalid email number."}
        email = email_cache[idx]
        send_email(token, email["from"], "Re: " + email["subject"], email["draft"])
        return {"reply": " Reply sent successfully."}

    if "delete email" in msg:
        idx = int(msg.split()[-1]) - 1
        if idx >= len(email_cache):
            return {"reply": "Invalid email number."}
        delete_email(access_token, email_cache[idx]["id"])
        return {"reply": "🗑 Email deleted successfully."}

    return {"reply": "Try: show emails, reply to email 1, send reply 1, delete email 1"}


@app.get("/emails")
def get_emails_route(session_id: str, limit: int = 10, page_token: str = None):
    access_token, refresh_token = get_token_from_session(session_id)
    return get_emails(access_token, refresh_token, limit, page_token)


@app.post("/auth/google")  # login route
def auth_google(data: dict):
    code = data.get("code")  # req.body.code

    token_res = requests.post(  
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": "https://mail-mind-ai-vert.vercel.app/dashboard",
            "grant_type": "authorization_code"
        }
    ).json()

    if "access_token" not in token_res:
        raise HTTPException(400, "Google token exchange failed")

    access_token = token_res["access_token"]
    refresh_token = token_res.get("refresh_token")

    session_id = save_google_user(access_token, refresh_token)  
    return {"session_id": session_id}


@app.post("/auth/me")  # get current user
def get_current_user(data: dict):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="No session provided")

    user = get_user_from_session(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return {"name": user.name, "email": user.email}


@app.post("/ai/summarize")
def batch_summarize(data: dict):
    # Expects {"texts": ["text1", "text2", ...]}
    texts = data.get("texts", [])
    if not texts:
        return {"summaries": []}

    # Parallelize summarization
    with ThreadPoolExecutor(max_workers=5) as executor:
        summaries = list(executor.map(summarize, texts))

    return {"summaries": summaries}


@app.post("/ai/replies")
def batch_replies(data: dict):
    # Expects {"texts": ["text1", ...], "count": 3}
    texts = data.get("texts", [])
    count = data.get("count", 3)
    
    if not texts:
        return {"replies": []}

    def _gen(t):
        return generate_replies(t, count)

    with ThreadPoolExecutor(max_workers=3) as executor:  # Lower workers for heavier task
        replies = list(executor.map(_gen, texts))

    return {"replies": replies}


@app.delete("/emails/{message_id}")
def delete_message(message_id: str, session_id: str):
    access_token, refresh_token = get_token_from_session(session_id)
    try:
        delete_email(access_token, refresh_token, message_id)
        return {"status": "success", "message": "Email deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/emails/send")
def send_email_route(data: SendEmailRequest):
    access_token, refresh_token = get_token_from_session(data.session_id)
    try:
        send_email(access_token, refresh_token, data.to, data.subject, data.body)
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

