"""
Multi-Agent Query Processing System
Handles routing between SQL Agent, Analysis Agent, and Query Classification
"""

import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from services.conversation_service import ConversationMemory, extract_context_from_query
from services.query_service import (
    validate_question,
    get_sql_from_question,
    execute_sql_in_supabase,
    explain_query_2,
)
from services.supabase_client import supabase
from .groq_client import groqClient


class QueryClassifier:
    """Classifies queries and routes them to appropriate agents"""

    @staticmethod
    async def classify_query(
        query: str, conversation_memory: ConversationMemory
    ) -> Dict[str, Any]:
        """
        Classify query complexity and determine routing
        Returns: {
            "agent": "sql" | "analysis" | "hybrid",
            "complexity": 1 | 2 | 3,
            "requires_context": bool,
            "query_type": str,
            "reasoning": str
        }
        """
        context_info = extract_context_from_query(
            query, conversation_memory.get_conversation_context()
        )

        classification_prompt = f"""
You are a query classifier for a personal expense tracking system. Classify this user query:

Query: "{query}"

Recent conversation context:
{conversation_memory.get_conversation_context()}

Classify based on these criteria:

COMPLEXITY LEVELS:
1. Simple data retrieval (basic SQL queries)
2. Context-aware follow-ups (require conversation history)  
3. Complex analysis (insights, recommendations, patterns)

AGENT TYPES:
- sql: Direct database queries, simple calculations
- analysis: Complex analysis, recommendations, insights
- hybrid: Requires both data retrieval and analysis

Return ONLY a JSON object:
{{
    "agent": "sql|analysis|hybrid",
    "complexity": 1|2|3,
    "requires_context": true|false,
    "query_type": "data_retrieval|analysis|recommendation|follow_up",
    "reasoning": "Brief explanation of classification"
}}
"""

        try:
            resp = groqClient.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": classification_prompt}],
                temperature=0.1,
                max_completion_tokens=200,
                response_format={"type": "json_object"},
            )

            classification = json.loads(resp.choices[0].message.content)

            # Override with context info if needed
            if context_info["requires_context"]:
                classification["requires_context"] = True
                if classification["complexity"] == 1:
                    classification["complexity"] = 2

            return classification

        except Exception as e:
            # Fallback classification
            print(f"Classification error: {e}")
            return {
                "agent": "sql",
                "complexity": 1 if not context_info["requires_context"] else 2,
                "requires_context": context_info["requires_context"],
                "query_type": context_info["query_type"],
                "reasoning": "Fallback classification due to error",
            }


class SQLAgent:
    """Handles direct data retrieval queries"""

    @staticmethod
    async def process_query(
        query: str,
        user_id: str,
        conversation_memory: ConversationMemory,
        classification: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Process SQL-based queries with optional context"""

        # Enhance query with context if needed
        enhanced_query = query
        if classification.get("requires_context") and conversation_memory.messages:
            context = conversation_memory.get_conversation_context()
            enhanced_query = f"""
Based on our conversation:
{context}

Current question: {query}

Please provide a complete answer considering the conversation context.
"""

        # Validate question
        if not validate_question(enhanced_query):
            return {
                "success": False,
                "error": "Invalid question. Please ask about your expenses or receipts.",
                "agent": "sql",
            }

        try:
            print(f"Processing SQL query: {enhanced_query}")
            # Generate SQL
            sql = await asyncio.get_running_loop().run_in_executor(
                None, get_sql_from_question, enhanced_query, user_id
            )
            print(f"Generated SQL: {sql}")

            # Execute SQL
            rows = execute_sql_in_supabase(supabase, sql)
            print(f"SQL execution result: {rows}")

            # Generate explanation
            answer = await asyncio.get_running_loop().run_in_executor(
                None, explain_query_2, sql, rows, enhanced_query
            )

            return {
                "success": True,
                "sql": sql,
                "result": rows,
                "answer": answer,
                "agent": "sql",
                "metadata": {
                    "row_count": len(rows),
                    "has_context": classification.get("requires_context", False),
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"SQL processing error: {str(e)}",
                "agent": "sql",
            }


class AnalysisAgent:
    """Handles complex analysis and recommendations"""

    @staticmethod
    async def process_query(
        query: str,
        user_id: str,
        conversation_memory: ConversationMemory,
        classification: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Process analysis queries with insights and recommendations"""

        try:
            # First, get relevant data
            data_context = await AnalysisAgent._get_expense_data_context(user_id)
            print(f"Data context for analysis: {data_context}")

            # Build analysis prompt
            analysis_prompt = f"""
You are an AI financial advisor analyzing personal expense data. 

User Question: "{query}"

Recent Conversation:
{conversation_memory.get_conversation_context()}

Expense Data Context:
{data_context}

Provide a comprehensive analysis including:
1. Direct answer to the question
2. Key insights and patterns
3. Actionable recommendations
4. Specific suggestions for optimization

Be conversational, helpful, and specific. Use actual numbers from the data.
"""

            resp = groqClient.chat.completions.create(
                model="meta-llama/llama-4-maverick-17b-128e-instruct",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.3,
                max_completion_tokens=800,
            )

            analysis = resp.choices[0].message.content

            return {
                "success": True,
                "answer": analysis,
                "agent": "analysis",
                "metadata": {
                    "analysis_type": classification.get("query_type", "general"),
                    "data_points": len(data_context.split("\n")) if data_context else 0,
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Analysis error: {str(e)}",
                "agent": "analysis",
            }

    @staticmethod
    async def _get_expense_data_context(user_id: str) -> str:
        """Get relevant expense data for analysis"""
        try:
            # Get recent spending summary
            summary_sql = f"""
            SELECT 
                expense_category,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_spent,
                AVG(total_amount) as avg_amount,
                MAX(transaction_date) as latest_date,
                MIN(transaction_date) as earliest_date
            FROM receipts 
            WHERE user_id = '{user_id}' 
                AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY expense_category
            ORDER BY total_spent DESC
            """

            summary_data = execute_sql_in_supabase(supabase, summary_sql)
            print(f"Summary data: {summary_data}")

            # Get top merchants
            merchant_sql = f"""
            SELECT 
                merchant_name,
                COUNT(*) as visit_count,
                SUM(total_amount) as total_spent
            FROM receipts 
            WHERE user_id = '{user_id}' 
                AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY merchant_name
            ORDER BY total_spent DESC
            LIMIT 10
            """

            merchant_data = execute_sql_in_supabase(supabase, merchant_sql)
            print(f"Merchant data: {merchant_data}")

            # Format context
            context_parts = []

            if summary_data:
                context_parts.append("SPENDING BY CATEGORY (Last 90 days):")
                for row in summary_data:
                    context_parts.append(
                        f"- {row.get('expense_category', 'Unknown')}: ${row.get('total_spent', 0):.2f} ({row.get('transaction_count', 0)} transactions)"
                    )

            if merchant_data:
                context_parts.append("\nTOP MERCHANTS:")
                for row in merchant_data[:5]:
                    context_parts.append(
                        f"- {row.get('merchant_name', 'Unknown')}: ${row.get('total_spent', 0):.2f} ({row.get('visit_count', 0)} visits)"
                    )

            return "\n".join(context_parts)

        except Exception as e:
            print(f"Error getting expense context: {e}")
            return "No expense data available for analysis."


class ConversationalQueryEngine:
    """Main orchestrator for conversational queries"""

    @staticmethod
    async def process_conversational_query(
        query: str, user_id: str, conversation_id: str
    ) -> Dict[str, Any]:
        """
        Process a conversational query with full context and routing
        """
        try:
            # Load conversation memory
            from services.conversation_service import load_conversation_memory

            memory = await load_conversation_memory(conversation_id)
            print("memory fetched has:", memory.get_conversation_context())

            # Classify the query
            classification = await QueryClassifier.classify_query(query, memory)
            print(f"Query classification: {classification}")

            # Route to appropriate agent
            result = None
            if classification["agent"] == "sql":
                result = await SQLAgent.process_query(
                    query, user_id, memory, classification
                )
            elif classification["agent"] == "analysis":
                result = await AnalysisAgent.process_query(
                    query, user_id, memory, classification
                )
            elif classification["agent"] == "hybrid":
                # Process with both agents and combine results
                sql_result = await SQLAgent.process_query(
                    query, user_id, memory, classification
                )
                analysis_result = await AnalysisAgent.process_query(
                    query, user_id, memory, classification
                )

                result = {
                    "success": True,
                    "answer": f"{sql_result.get('answer', '')}\n\n{analysis_result.get('answer', '')}",
                    "agent": "hybrid",
                    "sql_data": sql_result.get("result", []),
                    "metadata": {
                        "sql_metadata": sql_result.get("metadata", {}),
                        "analysis_metadata": analysis_result.get("metadata", {}),
                    },
                }

            # Add classification info to result
            if result:
                result["classification"] = classification

            return result or {
                "success": False,
                "error": "Unknown processing error",
                "agent": "unknown",
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Query processing error: {str(e)}",
                "agent": "error",
            }
