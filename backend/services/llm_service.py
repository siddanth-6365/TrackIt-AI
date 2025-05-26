import json, asyncio
from unicodedata import category
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


receipt_schema = {
    "name": "receipt_details",        # ← a unique name for your schema
    "schema": {
        "type": "object",
        "properties": {
            "merchant_name":     {"type": "string", "nullable": True},
            "merchant_address":  {"type": "string", "nullable": True},
            "merchant_phone":    {"type": "string", "nullable": True},
            "merchant_email":    {"type": "string", "nullable": True},
            "transaction_date":  {"type": "string", "format": "date", "nullable": True},
            "subtotal_amount":   {"type": "number", "nullable": True},
            "tax_amount":        {"type": "number", "nullable": True},
            "total_amount":      {"type": "number", "nullable": True},
            "payment_method":    {"type": "string", "nullable": True},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "unit_price":  {"type": "number", "nullable": True},
                        "quantity":    {"type": "number", "nullable": True}
                    }
                }
            }
        },
        "required": []  # you can list required keys if you want
    }
}

category_schema = {
    "name": "expense_category",
    "schema": {
        "type": "object",
        "properties": {
            "expense_category": {"type": "string"}
        },
        "required": ["expense_category"]
    }
}

def clean_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[-1]
    return text.strip()

def call_extract_details_sync(ocr_text: str) -> str:
    prompt = f"""
You are an expert receipt parser.  Return ONLY a JSON object with these keys (no markdown fences):

{{
  "merchant_name":     string | null,
  "merchant_address":  string | null,
  "merchant_phone":    string | null,
  "merchant_email":    string | null,
  "transaction_date":  "YYYY-MM-DD" | null,
  "subtotal_amount":   number | null,
  "tax_amount":        number | null,
  "total_amount":      number | null,
  "payment_method":    string | null,
  "items": [  // zero or more
    {{
      "description": string,
      "unit_price":  number | null,
      "quantity":    number | null
    }}
  ]
}}

Receipt text:
{ocr_text}

Output only JSON.
"""
    comp = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role":"user","content":prompt}],
        temperature=0.2,
        max_completion_tokens=1024,
        top_p=1,
        stream=False,
        response_format={
            "type": "json_schema",
            "json_schema": receipt_schema
        }
    )
    resp = comp.choices[0].message.content
    return resp

def call_expense_category_sync(ocr_text: str) -> str:
    prompt = (
        "You are an expert financial expense categorizer. "
        "Based on the following receipt text, determine the primary category for the expense. "
        "The available categories are: Groceries, Dining, Transportation, Utilities, Entertainment, Travel, Health & Wellness, Office Supplies, Other. "
        "Return a JSON object with a single key \"expense_category\" and the value as the chosen category. "
        "If the text does not clearly indicate any category, output \"Other\". "
        "Ensure the JSON is strictly valid and output only the JSON, nothing else.\n\n"
        "Receipt Text:\n" + ocr_text + "\n\n"
        "Output only the JSON, nothing else."
    )
    
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_completion_tokens=256,
        top_p=1,
        stream=False,
        response_format={
            "type": "json_schema",
            "json_schema": category_schema
        }
    )
    return completion.choices[0].message.content

# Async wrappers
async def call_extract_details(text: str) -> dict:
    loop = asyncio.get_running_loop()
    raw = await loop.run_in_executor(None, call_extract_details_sync, text)
    return json.loads(raw)

async def call_expense_category(text: str) -> str:
    loop = asyncio.get_running_loop()
    raw = await loop.run_in_executor(None, call_expense_category_sync, text)
    return json.loads(raw)["expense_category"]