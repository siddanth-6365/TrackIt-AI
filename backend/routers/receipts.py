import json, asyncio
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel, Field
from concurrent.futures import ThreadPoolExecutor
from services import ocr_service, llm_service, receipt_service

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

@router.post("/upload", response_model=ReceiptOut)
async def upload_receipt(user_id: str = Form(...), file: UploadFile = File(...)):
    print("1. received request")
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(400, "Cannot read upload")
    print("2. read image bytes")
    
    loop = asyncio.get_running_loop()
    raw_text = await loop.run_in_executor(executor, ocr_service.do_ocr, image_bytes)
    print("3. ocr done")
    
    if not raw_text:
        raise HTTPException(400, "No text extracted from image")
    print("4. text extracted")
    
    # run LLM tasks concurrently
    details_task = asyncio.create_task(llm_service.call_extract_details(raw_text))
    cat_task     = asyncio.create_task(llm_service.call_expense_category(raw_text))
    print("5. llm tasks started")
    try:
        parsed, category = await asyncio.gather(details_task, cat_task)
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")
    print("6. llm tasks completed")
    try:
        rec = await receipt_service.save_receipt(user_id, parsed, category)
        print("7. receipt saved")
        return rec
    except Exception as e:
        raise HTTPException(500, str(e))