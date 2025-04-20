from services.supabase_client import supabase
from postgrest.exceptions import APIError
import datetime, asyncio


async def save_receipt(user_id: str, parsed: dict, category: str) -> dict:
    data = parsed.copy()
    data["user_id"] = user_id
    data["expense_category"] = category

    # ensure ISO‑8601 date string
    if isinstance(data.get("transaction_date"), datetime.date):
        data["transaction_date"] = data["transaction_date"].isoformat()

    try:
        resp = supabase.table("receipts").insert(data).execute()
    except APIError as e:
        raise ValueError(f"Supabase insert failed: {e.message}") from e

    # resp.data is always a list for inserts
    return resp.data[0]


async def get_receipts(user_id: str) -> list[dict]:
    try:
        resp = (
            supabase.table("receipts")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        raise ValueError(f"Supabase select failed: {e.message}") from e

    return resp.data or []