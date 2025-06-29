"""
receipts router for handling receipt extraction, saving, and listing.
"""

import asyncio
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from concurrent.futures import ThreadPoolExecutor
from typing import List
from services import ocr_service, llm_service, receipt_service
from schemas.receipts import (
    ItemOut,
    ReceiptOut,
    ExtractedReceipt,
    SaveReceiptRequest,
    ReceiptList,
)

router = APIRouter(prefix="/receipts", tags=["receipts"])
executor = ThreadPoolExecutor(max_workers=4)


# ── Extract without saving ───────────────────────────────────────────────────
@router.post("/extract", response_model=ExtractedReceipt)
async def extract_receipt(user_id: str = Form(...), file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(400, "Cannot read upload")

    loop = asyncio.get_running_loop()
    raw_text = await loop.run_in_executor(executor, ocr_service.do_ocr, image_bytes)
    if not raw_text:
        raise HTTPException(400, "No text extracted")

    # parallel LLM calls
    details_task = asyncio.create_task(llm_service.call_extract_details(raw_text))
    category_task = asyncio.create_task(llm_service.call_expense_category(raw_text))

    try:
        details, category = await asyncio.gather(details_task, category_task)
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")

    details["expense_category"] = category
    print("details", details)
    return details


# ── Save + upload image to S3 + split into two tables ─────────────────═══════
@router.post("/save", response_model=ReceiptOut)
async def save_receipt(
    user_id: str = Form(...), file: UploadFile = File(...), payload: str = Form(...)
):
    """
    1) Upload receipt image to S3
    2) Insert into `receipts` + `receipt_items`
    3) Return full ReceiptOut
    """
    # parse extracted JSON payload
    try:
        data = ExtractedReceipt.parse_raw(payload).dict()
    except Exception:
        raise HTTPException(422, "Invalid payload JSON")

    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(400, "Cannot read upload")

    try:
        saved = await receipt_service.save_receipt(user_id, data, image_bytes)
    except Exception as e:
        raise HTTPException(500, f"Save error: {e}")

    return saved


# ── List receipts ───────────────────────────────────────────────────────────
@router.get("/user/{user_id}", response_model=ReceiptList)
async def list_receipts(
    user_id: str, limit: int = Query(50, ge=1), offset: int = Query(0, ge=0)
):
    try:
        records, total = await receipt_service.get_receipts(user_id, limit, offset)
        return ReceiptList(receipts=records, total=total)
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Fetch items for a single receipt ────────────────────────────────────────
@router.get("/{receipt_id}/items", response_model=List[ItemOut])
async def get_receipt_items(receipt_id: int):
    try:
        items = await receipt_service.get_items(receipt_id)
        return items
    except Exception as e:
        raise HTTPException(500, str(e))
