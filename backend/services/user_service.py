from typing import Optional
from services.supabase_client import supabase, hash_password

async def create_user(email: str, password: str, name: Optional[str]) -> dict:
    data = {
        "email": email.lower(),
        "password_hash": hash_password(password),
        "name": name
    }
    res = supabase.table("users").insert(data).execute()
    if res.error:
        raise ValueError(res.error.message)
    return res.data[0]

async def authenticate(email: str, password: str) -> dict:
    pw_hash = hash_password(password)
    res = supabase.table("users").select("*").eq("email", email.lower()).eq("password_hash", pw_hash).single().execute()
    if not res.data:
        raise ValueError("Invalid credentials")
    return res.data
