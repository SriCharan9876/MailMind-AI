import requests
from database import SessionLocal
from models import User, OAuthToken, Session
from datetime import datetime, timedelta


def save_google_user(access_token, refresh_token):
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    if "id" not in userinfo:
        raise Exception(f"Invalid Google userinfo response: {userinfo}")

    db = SessionLocal()

    user = db.query(User).filter_by(google_id=userinfo["id"]).first()
    if not user:
        user = User(
            google_id=userinfo["id"],
            email=userinfo.get("email"),
            name=userinfo.get("name", "Google User")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    oauth = OAuthToken(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    db.merge(oauth)
    db.commit()

    session = Session(
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()

    return str(session.id)


def get_user_from_session(session_id):
    db = SessionLocal()
    session = db.query(Session).filter_by(id=session_id).first()
    if not session or session.expires_at < datetime.utcnow():
        return None
    return db.query(User).filter_by(id=session.user_id).first()
