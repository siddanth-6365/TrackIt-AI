from fastapi import FastAPI
from routers import users, receipts

app = FastAPI(title="TrackIt‑AI API")

app.include_router(users.router)
app.include_router(receipts.router)