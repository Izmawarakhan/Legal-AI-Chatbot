"""
chats.py - Customer-Lawyer Chat endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from database import get_db

router = APIRouter()


class SendMessageRequest(BaseModel):
    chat_id: str = None  # None = new chat
    sender_id: str
    sender_role: str  # "customer" or "lawyer"
    receiver_id: str  # lawyer_id or customer user_id
    message: str
    message_type: str = "text"  # "text", "file"
    file_name: str = None
    file_url: str = None


class StartChatRequest(BaseModel):
    customer_id: str
    lawyer_id: str


@router.post("/start")
async def start_chat(data: StartChatRequest):
    """New chat start karo ya existing dhundo"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    # Check if chat already exists
    existing = db.lawyer_chats.find_one({
        "customer_id": data.customer_id,
        "lawyer_id": data.lawyer_id
    })

    if existing:
        return {
            "chat_id": str(existing["_id"]),
            "existing": True,
            "message": "Chat already exists"
        }

    # Get names
    customer = db.users.find_one({"_id": ObjectId(data.customer_id)})
    lawyer_user = db.users.find_one({"_id": ObjectId(data.lawyer_id)})

    chat_doc = {
        "customer_id": data.customer_id,
        "lawyer_id": data.lawyer_id,
        "customer_name": customer.get("name", "Customer") if customer else "Customer",
        "lawyer_name": lawyer_user.get("name", "Lawyer") if lawyer_user else "Lawyer",
        "messages": [],
        "status": "active",
        "hired": False,
        "payment_done": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    result = db.lawyer_chats.insert_one(chat_doc)
    return {
        "chat_id": str(result.inserted_id),
        "existing": False,
        "message": "Chat started"
    }


@router.post("/send")
async def send_message(data: SendMessageRequest):
    """Message bhejo"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    msg = {
        "sender_id": data.sender_id,
        "sender_role": data.sender_role,
        "message": data.message,
        "message_type": data.message_type,
        "file_name": data.file_name,
        "file_url": data.file_url,
        "timestamp": datetime.now().isoformat(),
        "read": False
    }

    if data.chat_id:
        try:
            result = db.lawyer_chats.update_one(
                {"_id": ObjectId(data.chat_id)},
                {"$push": {"messages": msg}, "$set": {"updated_at": datetime.now()}}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Chat not found")
        except:
            raise HTTPException(status_code=400, detail="Invalid chat ID")
    
    return {"success": True, "message": "Message sent"}


@router.get("/user/{user_id}")
async def get_user_chats(user_id: str, role: str = "customer"):
    """User ki saari chats lo"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    field = "customer_id" if role == "customer" else "lawyer_id"
    chats = []

    for chat in db.lawyer_chats.find({field: user_id}).sort("updated_at", -1):
        last_msg = chat.get("messages", [])[-1] if chat.get("messages") else None
        unread = sum(1 for m in chat.get("messages", []) if not m.get("read") and m.get("sender_role") != role)

        chats.append({
            "id": str(chat["_id"]),
            "customer_id": chat.get("customer_id"),
            "lawyer_id": chat.get("lawyer_id"),
            "customer_name": chat.get("customer_name"),
            "lawyer_name": chat.get("lawyer_name"),
            "status": chat.get("status"),
            "hired": chat.get("hired", False),
            "last_message": last_msg.get("message", "") if last_msg else "",
            "last_time": last_msg.get("timestamp", "") if last_msg else "",
            "unread": unread,
            "total_messages": len(chat.get("messages", []))
        })

    return {"total": len(chats), "chats": chats}


@router.get("/{chat_id}")
async def get_chat_messages(chat_id: str):
    """Ek chat ke saare messages"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        chat = db.lawyer_chats.find_one({"_id": ObjectId(chat_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {
        "id": str(chat["_id"]),
        "customer_id": chat.get("customer_id"),
        "lawyer_id": chat.get("lawyer_id"),
        "customer_name": chat.get("customer_name"),
        "lawyer_name": chat.get("lawyer_name"),
        "status": chat.get("status"),
        "hired": chat.get("hired"),
        "messages": chat.get("messages", [])
    }


@router.put("/{chat_id}/hire")
async def hire_lawyer(chat_id: str):
    """Lawyer ko hire karo"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        db.lawyer_chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"hired": True, "updated_at": datetime.now()}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid chat ID")

    return {"success": True, "message": "Lawyer hired successfully"}
