"""
Conversation Management Service
Handles conversation sessions, memory, and context for multi-turn interactions
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from services.supabase_client import supabase
from postgrest.exceptions import APIError


class ConversationMemory:
    """Manages conversation context and memory"""
    
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.messages: List[Dict[str, Any]] = []
        self.context_summary = ""
        self.max_messages = 20  # Keep last 20 messages in memory
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to conversation memory"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        
        # Keep only recent messages to prevent context overflow
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
    
    def get_conversation_context(self) -> str:
        """Get formatted conversation context for LLM prompts"""
        if not self.messages:
            return ""
        
        context_lines = []
        for msg in self.messages[-10:]:  # Last 10 messages for context
            role = msg["role"].upper()
            content = msg["content"]
            context_lines.append(f"{role}: {content}")
        
        return "\n".join(context_lines)
    
    def get_recent_queries(self) -> List[Dict[str, Any]]:
        """Get recent user queries and system responses"""
        recent = []
        for msg in self.messages[-6:]:  # Last 6 messages
            if msg["role"] in ["user", "assistant"]:
                recent.append(msg)
        return recent


async def create_conversation(user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
    """Create a new conversation session"""
    conversation_id = str(uuid.uuid4())
    
    conversation_data = {
        "id": conversation_id,
        "user_id": user_id,
        "title": title or "New Conversation",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "message_count": 0,
        "is_active": True
    }
    
    try:
        resp = supabase.table("conversations").insert(conversation_data).execute()
        if not resp.data:
            raise RuntimeError("Failed to create conversation")
        return resp.data[0]
    except APIError as e:
        raise RuntimeError(f"Database error creating conversation: {e.message}")


async def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Get conversation by ID"""
    try:
        resp = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
        return resp.data
    except APIError:
        return None


async def get_user_conversations(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get user's conversation history"""
    try:
        resp = supabase.table("conversations").select("*").eq("user_id", user_id).eq("is_active", True).order("updated_at", desc=True).limit(limit).execute()
        return resp.data or []
    except APIError as e:
        raise RuntimeError(f"Database error getting conversations: {e.message}")


async def save_message(
    conversation_id: str, 
    role: str, 
    content: str,
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Save a message to the conversation"""
    message_data = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "role": role,  # 'user', 'assistant', 'system'
        "content": content,
        "metadata": json.dumps(metadata or {}),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        # Save message
        resp = supabase.table("conversation_messages").insert(message_data).execute()
        if not resp.data:
            raise RuntimeError("Failed to save message")
        
        # Update conversation timestamp and message count
        await update_conversation_activity(conversation_id)
        
        return resp.data[0]
    except APIError as e:
        raise RuntimeError(f"Database error saving message: {e.message}")


async def get_conversation_messages(
    conversation_id: str, 
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Get messages for a conversation"""
    try:
        resp = supabase.table("conversation_messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(limit).execute()
        return resp.data or []
    except APIError as e:
        raise RuntimeError(f"Database error getting messages: {e.message}")


async def update_conversation_activity(conversation_id: str):
    """Update conversation's last activity timestamp"""
    try:
        # Get current message count
        msg_count_resp = supabase.table("conversation_messages").select("id", count="exact").eq("conversation_id", conversation_id).execute()
        message_count = msg_count_resp.count or 0
        
        # Update conversation
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "message_count": message_count
        }
        supabase.table("conversations").update(update_data).eq("id", conversation_id).execute()
    except APIError:
        pass  # Non-critical update


async def load_conversation_memory(conversation_id: str) -> ConversationMemory:
    """Load conversation memory from database"""
    memory = ConversationMemory(conversation_id)
    
    # Load recent messages
    messages = await get_conversation_messages(conversation_id)
    for msg in messages:
        metadata = {}
        if msg.get("metadata"):
            try:
                metadata = json.loads(msg["metadata"])
            except json.JSONDecodeError:
                pass
        
        memory.add_message(
            role=msg["role"],
            content=msg["content"],
            metadata=metadata
        )
    
    return memory


async def delete_conversation(conversation_id: str):
    """Soft delete a conversation"""
    try:
        supabase.table("conversations").update({"is_active": False}).eq("id", conversation_id).execute()
    except APIError as e:
        raise RuntimeError(f"Database error deleting conversation: {e.message}")


def extract_context_from_query(query: str, conversation_context: str) -> Dict[str, Any]:
    """Extract contextual information from query and conversation history"""
    # Simple context extraction - can be enhanced with NLP
    context_info = {
        "has_reference": False,
        "reference_terms": [],
        "query_type": "general",
        "requires_context": False
    }
    
    # Look for reference terms that indicate context dependency
    reference_terms = [
        "this", "that", "these", "those", "it", "them", "they",
        "above", "below", "previous", "last", "earlier", "before",
        "breakdown", "details", "more", "also", "too", "as well"
    ]
    
    query_lower = query.lower()
    found_references = [term for term in reference_terms if term in query_lower]
    
    if found_references:
        context_info["has_reference"] = True
        context_info["reference_terms"] = found_references
        context_info["requires_context"] = True
    
    # Simple query type classification
    if any(word in query_lower for word in ["recommend", "suggest", "advice", "should", "optimize", "save", "cut"]):
        context_info["query_type"] = "recommendation"
    elif any(word in query_lower for word in ["analyze", "pattern", "trend", "compare", "vs", "versus"]):
        context_info["query_type"] = "analysis"
    elif any(word in query_lower for word in ["how much", "total", "sum", "count", "list", "show"]):
        context_info["query_type"] = "data_retrieval"
    
    return context_info