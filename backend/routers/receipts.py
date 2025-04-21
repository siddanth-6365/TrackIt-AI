import asyncio
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query
from pydantic import BaseModel, Field
from concurrent.futures import ThreadPoolExecutor
from services import ocr_service, llm_service, receipt_service
from typing import List

router = APIRouter(prefix="/receipts", tags=["receipts"])
executor = ThreadPoolExecutor(max_workers=4)

class ReceiptOut(BaseModel):
    id: int
    user_id: str
    vendor: str | None
    transaction_date: str | None
    total_amount: float | None
    expense_category: str | None
    items: list = Field(default_factory=list)
    
class ReceiptList(BaseModel):
    receipts: List[ReceiptOut]
    total:   int

class ExtractedReceipt(BaseModel):
    vendor: str | None
    transaction_date: str | None
    total_amount: float | None
    expense_category: str | None
    items: list = Field(default_factory=list)

class SaveRequest(BaseModel):
    user_id: str
    payload: ExtractedReceipt


# /receipts/extract
@router.post("/extract", response_model=ExtractedReceipt)
async def extract_receipt(user_id: str = Form(...), file: UploadFile = File(...)):
    """
    1️⃣  OCR + LLM only.  Returns extracted JSON for UI review.
    Nothing is written to the database.
    """
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(400, "Cannot read upload")

    loop = asyncio.get_running_loop()
    raw_text = await loop.run_in_executor(executor, ocr_service.do_ocr, image_bytes)
    if not raw_text:
        raise HTTPException(400, "No text extracted")

    details_task = asyncio.create_task(llm_service.call_extract_details(raw_text))
    cat_task     = asyncio.create_task(llm_service.call_expense_category(raw_text))

    try:
        parsed, category = await asyncio.gather(details_task, cat_task)
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")

    parsed["expense_category"] = category
    return parsed


@router.post("/save", response_model=ReceiptOut)
async def save_receipt(req: SaveRequest):
    rec = await receipt_service.save_receipt(
        req.user_id,
        req.payload.dict(),
        req.payload.expense_category,
    )
    return rec

    
# /receipts/user/{user_id}
@router.get(
    "/user/{user_id}",
    response_model=ReceiptList,
    summary="Get all receipts for a user (paginated)",
)
async def get_user_receipts(
    user_id: str,
    limit: int = Query(50),
    offset: int = Query(0),
):
    """
    Fetch receipts belonging to `user_id`.
    Optional query params:
      • limit  – max rows returned (default 50)  
      • offset – pagination start (default 0)
    """
    try:
        records, total = await receipt_service.get_receipts(user_id, limit, offset)
        return ReceiptList(receipts=records, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# /receipts/upload
# @router.post("/upload", response_model=ReceiptOut)
# async def upload_receipt(user_id: str = Form(...), file: UploadFile = File(...)):
#     print("1. received request")
#     try:
#         image_bytes = await file.read()
#     except Exception:
#         raise HTTPException(400, "Cannot read upload")
#     print("2. read image bytes")
    
#     loop = asyncio.get_running_loop()
#     raw_text = await loop.run_in_executor(executor, ocr_service.do_ocr, image_bytes)
#     print("3. ocr done")
    
#     if not raw_text:
#         raise HTTPException(400, "No text extracted from image")
#     print("4. text extracted")
    
#     # run LLM tasks concurrently
#     details_task = asyncio.create_task(llm_service.call_extract_details(raw_text))
#     cat_task     = asyncio.create_task(llm_service.call_expense_category(raw_text))
#     print("5. llm tasks started")
#     try:
#         parsed, category = await asyncio.gather(details_task, cat_task)
#     except Exception as e:
#         raise HTTPException(500, f"LLM error: {e}")
#     print("6. llm tasks completed")
#     try:
#         rec = await receipt_service.save_receipt(user_id, parsed, category)
#         print("7. receipt saved")
#         return rec
#     except Exception as e:
#         raise HTTPException(500, str(e))