import json


def get_receipt_parser_prompt(ocr_text: str) -> str:
    return f"""
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


def get_enhanced_category_prompt(ocr_text: str, expense_categories) -> str:
    return f"""
You are an expert financial expense categorizer with deep knowledge of spending patterns and merchant types.

Analyze the receipt text and determine the most appropriate expense category.

AVAILABLE CATEGORIES:
{json.dumps(expense_categories, indent=2)}

ANALYSIS FACTORS:
- Merchant name and type
- Items purchased (if visible)
- Common spending patterns
- Industry classifications

RECEIPT TEXT:
{ocr_text}

EXAMPLES:
- "Target" with groceries → "Groceries"
- "McDonald's" → "Dining"
- "Shell Gas Station" → "Transportation" 
- "Best Buy" with electronics → "Shopping"
- "CVS Pharmacy" with medications → "Health & Wellness"
        "Output only the JSON, nothing else."
    )"""
