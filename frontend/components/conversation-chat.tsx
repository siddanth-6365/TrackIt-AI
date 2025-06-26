"use client"

import React, { useState, useRef, useEffect, FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bot, User, Brain, Database, BarChart3 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { conversationAPI, type ConversationMessage, type ChatResponse } from "@/lib/conversation-api"

interface ConversationChatProps {
  conversationId: string
  onTitleChange?: (title: string) => void
  className?: string
}

interface ChatMessage extends ConversationMessage {
  isLoading?: boolean
}

export function ConversationChat({ 
  conversationId, 
  onTitleChange,
  className = "" 
}: ConversationChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load conversation messages on mount
  useEffect(() => {
    loadMessages()
  }, [conversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      setInitialLoading(true)
      const messageList = await conversationAPI.getConversationMessages(conversationId)
      setMessages(messageList.messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || loading) return

    const userMessage = input.trim()
    setInput("")
    setLoading(true)

    // Add user message immediately
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      metadata: {},
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      metadata: {},
      created_at: new Date().toISOString(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      const response: ChatResponse = await conversationAPI.sendChatMessage(
        conversationId,
        user.id,
        userMessage
      )

      // Remove loading message and add actual response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading)
        return [...withoutLoading, {
          id: response.message_id,
          conversation_id: conversationId,
          role: 'assistant' as const,
          content: response.response,
          metadata: {
            agent: response.agent_used,
            classification: response.classification,
            ...response.metadata
          },
          created_at: new Date().toISOString()
        }]
      })

      // Update conversation title if this is the first message
      if (messages.length === 0 && onTitleChange) {
        const title = userMessage.length > 30 
          ? userMessage.substring(0, 30) + "..." 
          : userMessage
        onTitleChange(title)
      }

    } catch (error) {
      console.error('Chat error:', error)
      // Remove loading message and add error message
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading)
        return [...withoutLoading, {
          id: `error-${Date.now()}`,
          conversation_id: conversationId,
          role: 'assistant' as const,
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
          metadata: { error: true },
          created_at: new Date().toISOString()
        }]
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const getAgentIcon = (agent?: string) => {
    switch (agent) {
      case 'sql': return <Database className="h-3 w-3" />
      case 'analysis': return <BarChart3 className="h-3 w-3" />
      case 'hybrid': return <Brain className="h-3 w-3" />
      default: return <Bot className="h-3 w-3" />
    }
  }

  const getAgentColor = (agent?: string) => {
    switch (agent) {
      case 'sql': return 'bg-blue-100 text-blue-800'
      case 'analysis': return 'bg-purple-100 text-purple-800'
      case 'hybrid': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (initialLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading conversation...</span>
      </div>
    )
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-emerald-600" />
          AI Expense Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 min-h-0 p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 px-4 pb-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Start Your Conversation</p>
                <p className="text-sm">
                  Ask me anything about your expenses, receipts, or spending patterns!
                </p>
                <div className="mt-4 space-y-2 text-xs text-left max-w-md mx-auto">
                  <p className="font-medium">Try asking:</p>
                  <ul className="space-y-1 text-gray-400">
                    <li>• "How much did I spend on groceries this month?"</li>
                    <li>• "Show me my top 5 most expensive purchases"</li>
                    <li>• "Analyze my spending patterns and give recommendations"</li>
                  </ul>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {/* Agent and classification info for assistant messages */}
                      {message.role === 'assistant' && message.metadata?.agent && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <Badge 
                            variant="secondary" 
                            className={`${getAgentColor(message.metadata.agent)} border-0`}
                          >
                            {getAgentIcon(message.metadata.agent)}
                            <span className="ml-1 capitalize">
                              {message.metadata.agent}
                            </span>
                          </Badge>
                          
                          {message.metadata.classification?.complexity && (
                            <Badge variant="outline" className="text-xs">
                              Level {message.metadata.classification.complexity}
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form
          onSubmit={sendMessage}
          className="flex gap-2 border-t p-4 bg-white"
        >
          <Input
            ref={inputRef}
            className="flex-1"
            placeholder="Ask about your expenses, spending patterns, or get recommendations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}