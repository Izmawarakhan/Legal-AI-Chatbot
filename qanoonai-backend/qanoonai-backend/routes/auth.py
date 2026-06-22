"""
auth.py - Authentication routes
Signup aur Login ke endpoints yahan hain
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import bcrypt
import jwt
import os

from dotenv import load_dotenv
from database import get_db

load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "default_secret")

router = APIRouter()

# ============================================
# REQUEST MODELS (frontend se kya data aayega)
# ============================================

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: str  # "customer" ya "lawyer"
    # Lawyer ke extra fields (optional)
    bar_number: str = None
    specialization: str = None
    experience: int = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============================================
# HELPER FUNCTIONS
# ============================================

def hash_password(password: str) -> str:
    """Password ko securely hash karo"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Password verify karo"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    """JWT token banao"""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ============================================
# ENDPOINTS
# ============================================

@router.post("/signup")
async def signup(data: SignupRequest):
    """
    Naya user banao (Customer ya Lawyer)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    # Check agar email pehle se exist karti hai
    existing = db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Role validate karo
    if data.role not in ["customer", "lawyer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # User create karo
    user_doc = {
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": data.role,
        "created_at": datetime.utcnow()
    }
    
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Agar Lawyer hai toh lawyers collection mein bhi entry banao
    if data.role == "lawyer":
        if not data.bar_number:
            raise HTTPException(status_code=400, detail="Bar Council number required for lawyers")
        
        lawyer_doc = {
            "user_id": user_id,
            "bar_number": data.bar_number,
            "specialization": data.specialization or "General",
            "experience_years": data.experience or 0,
            "consultation_fee": 0,  # Default: free (new lawyer)
            "rating": 0,
            "total_reviews": 0,
            "total_cases": 0,
            "verified": False,  # Admin verify karega
            "is_free": True,  # New lawyer = free
            "about": "",
            "created_at": datetime.utcnow()
        }
        db.lawyers.insert_one(lawyer_doc)
    
    # JWT token banao
    token = create_token(user_id, data.role)
    
    return {
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "role": data.role
        }
    }


@router.post("/login")
async def login(data: LoginRequest):
    """
    Login karao — email aur password check karo
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    # User find karo
    user = db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Password verify karo
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    
    # JWT token banao
    token = create_token(user_id, user["role"])
    
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


@router.get("/verify/{token}")
async def verify_token(token: str):
    """
    Token verify karo — kya user logged in hai?
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"valid": True, "user_id": payload["user_id"], "role": payload["role"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
