"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Bot, User, Brain, Database, BarChart3, Send, Sparkles, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { conversationAPI, type ConversationMessage, type ChatResponse } from "@/lib/conversation-api"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface ConversationChatProps {
  conversationId: string
  onTitleChange?: (title: string) => void
  className?: string
}

interface ChatMessage extends ConversationMessage {
  isLoading?: boolean
}

const suggestedQuestions = [
  {
    icon: TrendingUp,
    text: "How much did I spend on groceries this month?",
    category: "Spending Analysis",
  },
  {
    icon: BarChart3,
    text: "Show me my top 5 most expensive purchases",
    category: "Top Expenses",
  },
  {
    icon: Brain,
    text: "Analyze my spending patterns and give recommendations",
    category: "AI Insights",
  },
  {
    icon: Database,
    text: "What's my average monthly spending on restaurants?",
    category: "Data Query",
  },
]

export function ConversationChat({ conversationId, onTitleChange, className = "" }: ConversationChatProps) {
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
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
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
      console.error("Failed to load messages:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim()
    if (!userMessage || !user || loading) return

    setInput("")
    setLoading(true)

    // Add user message immediately
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: "user",
      content: userMessage,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      conversation_id: conversationId,
      role: "assistant",
      content: "",
      metadata: {},
      created_at: new Date().toISOString(),
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      const response: ChatResponse = await conversationAPI.sendChatMessage(conversationId, user.id, userMessage)

      // Remove loading message and add actual response
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading)
        return [
          ...withoutLoading,
          {
            id: response.message_id,
            conversation_id: conversationId,
            role: "assistant" as const,
            content: response.response,
            metadata: {
              agent: response.agent_used,
              classification: response.classification,
              ...response.metadata,
            },
            created_at: new Date().toISOString(),
          },
        ]
      })

      // Update conversation title if this is the first message
      if (messages.length === 0 && onTitleChange) {
        const title = userMessage.length > 30 ? userMessage.substring(0, 30) + "..." : userMessage
        onTitleChange(title)
      }
    } catch (error) {
      console.error("Chat error:", error)
      // Remove loading message and add error message
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading)
        return [
          ...withoutLoading,
          {
            id: `error-${Date.now()}`,
            conversation_id: conversationId,
            role: "assistant" as const,
            content: "I'm sorry, I encountered an error processing your request. Please try again.",
            metadata: { error: true },
            created_at: new Date().toISOString(),
          },
        ]
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const getAgentIcon = (agent?: string) => {
    switch (agent) {
      case "sql":
        return <Database className="h-3 w-3" />
      case "analysis":
        return <BarChart3 className="h-3 w-3" />
      case "hybrid":
        return <Brain className="h-3 w-3" />
      default:
        return <Bot className="h-3 w-3" />
    }
  }

  const getAgentColor = (agent?: string) => {
    switch (agent) {
      case "sql":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "analysis":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "hybrid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  if (initialLoading) {
    return (
      <Card className={cn("h-full flex flex-col border-0 shadow-lg", className)}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full flex flex-col border-0 shadow-lg", className)}>
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Bot className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Expense Assistant</h2>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Welcome to your AI Assistant!</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  I can help you analyze your expenses, find spending patterns, and answer questions about your
                  receipts.
                </p>

                <div className="grid gap-3 max-w-2xl mx-auto">
                  <p className="text-sm font-medium text-left mb-2">Try asking:</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(question.text)}
                      className="flex items-start gap-3 p-4 text-left rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 group"
                      disabled={loading}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors">
                        <question.icon className="h-4 w-4 text-gray-600 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-900">
                          {question.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{question.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 border-2 border-emerald-100">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                    message.role === "user" ? "bg-emerald-600 text-white ml-12" : "bg-white border border-gray-200",
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing your data...</span>
                    </div>
                  ) : (
                    <>
                      {/* <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                       */}
                      <div className="whitespace-pre-wrap text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Agent and classification info for assistant messages */}
                      {message.role === "assistant" && message.metadata?.agent && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                          <Badge
                            variant="outline"
                            className={cn("text-xs border", getAgentColor(message.metadata.agent))}
                          >
                            {getAgentIcon(message.metadata.agent)}
                            <span className="ml-1 capitalize">{message.metadata.agent} Agent</span>
                          </Badge>

                          {message.metadata.classification?.complexity && (
                            <Badge variant="outline" className="text-xs">
                              Complexity: {message.metadata.classification.complexity}
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="w-8 h-8 border-2 border-blue-100">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-3 border-t bg-gray-50/50 p-4">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              className="pr-12 bg-white border-gray-200 f"
              placeholder="Ask about your expenses, spending patterns, or get recommendations..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading}
              className="absolute right-1 top-1 h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
