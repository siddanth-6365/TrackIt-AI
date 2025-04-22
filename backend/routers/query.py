import asyncio
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from postgrest.exceptions import APIError

from services import query_service
from services.supabase_client import supabase

router = APIRouter(prefix="/query", tags=["query"])

class QueryRequest(BaseModel):
    q: str
    user_id: str

class QueryResponse(BaseModel):
    sql: str
    result: List[Dict[str, Any]]
    answer: str          # <<< new field for the human‑readable summary

@router.post("/ask", response_model=QueryResponse)
async def run_nl_query(req: QueryRequest):
    # 1. NL ➔ SQL
    try:
        sql = await asyncio.get_running_loop().run_in_executor(
            None,
            query_service.get_gemini_response,
            req.q,
            req.user_id
        )
    except Exception as e:
        raise HTTPException(500, f"Error generating SQL: {e}")

    clean_sql = sql.strip().rstrip(";")

    # 2. Execute SQL
    try:
        rows = query_service.execute_sql_in_supabase(supabase, clean_sql)
    except Exception as e:
        raise HTTPException(500, f"Database error: {e}") from e

    # 3. Explain result via Groq AI
    try:
        answer = await asyncio.get_running_loop().run_in_executor(
            None,
            query_service.explain_query,
            rows
        )
    except Exception as e:
        raise HTTPException(500, f"Error explaining result: {e}") from e

    return {
        "sql": clean_sql,
        "result": rows,
        "answer": answer,   # now included in the response
    }
