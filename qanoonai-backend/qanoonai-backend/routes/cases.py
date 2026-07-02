"""
cases.py - Past Cases endpoints
Lawyers ke liye research database
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from database import get_db

router = APIRouter()


class CaseRequest(BaseModel):
    title: str
    citation: str
    category: str
    summary: str
    court: str
    year: int
    judge: str = ""
    full_judgment: str = ""


@router.get("/")
async def get_all_cases(category: str = None, search: str = None):
    """
    Saare past cases do, optional filtering ke sath
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    # Query banao
    query = {}
    if category and category != "All":
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"citation": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}}
        ]
    
    cases = []
    for case in db.past_cases.find(query):
        cases.append({
            "id": str(case["_id"]),
            "title": case.get("title"),
            "citation": case.get("citation"),
            "category": case.get("category"),
            "summary": case.get("summary"),
            "court": case.get("court"),
            "year": case.get("year"),
            "judge": case.get("judge", "")
        })
    
    return {"total": len(cases), "cases": cases}


@router.get("/search")
async def search_cases(q: str = ""):
    """
    Keyword-based case search — matches title, citation, summary, judge, court
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    if not q.strip():
        return {"total": 0, "cases": []}

    query = {
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"citation": {"$regex": q, "$options": "i"}},
            {"summary": {"$regex": q, "$options": "i"}},
            {"judge": {"$regex": q, "$options": "i"}},
            {"court": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    }

    cases = []
    for case in db.past_cases.find(query):
        cases.append({
            "id": str(case["_id"]),
            "title": case.get("title"),
            "citation": case.get("citation"),
            "category": case.get("category"),
            "summary": case.get("summary"),
            "court": case.get("court"),
            "year": case.get("year"),
            "judge": case.get("judge", "")
        })

    return {"total": len(cases), "cases": cases}


@router.get("/{case_id}")
async def get_case(case_id: str):
    """
    Specific case ka full detail
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        case = db.past_cases.find_one({"_id": ObjectId(case_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid case ID")
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return {
        "id": str(case["_id"]),
        "title": case.get("title"),
        "citation": case.get("citation"),
        "category": case.get("category"),
        "summary": case.get("summary"),
        "court": case.get("court"),
        "year": case.get("year"),
        "judge": case.get("judge"),
        "full_judgment": case.get("full_judgment", "")
    }


@router.post("/")
async def add_case(data: CaseRequest):
    """
    Naya case add karo (Admin ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    case_doc = {
        "title": data.title,
        "citation": data.citation,
        "category": data.category,
        "summary": data.summary,
        "court": data.court,
        "year": data.year,
        "judge": data.judge,
        "full_judgment": data.full_judgment,
        "created_at": datetime.utcnow()
    }
    
    result = db.past_cases.insert_one(case_doc)
    
    return {
        "success": True,
        "message": "Case added successfully",
        "case_id": str(result.inserted_id)
    }


@router.delete("/{case_id}")
async def delete_case(case_id: str):
    """
    Case delete karo (Admin ke liye)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        result = db.past_cases.delete_one({"_id": ObjectId(case_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid case ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return {"success": True, "message": "Case deleted"}


@router.get("/categories/list")
async def get_categories():
    """
    Sab available categories do
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    categories = db.past_cases.distinct("category")
    return {"categories": categories}
