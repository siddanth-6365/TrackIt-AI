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

@router.post("/", response_model=QueryResponse)
async def run_nl_query(req: QueryRequest):
    """
    1) Generate SQL from natural language via Gemini, scoped to user_id.
    2) Execute that SQL via the Supabase run_sql RPC.
    """
    # 1. Generate SQL
    try:
        sql: str = await asyncio.get_running_loop().run_in_executor(
            None,
            query_service.get_gemini_response,
            req.q,
            req.user_id
        )
    except Exception as e:
        raise HTTPException(500, f"Error generating SQL: {e}")
    print("1. SQL generated :", sql)
    # cleaning this sql by removing leading/trailing whitespace and trailing semicolon
    clean_sql = sql.strip().rstrip(";")

    # 2. Execute SQL in Postgres via RPC
    try:
        resp_data = query_service.execute_sql_in_supabase(supabase, clean_sql)
    except Exception as e:
        print("Database error :", str(e))
        raise HTTPException(500, f"Database error: {str(e)}") from e
    print("2. Database query executed")

    return {"sql": clean_sql, "result": resp_data}
