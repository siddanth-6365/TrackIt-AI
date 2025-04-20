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


async def get_receipts(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    Return (records, total_count) for a user with optional
    limit/offset pagination.
    """
    from postgrest.exceptions import APIError

    try:
        query = (
            supabase.table("receipts")
            .select("*", count="exact")        # count header
            .eq("user_id", user_id)
            .order("transaction_date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
    except APIError as e:
        raise ValueError(f"Supabase select failed: {e.message}") from e

    return query.data or [], query.count or 0