"""
Conversation API Router
Handles conversational chat endpoints and conversation management
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from services.conversation_service import (
    create_conversation,
    get_conversation,
    get_user_conversations,
    save_message,
    get_conversation_messages,
    delete_conversation,
)
from services.query_agent import ConversationalQueryEngine
from schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    MessageResponse,
    ChatMessage,
    ChatResponse,
    ConversationList,
    MessageList,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("/", response_model=ConversationResponse)
async def create_new_conversation(conversation: ConversationCreate):
    """Create a new conversation session"""
    try:
        result = await create_conversation(conversation.user_id, conversation.title)
        return ConversationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}", response_model=ConversationList)
async def get_user_conversation_list(
    user_id: str, limit: int = Query(50, ge=1, le=100)
):
    """Get user's conversation history"""
    try:
        conversations = await get_user_conversations(user_id, limit)
        return ConversationList(
            conversations=[ConversationResponse(**conv) for conv in conversations],
            total=len(conversations),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_details(conversation_id: str):
    """Get conversation details"""
    try:
        conversation = await get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return ConversationResponse(**conversation)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{conversation_id}/messages", response_model=MessageList)
async def get_conversation_message_history(
    conversation_id: str, limit: int = Query(50, ge=1, le=100)
):
    """Get messages for a conversation"""
    try:
        raw_messages = await get_conversation_messages(conversation_id, limit)
        messages = [
            json.loads(msg) if isinstance(msg, str) else msg for msg in raw_messages
        ]
        # Ensure metadata is always a dict
        for msg in messages:
            if "metadata" in msg and isinstance(msg["metadata"], str):
                try:
                    msg["metadata"] = json.loads(msg["metadata"])
                except Exception:
                    msg["metadata"] = {}
            elif "metadata" not in msg or msg["metadata"] is None:
                msg["metadata"] = {}
        return MessageList(
            messages=[MessageResponse(**msg) for msg in messages], total=len(messages)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{conversation_id}/chat", response_model=ChatResponse)
async def send_chat_message(conversation_id: str, user_id: str, message: ChatMessage):
    """
    Send a message in a conversation and get AI response
    This is the main conversational endpoint
    """
    try:
        # Verify conversation exists
        conversation = await get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Process query with conversational AI
        ai_response = await ConversationalQueryEngine.process_conversational_query(
            query=message.message, user_id=user_id, conversation_id=conversation_id
        )

        if not ai_response.get("success", False):
            error_msg = ai_response.get("error", "Unknown error occurred")
            await save_message(
                conversation_id=conversation_id, role="user", content=message.message
            )
            # Save error response
            await save_message(
                conversation_id=conversation_id,
                role="assistant",
                content=f"I'm sorry, I encountered an error: {error_msg}",
                metadata={"error": True, "original_error": error_msg},
            )
            raise HTTPException(status_code=500, detail=error_msg)

        # Save user message
        user_message = await save_message(
            conversation_id=conversation_id, role="user", content=message.message
        )

        # Save assistant response
        assistant_message = await save_message(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response["answer"],
            metadata={
                "agent": ai_response.get("agent", "unknown"),
                "classification": ai_response.get("classification", {}),
                "sql_query": ai_response.get("sql"),
                "result_count": len(ai_response.get("result", [])),
                **ai_response.get("metadata", {}),
            },
        )

        return ChatResponse(
            message_id=assistant_message["id"],
            response=ai_response["answer"],
            conversation_id=conversation_id,
            agent_used=ai_response.get("agent", "unknown"),
            classification=ai_response.get("classification"),
            metadata=ai_response.get("metadata"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")


@router.delete("/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str):
    """Delete (deactivate) a conversation"""
    try:
        await delete_conversation(conversation_id)
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Backward compatibility endpoint - Enhanced version of original /query/ask
@router.post("/quick-query", response_model=ChatResponse)
async def quick_query(user_id: str, message: ChatMessage):
    """
    Quick query without creating a persistent conversation
    Creates a temporary conversation for one-off queries
    """
    try:
        # Create temporary conversation
        temp_conversation = await create_conversation(
            user_id=user_id, title="Quick Query"
        )

        # Process the query
        response = await send_chat_message(
            conversation_id=temp_conversation["id"], user_id=user_id, message=message
        )

        # Optionally delete the temporary conversation
        # await delete_conversation(temp_conversation["id"])

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick query error: {str(e)}")
