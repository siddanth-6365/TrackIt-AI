import os, hashlib, hmac, base64
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Simple helper for SHA‑256 password hashing (salt in env for demo)
def hash_password(raw: str) -> str:
    salt = os.getenv("PW_SALT", "static_salt_demo").encode()
    return base64.b64encode(
        hmac.new(salt, raw.encode(), hashlib.sha256).digest()
    ).decode()
