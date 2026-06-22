"""
lawyers.py - Lawyer related endpoints
Updated with verification workflow
"""

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from database import get_db

router = APIRouter()


@router.get("/")
async def get_all_verified_lawyers():
    """
    Sirf verified lawyers (public lawyers page ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    lawyers_list = []
    # Sirf verified = True wale lawyers lao
    for lawyer in db.lawyers.find({"verified": True}):
        user = db.users.find_one({"_id": ObjectId(lawyer["user_id"])})
        if user:
            lawyers_list.append({
                "id": str(lawyer["_id"]),
                "user_id": lawyer["user_id"],
                "name": user.get("name"),
                "email": user.get("email"),
                "specialization": lawyer.get("specialization"),
                "experience_years": lawyer.get("experience_years"),
                "consultation_fee": lawyer.get("consultation_fee", 0),
                "rating": lawyer.get("rating", 0),
                "total_reviews": lawyer.get("total_reviews", 0),
                "total_cases": lawyer.get("total_cases", 0),
                "verified": lawyer.get("verified", False),
                "is_free": lawyer.get("is_free", True),
                "about": lawyer.get("about", ""),
                "bar_number": lawyer.get("bar_number")
            })
    
    return {"total": len(lawyers_list), "lawyers": lawyers_list}


@router.get("/all")
async def get_all_lawyers_admin():
    """
    Sab lawyers - verified + pending + rejected (Admin ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    lawyers_list = []
    for lawyer in db.lawyers.find():
        user = db.users.find_one({"_id": ObjectId(lawyer["user_id"])})
        if user:
            # Status determine karo
            verified = lawyer.get("verified", False)
            rejected = lawyer.get("rejected", False)
            if rejected:
                status = "rejected"
            elif verified:
                status = "verified"
            else:
                status = "pending"
            
            lawyers_list.append({
                "id": str(lawyer["_id"]),
                "user_id": lawyer["user_id"],
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "specialization": lawyer.get("specialization"),
                "experience_years": lawyer.get("experience_years"),
                "bar_number": lawyer.get("bar_number"),
                "consultation_fee": lawyer.get("consultation_fee", 0),
                "rating": lawyer.get("rating", 0),
                "total_reviews": lawyer.get("total_reviews", 0),
                "total_cases": lawyer.get("total_cases", 0),
                "verified": verified,
                "rejected": rejected,
                "status": status,
                "is_free": lawyer.get("is_free", True),
                "about": lawyer.get("about", ""),
                "joined": lawyer.get("created_at").isoformat() if lawyer.get("created_at") else None
            })
    
    return {"total": len(lawyers_list), "lawyers": lawyers_list}


@router.get("/pending")
async def get_pending_lawyers():
    """
    Sirf pending lawyers (Admin verification ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    lawyers_list = []
    for lawyer in db.lawyers.find({"verified": False, "rejected": {"$ne": True}}):
        user = db.users.find_one({"_id": ObjectId(lawyer["user_id"])})
        if user:
            lawyers_list.append({
                "id": str(lawyer["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "specialization": lawyer.get("specialization"),
                "experience_years": lawyer.get("experience_years"),
                "bar_number": lawyer.get("bar_number"),
                "joined": lawyer.get("created_at").isoformat() if lawyer.get("created_at") else None
            })
    
    return {"total": len(lawyers_list), "lawyers": lawyers_list}


@router.get("/{lawyer_id}")
async def get_lawyer(lawyer_id: str):
    """
    Specific lawyer ka full profile
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        lawyer = db.lawyers.find_one({"_id": ObjectId(lawyer_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid lawyer ID")
    
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    user = db.users.find_one({"_id": ObjectId(lawyer["user_id"])})
    
    return {
        "id": str(lawyer["_id"]),
        "name": user.get("name") if user else "",
        "email": user.get("email") if user else "",
        "phone": user.get("phone") if user else "",
        "specialization": lawyer.get("specialization"),
        "experience_years": lawyer.get("experience_years"),
        "consultation_fee": lawyer.get("consultation_fee"),
        "rating": lawyer.get("rating"),
        "total_reviews": lawyer.get("total_reviews"),
        "total_cases": lawyer.get("total_cases"),
        "verified": lawyer.get("verified"),
        "is_free": lawyer.get("is_free"),
        "about": lawyer.get("about"),
        "bar_number": lawyer.get("bar_number")
    }


@router.put("/{lawyer_id}/verify")
async def verify_lawyer(lawyer_id: str):
    """
    Lawyer ko verify karo (Admin ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        result = db.lawyers.update_one(
            {"_id": ObjectId(lawyer_id)},
            {"$set": {"verified": True, "rejected": False}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid lawyer ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    return {"success": True, "message": "Lawyer verified successfully"}


@router.put("/{lawyer_id}/reject")
async def reject_lawyer(lawyer_id: str):
    """
    Lawyer ko reject karo (Admin ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        result = db.lawyers.update_one(
            {"_id": ObjectId(lawyer_id)},
            {"$set": {"verified": False, "rejected": True}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid lawyer ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    return {"success": True, "message": "Lawyer rejected"}


@router.put("/{lawyer_id}/profile")
async def update_lawyer_profile(lawyer_id: str, data: dict):
    """
    Lawyer apni profile update kare
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    allowed_fields = ["specialization", "experience_years", "consultation_fee", "about", "is_free"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    try:
        result = db.lawyers.update_one(
            {"_id": ObjectId(lawyer_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid lawyer ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lawyer not found")
    
    return {"success": True, "message": "Profile updated"}
