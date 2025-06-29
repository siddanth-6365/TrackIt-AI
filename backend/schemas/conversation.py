from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    user_id: str
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    is_active: bool


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    message_id: str
    response: str
    conversation_id: str
    agent_used: str
    classification: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ConversationList(BaseModel):
    conversations: List[ConversationResponse]
    total: int


class MessageList(BaseModel):
    messages: List[MessageResponse]
    total: int
