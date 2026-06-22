"""
main.py - QanoonAI Frontend Backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_db
from routes import auth, lawyers, cases, payments, chats

app = FastAPI(
    title="QanoonAI Frontend API",
    description="Backend for QanoonAI Legal Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("\nStarting QanoonAI Backend...")
    connect_db()
    print("Server ready at http://localhost:8001\n")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(lawyers.router, prefix="/api/lawyers", tags=["Lawyers"])
app.include_router(cases.router, prefix="/api/cases", tags=["Past Cases"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(chats.router, prefix="/api/chats", tags=["Chats"])

@app.get("/")
async def root():
    return {"status": "running", "message": "QanoonAI Frontend API is active", "version": "1.0.0"}
