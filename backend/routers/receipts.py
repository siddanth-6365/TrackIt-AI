# app/routers/receipts.py
import asyncio
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from concurrent.futures import ThreadPoolExecutor
from typing import List
from services import ocr_service, llm_service, receipt_service

router = APIRouter(prefix="/receipts", tags=["receipts"])
executor = ThreadPoolExecutor(max_workers=4)

# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class ItemOut(BaseModel):
    description: str
    unit_price: float | None
    quantity: float | None

class ReceiptOut(BaseModel):
    id: int
    user_id: str
    merchant_name: str
    merchant_address: str | None
    merchant_phone: str | None
    merchant_email: str | None
    transaction_date: str
    subtotal_amount: float
    tax_amount: float
    total_amount: float
    expense_category: str | None
    payment_method: str | None
    image_url: str | None

    class Config:
        orm_mode = True

class ExtractedReceipt(BaseModel):
    merchant_name: str | None
    merchant_address: str | None
    merchant_phone: str | None
    merchant_email: str | None
    transaction_date: str | None
    subtotal_amount: float | None
    tax_amount: float | None
    total_amount: float | None
    expense_category: str | None
    payment_method: str | None
    items: List[ItemOut] = Field(default_factory=list)

class SaveReceiptRequest(BaseModel):
    user_id: str
    receipt: ExtractedReceipt

class ReceiptList(BaseModel):
    receipts: List[ReceiptOut]
    total: int

# ── Extract without saving ───────────────────────────────────────────────────
@router.post("/extract", response_model=ExtractedReceipt)
async def extract_receipt(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(400, "Cannot read upload")

    loop = asyncio.get_running_loop()
    raw_text = await loop.run_in_executor(executor, ocr_service.do_ocr, image_bytes)
    if not raw_text:
        raise HTTPException(400, "No text extracted")

    # parallel LLM calls
    details_task  = asyncio.create_task(llm_service.call_extract_details(raw_text))
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
    user_id: str = Form(...),
    file: UploadFile = File(...),
    payload: str = Form(...)
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
    user_id: str,
    limit: int = Query(50, ge=1),
    offset: int = Query(0, ge=0)
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
