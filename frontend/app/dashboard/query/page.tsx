"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { ConversationChat } from "@/components/conversation-chat"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { conversationAPI } from "@/lib/conversation-api"
import { Loader2 } from "lucide-react"

export default function ConversationalQueryPage() {
  const { user } = useAuth()
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      initializeConversation()
    }
  }, [user])

  const initializeConversation = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Initializing conversation for user:', user)
      // Get user's conversations
      const conversations = await conversationAPI.getUserConversations(user.id)
      
      if (conversations.conversations.length > 0) {
        // Use the most recent conversation
        setActiveConversationId(conversations.conversations[0].id)
      } else {
        // Create a new conversation
        await createNewConversation()
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error)
      // Create a new conversation as fallback
      await createNewConversation()
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = async () => {
    if (!user) return

    try {
      const newConversation = await conversationAPI.createConversation(
        user.id, 
        "New Conversation"
      )
      setActiveConversationId(newConversation.id)
    } catch (error) {
      console.error('Failed to create new conversation:', error)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId)
  }

  const handleTitleChange = async (title: string) => {
    // This could be enhanced to update the conversation title in the backend
    console.log('Conversation title updated:', title)
  }

  if (loading || !activeConversationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Setting up your conversation...</span>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversation Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationSidebar
          activeConversationId={activeConversationId}
          onConversationSelect={handleConversationSelect}
          onNewConversation={createNewConversation}
          className="h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <ConversationChat
          conversationId={activeConversationId}
          onTitleChange={handleTitleChange}
          className="h-full"
        />
      </div>
    </div>
  )
}