from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, receipts, query, conversations

app = FastAPI(title="TrackIt‑AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[  # dev: allow localhost front‑end
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(receipts.router)
app.include_router(query.router)
app.include_router(conversations.router)


@app.get("/")
async def root():
    return {
        "message": "TrackIt-AI Conversational API",
        "version": "2.0.0",
        "features": ["receipt_processing", "conversational_ai", "expense_analysis"],
    }
