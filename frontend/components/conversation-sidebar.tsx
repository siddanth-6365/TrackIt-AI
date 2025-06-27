"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, MessageSquare, Trash2, Clock, MoreHorizontal, Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { conversationAPI, type Conversation } from "@/lib/conversation-api"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ConversationSidebarProps {
  activeConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
  className?: string
}

export function ConversationSidebar({
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  className = "",
}: ConversationSidebarProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const result = await conversationAPI.getUserConversations(user.id)
      setConversations(result.conversations)
    } catch (error) {
      console.error("Failed to load conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await conversationAPI.deleteConversation(conversationId)
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

      // If we deleted the active conversation, create a new one
      if (activeConversationId === conversationId) {
        onNewConversation()
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const handleNewConversation = async () => {
    if (!user) return

    try {
      const newConversation = await conversationAPI.createConversation(user.id)
      setConversations((prev) => [newConversation, ...prev])
      onConversationSelect(newConversation.id)
    } catch (error) {
      console.error("Failed to create conversation:", error)
      onNewConversation() // Fallback to the parent's handler
    }
  }

  const formatConversationTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return "Unknown time"
    }
  }

  return (
    <Card className={cn("h-full flex flex-col border-0 shadow-lg", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          Conversations
        </CardTitle>
        <Button
          onClick={handleNewConversation}
          className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Start Your First Conversation</h3>
              <p className="text-sm text-gray-500 mb-4">
                Ask questions about your receipts, expenses, and spending patterns
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>💡 Try asking:</p>
                <p>"How much did I spend on food this month?"</p>
                <p>"Show me my largest expenses"</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50",
                    activeConversationId === conversation.id
                      ? "bg-emerald-50 border border-emerald-200 shadow-sm"
                      : "border border-transparent hover:border-gray-200",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            activeConversationId === conversation.id ? "bg-emerald-500" : "bg-gray-300",
                          )}
                        />
                        <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatConversationTime(conversation.updated_at)}</span>
                        </div>
                        {conversation.message_count > 0 && (
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            {conversation.message_count} messages
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-red-600 hover:text-red-700 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
