from dotenv import load_dotenv
import os
import json
from groq import GroqError
from prompts.prompts import VALIDATE_PROMPT, EXPLAIN_PROMPT, SQLCODER_PROMPT_TEMPLATE
import requests
import time
from .groq_client import groqClient

load_dotenv()

# Cloudflare SQLCoder endpoint
AUTH_TOKEN = os.getenv("CLOUDFLARE_AUTH_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
SQLCODER_URL = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/defog/sqlcoder-7b-2"


def validate_question(question: str) -> bool:
    prompt = VALIDATE_PROMPT.format(question=question)
    try:
        resp = groqClient.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_completion_tokens=10,
            top_p=1,
            stream=False,
        )
        text = resp.choices[0].message.content
        print("validate question response:", text)
        return text.strip().upper().startswith("YES")
    except GroqError:
        return False


# using the sql-coder-7b
def get_sql_from_question(question: str, user_id: str) -> str:
    prompt = SQLCODER_PROMPT_TEMPLATE.format(question=question, user_id=user_id)
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messages": [
            {"role": "system", "content": "You are an expert SQL generator."},
            {"role": "user", "content": prompt},
        ]
    }
    resp = requests.post(SQLCODER_URL, headers=headers, json=payload)
    data = resp.json()
    # Check for Cloudflare errors
    if not data.get("success", False):
        raise RuntimeError(f"SQLCoder returned errors: {data.get('errors', data)}")

    sql = data["result"]["response"]

    sql = sql.replace("```", "").strip().rstrip(";")
    return sql


# 3) Execute SQL via Supabase RPC
def execute_sql_in_supabase(supabase, sql: str):
    """
    Executes the given SQL statement using Supabase's run_sql RPC.
    Returns the response data or raises an exception on error.
    """
    try:
        resp = supabase.rpc("run_sql", {"query_text": sql}).execute()
    except Exception as e:
        raise RuntimeError(f"Supabase RPC error: {e}") from e
    return resp.data or []


def explain_query(sql: str, rows: list, question: str) -> str:
    prompt = EXPLAIN_PROMPT.format(question=question, sql=sql, rows=json.dumps(rows))
    # 1) Try primary Groq LLM with retries
    for attempt in range(3):
        try:
            resp = groqClient.chat.completions.create(
                model="meta-llama/llama-4-maverick-17b-128e-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_completion_tokens=256,
                top_p=1,
                stream=False,
            )
            return resp.choices[0].message.content.strip()
        except GroqError as e:
            # only retry on 503
            print("llm error so retrying", e)
            if "503" in str(e):
                time.sleep(2**attempt)
                continue
            # other errors bubble up
            raise

    # 2) Fallback: simple template summary
    if rows:
        print("llm error so using fallback")
        return json.dumps(rows, indent=2)
    else:
        return "No records found for your query."


def explain_query_2(sql: str, rows: list, question: str) -> str:
    prompt = EXPLAIN_PROMPT.format(question=question, sql=sql, rows=json.dumps(rows))

    response = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct",
        headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
        json={
            "messages": [
                {"role": "system", "content": "You are a friendly assistant"},
                {"role": "user", "content": prompt},
            ]
        },
    )
    result = response.json()
    print("cloudflare explain query response", result)

    if not result.get("success", False):
        if rows:
            print("llm error so using fallback")
            return json.dumps(rows, indent=2)
        else:
            return "No records found for your query."

    return result["result"]["response"]
