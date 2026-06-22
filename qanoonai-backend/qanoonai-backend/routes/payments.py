"""
payments.py - Payment endpoints
1. Chatbot Subscription Plans (Free/Pro/Premium)
2. Lawyer Consultation Fee Payment
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timedelta
from database import get_db

router = APIRouter()

# Available Plans
PLANS = {
    "starter": {"name": "Starter", "price": 0, "queries": 20, "categories": 3, "features": ["Basic AI Chat", "3 Law Categories", "20 Queries/month"]},
    "pro": {"name": "Professional", "price": 999, "queries": 200, "categories": 7, "features": ["Unlimited AI Chat", "All 7 Categories", "200 Queries/month", "Document Upload", "Priority Support"]},
    "premium": {"name": "Premium", "price": 2499, "queries": -1, "categories": 7, "features": ["Unlimited Everything", "All Categories", "Unlimited Queries", "Document Upload", "Direct Lawyer Chat", "Priority Support", "Case Tracking"]},
}


class SubscriptionRequest(BaseModel):
    user_id: str
    plan_id: str  # starter, pro, premium
    card_number: str
    card_expiry: str
    card_cvc: str
    card_name: str


class LawyerPaymentRequest(BaseModel):
    customer_id: str
    lawyer_id: str
    chat_id: str = None
    amount: int
    card_number: str
    card_expiry: str
    card_cvc: str
    card_name: str


# ============ PLANS ============

@router.get("/plans")
async def get_plans():
    """Available subscription plans"""
    return {"plans": [{"id": k, **v} for k, v in PLANS.items()]}


@router.get("/subscription/{user_id}")
async def get_user_subscription(user_id: str):
    """User ki current subscription"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    sub = db.payments.find_one({"user_id": user_id, "type": "subscription", "status": "active"}, sort=[("created_at", -1)])

    if sub:
        plan_info = PLANS.get(sub.get("plan_id", "starter"), PLANS["starter"])
        return {
            "active": True,
            "plan_id": sub.get("plan_id"),
            "plan_name": plan_info["name"],
            "price": plan_info["price"],
            "queries_limit": plan_info["queries"],
            "queries_used": sub.get("queries_used", 0),
            "expires_at": sub.get("expires_at").isoformat() if sub.get("expires_at") else None,
            "created_at": sub.get("created_at").isoformat() if sub.get("created_at") else None,
        }
    else:
        return {
            "active": True,
            "plan_id": "starter",
            "plan_name": "Starter",
            "price": 0,
            "queries_limit": 20,
            "queries_used": 0,
            "expires_at": None,
        }


@router.post("/subscribe")
async def subscribe(data: SubscriptionRequest):
    """Plan subscribe karo (Demo - no real charging)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    plan = PLANS.get(data.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if plan["price"] == 0:
        raise HTTPException(status_code=400, detail="Starter plan is free, no payment needed")

    # Validate card (basic demo validation)
    if len(data.card_number.replace(" ", "")) < 16:
        raise HTTPException(status_code=400, detail="Invalid card number")
    if not data.card_expiry or "/" not in data.card_expiry:
        raise HTTPException(status_code=400, detail="Invalid expiry (MM/YY)")
    if len(data.card_cvc) < 3:
        raise HTTPException(status_code=400, detail="Invalid CVC")

    # Deactivate old subscriptions
    db.payments.update_many(
        {"user_id": data.user_id, "type": "subscription", "status": "active"},
        {"$set": {"status": "expired"}}
    )

    # Create new subscription
    payment_doc = {
        "user_id": data.user_id,
        "type": "subscription",
        "plan_id": data.plan_id,
        "plan_name": plan["name"],
        "amount": plan["price"],
        "currency": "PKR",
        "status": "active",
        "queries_used": 0,
        "card_last4": data.card_number.replace(" ", "")[-4:],
        "card_name": data.card_name,
        "payment_method": "card",
        "transaction_id": f"TXN-{ObjectId()}",
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(days=30),
    }

    db.payments.insert_one(payment_doc)

    # Update user role/plan
    try:
        db.users.update_one(
            {"_id": ObjectId(data.user_id)},
            {"$set": {"plan": data.plan_id}}
        )
    except:
        pass

    return {
        "success": True,
        "message": f"Successfully subscribed to {plan['name']} plan!",
        "plan": plan["name"],
        "amount": plan["price"],
        "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
        "transaction_id": payment_doc["transaction_id"],
    }


# ============ LAWYER PAYMENTS ============

@router.post("/lawyer")
async def pay_lawyer(data: LawyerPaymentRequest):
    """Lawyer consultation fee pay karo (Demo)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    # Validate card
    if len(data.card_number.replace(" ", "")) < 16:
        raise HTTPException(status_code=400, detail="Invalid card number")

    # Get lawyer info
    lawyer = db.lawyers.find_one({"user_id": data.lawyer_id})
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")

    lawyer_user = db.users.find_one({"_id": ObjectId(data.lawyer_id)})

    payment_doc = {
        "customer_id": data.customer_id,
        "lawyer_id": data.lawyer_id,
        "chat_id": data.chat_id,
        "type": "consultation",
        "amount": data.amount,
        "currency": "PKR",
        "status": "completed",
        "card_last4": data.card_number.replace(" ", "")[-4:],
        "card_name": data.card_name,
        "payment_method": "card",
        "lawyer_name": lawyer_user.get("name", "") if lawyer_user else "",
        "transaction_id": f"TXN-{ObjectId()}",
        "created_at": datetime.now(),
    }

    db.payments.insert_one(payment_doc)

    # Update chat as hired + paid
    if data.chat_id:
        try:
            db.lawyer_chats.update_one(
                {"_id": ObjectId(data.chat_id)},
                {"$set": {"hired": True, "payment_done": True, "payment_amount": data.amount}}
            )
        except:
            pass

    # Update lawyer stats
    db.lawyers.update_one(
        {"user_id": data.lawyer_id},
        {"$inc": {"total_cases": 1}}
    )

    return {
        "success": True,
        "message": f"Payment of Rs. {data.amount} completed!",
        "amount": data.amount,
        "lawyer_name": lawyer_user.get("name", "") if lawyer_user else "",
        "transaction_id": payment_doc["transaction_id"],
    }


# ============ PAYMENT HISTORY ============

@router.get("/history/{user_id}")
async def get_payment_history(user_id: str, role: str = "customer"):
    """Payment history"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    field = "customer_id" if role == "customer" else "lawyer_id"
    if role == "customer":
        field = "user_id"
        payments = list(db.payments.find({"$or": [{"user_id": user_id}, {"customer_id": user_id}]}).sort("created_at", -1))
    else:
        payments = list(db.payments.find({"lawyer_id": user_id}).sort("created_at", -1))

    result = []
    for p in payments:
        result.append({
            "id": str(p["_id"]),
            "type": p.get("type"),
            "amount": p.get("amount"),
            "currency": p.get("currency", "PKR"),
            "status": p.get("status"),
            "plan_name": p.get("plan_name"),
            "lawyer_name": p.get("lawyer_name"),
            "transaction_id": p.get("transaction_id"),
            "card_last4": p.get("card_last4"),
            "created_at": p.get("created_at").isoformat() if p.get("created_at") else None,
        })

    return {"total": len(result), "payments": result}


# ============ STATS ============

@router.get("/stats")
async def payment_stats():
    """Admin payment stats"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    total_payments = db.payments.count_documents({})
    total_revenue = sum(p.get("amount", 0) for p in db.payments.find({"status": {"$in": ["active", "completed"]}}))
    active_subs = db.payments.count_documents({"type": "subscription", "status": "active"})
    consultation_payments = db.payments.count_documents({"type": "consultation"})

    return {
        "total_payments": total_payments,
        "total_revenue": total_revenue,
        "active_subscriptions": active_subs,
        "consultation_payments": consultation_payments,
    }
