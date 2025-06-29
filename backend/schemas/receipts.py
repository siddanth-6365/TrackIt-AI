# ── Pydantic Schemas ─────────────────────────────────────────────────────────
from pydantic import BaseModel, Field
from typing import List, Optional


class ItemOut(BaseModel):
    description: Optional[str]  # Allow None for description
    unit_price: Optional[float]
    quantity: Optional[float]


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
    created_at: str

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
