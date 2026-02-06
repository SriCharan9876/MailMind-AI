from pydantic import BaseModel

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class ChatRequest(BaseModel):
    message: str
    session_id: str

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id = Column(String)
    email = Column(String)
    name = Column(String)

class OAuthToken(Base):
    __tablename__ = "oauth_tokens"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    access_token = Column(String)
    refresh_token = Column(String)
    expiry = Column(DateTime)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime)
