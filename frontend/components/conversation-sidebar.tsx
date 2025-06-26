"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Clock,
  MoreHorizontal,
  Bot
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { conversationAPI, type Conversation } from "@/lib/conversation-api"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  className = "" 
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
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await conversationAPI.deleteConversation(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      // If we deleted the active conversation, create a new one
      if (activeConversationId === conversationId) {
        onNewConversation()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleNewConversation = async () => {
    if (!user) return
    
    try {
      const newConversation = await conversationAPI.createConversation(user.id)
      setConversations(prev => [newConversation, ...prev])
      onConversationSelect(newConversation.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
      onNewConversation() // Fallback to the parent's handler
    }
  }

  const formatConversationTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <div className="p-4 border-b">
        <Button 
          onClick={handleNewConversation}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bot className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start your first conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    activeConversationId === conversation.id 
                      ? 'bg-emerald-50 border border-emerald-200' 
                      : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <h3 className="text-sm font-medium truncate">
                          {conversation.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatConversationTime(conversation.updated_at)}</span>
                        {conversation.message_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {conversation.message_count}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
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