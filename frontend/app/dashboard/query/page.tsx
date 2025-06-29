"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { ConversationChat } from "@/components/conversation-chat"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { conversationAPI } from "@/lib/conversation-api"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot } from "lucide-react"

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
      console.log("Initializing conversation for user:", user)
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
      console.error("Failed to initialize conversation:", error)
      // Create a new conversation as fallback
      await createNewConversation()
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = async () => {
    if (!user) return

    try {
      const newConversation = await conversationAPI.createConversation(user.id, "New Conversation")
      setActiveConversationId(newConversation.id)
    } catch (error) {
      console.error("Failed to create new conversation:", error)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId)
  }

  const handleTitleChange = async (title: string) => {
    // This could be enhanced to update the conversation title in the backend
    console.log("Conversation title updated:", title)
  }

  if (loading || !activeConversationId) {
    return (
      <div className="space-y-6">
        {/* <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Query Assistant</h1>
          <p className="text-muted-foreground">Ask questions about your receipts and expenses</p>
        </div> */}

        <div className="h-[calc(100vh-12rem)] flex gap-6">
          {/* Sidebar Skeleton */}
          <Card className="w-80 flex-shrink-0 p-4">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Chat Skeleton */}
          <Card className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-muted-foreground">Setting up your AI assistant...</p>
                <p className="text-sm text-muted-foreground mt-2">This will just take a moment</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
          <Bot className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Query Assistant</h1>
          <p className="text-muted-foreground">Ask questions about your receipts and expenses</p>
        </div>
      </div> */}

      <div className="h-[calc(100vh-8rem)] flex gap-6">
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
    </div>
  )
}
