"""
cases.py - Past Cases endpoints
"""

import math
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime
from database import get_db

router = APIRouter()


# ─── Models ──────────────────────────────────────────────────────────────────

class CaseRequest(BaseModel):
    title: str
    category: str
    summary: str = ""
    citation: str = ""
    court: str = ""
    year: int = 0
    judge: str = ""
    full_judgment: str = ""
    description: str = ""
    sub_category: str = ""
    case_number: str = ""
    keywords: str = ""
    content: str = ""
    status: str = "active"


class CategoryRequest(BaseModel):
    name: str
    description: str = ""
    icon: str = ""


# ─── Helper ──────────────────────────────────────────────────────────────────

def _fmt(case) -> dict:
    return {
        "id": str(case["_id"]),
        "title": case.get("title", ""),
        "citation": case.get("citation", ""),
        "category": case.get("category", ""),
        "summary": case.get("summary") or case.get("description", ""),
        "court": case.get("court", ""),
        "year": case.get("year", 0),
        "judge": case.get("judge", ""),
        "keywords": case.get("keywords", ""),
        "status": case.get("status", "active"),
        "created_at": case["created_at"].isoformat() if case.get("created_at") else None,
    }


# ─── Count ───────────────────────────────────────────────────────────────────

@router.get("/count")
async def get_case_count():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    total = db.past_cases.count_documents({})
    by_category = {}
    for cat in db.past_cases.distinct("category"):
        if cat:
            by_category[cat] = db.past_cases.count_documents({"category": cat})
    return {"total": total, "by_category": by_category}


# ─── All Cases (paginated) ────────────────────────────────────────────────────

@router.get("/")
async def get_all_cases(
    category: str = None,
    search: str = None,
    page: int = 1,
    limit: int = 20,
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    query = {}
    if category and category not in ("All", "all", ""):
        query["category"] = category

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"citation": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = db.past_cases.count_documents(query)

    # If limit=0 return all (used by internal client-side filter)
    if limit <= 0:
        cases = [_fmt(c) for c in db.past_cases.find(query)]
        return {"cases": cases, "total": total, "page": 1, "limit": total,
                "total_pages": 1, "has_next": False, "has_prev": False}

    total_pages = max(1, math.ceil(total / limit))
    page = max(1, min(page, total_pages))
    skip = (page - 1) * limit

    cases = [_fmt(c) for c in db.past_cases.find(query).skip(skip).limit(limit)]

    return {
        "cases": cases,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


# ─── Search ──────────────────────────────────────────────────────────────────

@router.get("/search")
async def search_cases(q: str = "", page: int = 1, limit: int = 20):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    if not q.strip():
        return {"total": 0, "cases": [], "page": 1, "total_pages": 0}

    query = {
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"citation": {"$regex": q, "$options": "i"}},
            {"summary": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"judge": {"$regex": q, "$options": "i"}},
            {"court": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
            {"keywords": {"$regex": q, "$options": "i"}},
        ]
    }

    total = db.past_cases.count_documents(query)
    total_pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
    page = max(1, min(page, total_pages))
    skip = (page - 1) * limit

    cases = [_fmt(c) for c in db.past_cases.find(query).skip(skip).limit(limit)]

    return {
        "cases": cases,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


# ─── Categories ──────────────────────────────────────────────────────────────

@router.get("/categories")
async def get_categories():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    # Return managed categories first, then any derived from cases
    managed = list(db.case_categories.find({}, {"_id": 0, "id": {"$toString": "$_id"}, "name": 1, "description": 1, "icon": 1, "created_at": 1}).sort("name", 1))
    # Patch id field
    raw = list(db.case_categories.find().sort("name", 1))
    managed = [{"id": str(c["_id"]), "name": c.get("name",""), "description": c.get("description",""), "icon": c.get("icon","")} for c in raw]

    # Also get distinct categories from cases that aren't in managed list
    managed_names = {c["name"] for c in managed}
    extra = [n for n in db.past_cases.distinct("category") if n and n not in managed_names]
    for name in sorted(extra):
        managed.append({"id": None, "name": name, "description": "", "icon": ""})

    return {"categories": managed}


@router.get("/categories/list")
async def get_categories_list():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    categories = db.past_cases.distinct("category")
    return {"categories": [c for c in categories if c]}


@router.post("/categories")
async def add_category(data: CategoryRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    existing = db.case_categories.find_one({"name": {"$regex": f"^{data.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    doc = {"name": data.name.strip(), "description": data.description, "icon": data.icon, "created_at": datetime.utcnow()}
    result = db.case_categories.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id), "name": data.name}


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        result = db.case_categories.delete_one({"_id": ObjectId(category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}


# ─── Single case ─────────────────────────────────────────────────────────────

@router.get("/{case_id}")
async def get_case(case_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        case = db.past_cases.find_one({"_id": ObjectId(case_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid case ID")
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    full = _fmt(case)
    full["full_judgment"] = case.get("full_judgment", "") or case.get("content", "")
    return full


# ─── Add case ────────────────────────────────────────────────────────────────

@router.post("/")
async def add_case(data: CaseRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    doc = {
        "title": data.title,
        "citation": data.citation,
        "category": data.category,
        "summary": data.summary or data.description,
        "description": data.description,
        "court": data.court,
        "year": data.year,
        "judge": data.judge,
        "full_judgment": data.full_judgment or data.content,
        "content": data.content,
        "sub_category": data.sub_category,
        "case_number": data.case_number,
        "keywords": data.keywords,
        "status": data.status,
        "created_at": datetime.utcnow(),
    }
    result = db.past_cases.insert_one(doc)
    return {"success": True, "message": "Case added successfully", "case_id": str(result.inserted_id)}


# ─── Delete case ─────────────────────────────────────────────────────────────

@router.delete("/{case_id}")
async def delete_case(case_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        result = db.past_cases.delete_one({"_id": ObjectId(case_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid case ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"success": True, "message": "Case deleted"}
