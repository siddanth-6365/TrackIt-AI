/**
 * Conversation API Client for TrackIt-AI
 * Handles conversational chat and conversation management
 */

import { apiURL } from './api'

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  is_active: boolean
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, any>
  created_at: string
}

export interface ChatResponse {
  message_id: string
  response: string
  conversation_id: string
  agent_used: string
  classification?: {
    agent: string
    complexity: number
    requires_context: boolean
    query_type: string
    reasoning: string
  }
  metadata?: Record<string, any>
}

export interface ConversationList {
  conversations: Conversation[]
  total: number
}

export interface MessageList {
  messages: ConversationMessage[]
  total: number
}

export class ConversationAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = apiURL
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    if (!userId) {
      throw new Error('User ID is required to create a conversation')
    }
   
    const response = await fetch(`${this.baseUrl}/conversations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        title: title || 'New Conversation' 
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get user's conversation list
   */
  async getUserConversations(userId: string, limit = 50): Promise<ConversationList> {
    if (!userId) {
      throw new Error('User ID is required to get conversations')
    }
    const response = await fetch(
      `${this.baseUrl}/conversations/user/${userId}?limit=${limit}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get conversations: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get conversation details
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`)

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string, limit = 50): Promise<MessageList> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/messages?limit=${limit}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Send a chat message and get AI response
   */
  async sendChatMessage(
    conversationId: string, 
    userId: string, 
    message: string
  ): Promise<ChatResponse> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/chat?user_id=${userId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Chat error: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Quick query without persistent conversation
   */
  async quickQuery(userId: string, message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/conversations/quick-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        message 
      })
    })

    if (!response.ok) {
      const errorText = await response.json()
      console.error('Quick query error:', errorText)
      throw new Error(`Quick query error: ${errorText.detail}`)
    }

    return response.json()
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`)
    }
  }
}

// Export singleton instance
export const conversationAPI = new ConversationAPI()