import json, asyncio
from unicodedata import category
from .groq_client import groqClient
from constants.schemas import receipt_schema, category_schema, expense_categories
from prompts.receipt_extract import (
    get_receipt_parser_prompt,
    get_enhanced_category_prompt,
)


def clean_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[-1]
    return text.strip()


def call_extract_details_sync(ocr_text: str) -> str:
    prompt = get_receipt_parser_prompt(ocr_text)

    comp = groqClient.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_completion_tokens=1024,
        top_p=1,
        stream=False,
        response_format={"type": "json_schema", "json_schema": receipt_schema},
    )
    resp = comp.choices[0].message.content
    return resp


def call_expense_category_sync(ocr_text: str) -> str:

    prompt = get_enhanced_category_prompt(ocr_text, expense_categories)

    completion = groqClient.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_completion_tokens=300,
        top_p=0.9,
        stream=False,
        response_format={"type": "json_schema", "json_schema": category_schema},
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
