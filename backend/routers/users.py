from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from services import user_service

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

@router.post("/signup")
async def signup(payload: UserCreate):
    try:
        user = await user_service.create_user(payload.email, payload.password, payload.name)
        return {"id": user["id"], "email": user["email"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class LoginReq(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
async def login(payload: LoginReq):
    try:
        user = await user_service.authenticate(payload.email, payload.password)
        return {"id": user["id"], "email": user["email"]}
    except ValueError:
        raise HTTPException(status_code=401, detail="Bad credentials")
