from services.supabase_client import supabase
from postgrest.exceptions import APIError
import datetime, asyncio
from services.s3_client import upload_image_to_s3
from typing import Dict, Any, List

async def save_receipt(
    user_id: str,
    parsed: Dict[str, Any],
    image_bytes: bytes
) -> Dict[str, Any]:
    """
    1) Upload receipt image to S3
    2) Insert into `receipts` table
    3) Insert each line-item into `receipt_items` table
    4) Return the full saved receipt record
    """
    # 1️⃣ Upload image and get URL
    try:
        image_url = await upload_image_to_s3(image_bytes)
    except Exception as e:
        raise RuntimeError(f"Image upload failed: {e}")

    # 2️⃣ Prepare receipt row
    receipt_row: Dict[str, Any] = {
        "user_id":          user_id,
        "merchant_name":    parsed.get("merchant_name"),
        "merchant_address": parsed.get("merchant_address"),
        "merchant_phone":   parsed.get("merchant_phone"),
        "merchant_email":   parsed.get("merchant_email"),
        "transaction_date": parsed.get("transaction_date"),
        "subtotal_amount":  parsed.get("subtotal_amount"),
        "tax_amount":       parsed.get("tax_amount"),
        "total_amount":     parsed.get("total_amount"),
        "expense_category": parsed.get("expense_category"),
        "payment_method":   parsed.get("payment_method"),
        "image_url":        image_url,
        "created_at":       datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    # 3️⃣ Insert into receipts
    try:
        resp = supabase.table("receipts").insert(receipt_row).execute()
    except APIError as e:
        raise RuntimeError(f"Receipt insert failed: {e.message}")

    # ensure data returned
    if not resp.data or len(resp.data) == 0:
        raise RuntimeError("Receipt insert returned no data")

    saved_receipt = resp.data[0]
    receipt_id = saved_receipt.get("id")

    # 4️⃣ Insert line-items
    items: List[Dict[str, Any]] = parsed.get("items", []) or []
    if items:
        item_rows = [
            {
                "receipt_id": receipt_id,
                "description": it.get("description"),
                "unit_price":  it.get("unit_price"),
                "quantity":    it.get("quantity")
            }
            for it in items
        ]
        try:
            resp_items = supabase.table("receipt_items").insert(item_rows).execute()
        except APIError as e:
            raise RuntimeError(f"Items insert failed: {e.message}")

    # 5️⃣ Return the saved receipt
    return saved_receipt


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


async def get_items(receipt_id: int) -> list[dict]:
    try:
        query = (
            supabase.table("receipt_items")
            .select("*")
            .eq("receipt_id", receipt_id)
            .execute()
        )
    except APIError as e:
        raise ValueError(f"Supabase select failed: {e.message}") from e

    return query.data or []