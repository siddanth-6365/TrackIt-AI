# groq_calls.py
import json
import asyncio
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

def clean_response(text: str) -> str:
    """
    Remove markdown code block markers (e.g., "```json" wrappers) from the API output.
    """
    text = text.strip()
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return text

def call_extract_details_sync(ocr_text: str) -> str:
    prompt = f"""
You are an expert financial‑document parser.

**Task**  
Return ONLY a valid JSON object with the following keys
(never wrap it in markdown, code fences, or extra text):

{{  
  "total_amount":        number  | null,     // e.g. 123.45  
  "transaction_date":    "YYYY-MM-DD" | null,  
  "vendor":              string | null,  
  "items": [             // zero or more  
    {{
      "name":      string,  
      "price":     number | null,  
      "quantity":  number | null  
    }}  
  ]  
}}

If a field is missing set it to **null** (or `[]` for items).

---  
Receipt Text:  
{ocr_text}

---  
Output ONLY the JSON.
"""
    
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_completion_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )
    response_text = ""
    for chunk in completion:
        piece = chunk.choices[0].delta.content or ""
        response_text += piece
    return clean_response(response_text)

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
        stream=True,
        stop=None,
    )
    response_text = ""
    for chunk in completion:
        piece = chunk.choices[0].delta.content or ""
        response_text += piece
    return clean_response(response_text)

# Async wrappers
async def call_extract_details(text: str) -> dict:
    loop = asyncio.get_running_loop()
    raw = await loop.run_in_executor(None, call_extract_details_sync, text)
    return json.loads(clean_response(raw))

async def call_expense_category(text: str) -> str:
    loop = asyncio.get_running_loop()
    raw = await loop.run_in_executor(None, call_expense_category_sync, text)
    return json.loads(clean_response(raw))["expense_category"]