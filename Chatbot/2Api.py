# # ============================================
# # Api.py — FastAPI Backend with MongoDB
# # ============================================
# # Chat history is now permanently saved in MongoDB Atlas.
# # Compatible with Python 3.9 + Pydantic v1 + FastAPI 0.103
# #
# # Required packages:
# #   pip install fastapi==0.103.2 pydantic==1.10.18 uvicorn==0.27.0 python-multipart pymongo
# #
# # Run command:
# #   uvicorn Api:app --reload --port 8000
# # ============================================

# from fastapi import FastAPI, HTTPException, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from pymongo import MongoClient
# from datetime import datetime
# import uuid
# import os
# from dotenv import load_dotenv
# from faster_whisper import WhisperModel
# import io, soundfile as sf, numpy as np
# from fastapi.responses import StreamingResponse

# # --- Import existing chatbot logic ---
# from utils import (
#     load_local_files,
#     get_documents_from_files,
#     get_text_chunks,
#     get_vector_store,
#     get_conversation_chain,
#     DocumentProcessor,
#     get_all_categories,
#     get_category_info,
#     LAW_CATEGORIES
# )

# # Load environment variables
# load_dotenv()

# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# MONGODB_URI = os.getenv("MONGODB_URI")
# MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "legal_ai_db")
# raw_paths = os.getenv("DATASET_PATH", "")
# # Load once at startup
# whisper_model = WhisperModel("base", device="cpu", compute_type="int8")

# # Parse dataset paths from .env
# if ";" in raw_paths:
#     DATASET_PATHS = [p.strip() for p in raw_paths.split(";") if p.strip()]
# elif "," in raw_paths:
#     DATASET_PATHS = [p.strip() for p in raw_paths.split(",") if p.strip()]
# else:
#     DATASET_PATHS = [
#         r"D:\FYP\Dataset\Family Law",
#         r"D:\FYP\Dataset\Criminal Law"
#     ]


# # ============================================
# # FASTAPI APP SETUP
# # ============================================
# app = FastAPI(
#     title="AI Legal Consultant API",
#     description="REST API for Pakistan AI Legal Assistant — 7 Law Categories",
#     version="1.0.0"
# )

# # CORS Middleware — allows React frontend to call this API
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, replace with your domain
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ============================================
# # GLOBAL STATE
# # ============================================
# vector_store = None
# active_conversations = {}  # In-memory conversation chains (cannot be stored in DB)
# db = None  # MongoDB database reference


# # ============================================
# # STARTUP EVENT
# # ============================================
# @app.on_event("startup")
# async def startup_event():
#     """Loads Knowledge Base and connects to MongoDB on server start"""
#     global vector_store, db
    
#     print("\n🚀 Starting AI Legal Consultant API...")
    
#     # --- Connect to MongoDB ---
#     try:
#         client = MongoClient(MONGODB_URI)
#         db = client[MONGODB_DB_NAME]
#         # Test connection
#         client.admin.command("ping")
#         print("✅ MongoDB connected successfully!")
        
#         # Create indexes for faster queries
#         db.chat_sessions.create_index("session_id", unique=True)
#         db.chat_messages.create_index("session_id")
#         db.chat_messages.create_index("created_at")
#         print("✅ Database indexes created!")
        
#     except Exception as e:
#         print("❌ MongoDB connection failed: {}".format(str(e)))
#         print("   Chat history will NOT be saved permanently.")
#         db = None
    
#     # --- Load FAISS Knowledge Base ---
#     vector_store = get_vector_store()
#     if vector_store:
#         print("✅ Knowledge Base loaded successfully!")
#     else:
#         print("⚠️ No Knowledge Base found. Use /api/sync endpoint to build it.")


# # ============================================
# # MONGODB HELPER FUNCTIONS
# # ============================================

# def save_session_to_db(session_id, title, category, religion):
#     """Saves a new chat session record to MongoDB"""
#     if db is None:
#         return
#     try:
#         db.chat_sessions.update_one(
#             {"session_id": session_id},
#             {"$set": {
#                 "session_id": session_id,
#                 "title": title,
#                 "category": category,
#                 "religion": religion,
#                 "created_at": datetime.utcnow(),
#                 "updated_at": datetime.utcnow()
#             }},
#             upsert=True
#         )
#     except Exception as e:
#         print("DB Error (save_session): {}".format(str(e)))


# def save_message_to_db(session_id, role, content, sources=None):
#     """Saves a single chat message to MongoDB"""
#     if db is None:
#         return
#     try:
#         db.chat_messages.insert_one({
#             "session_id": session_id,
#             "role": role,
#             "content": content,
#             "sources": sources or [],
#             "created_at": datetime.utcnow()
#         })
#         # Update session timestamp
#         db.chat_sessions.update_one(
#             {"session_id": session_id},
#             {"$set": {"updated_at": datetime.utcnow()}}
#         )
#     except Exception as e:
#         print("DB Error (save_message): {}".format(str(e)))


# def get_messages_from_db(session_id):
#     """Retrieves all messages for a session from MongoDB"""
#     if db is None:
#         return []
#     try:
#         messages = list(db.chat_messages.find(
#             {"session_id": session_id},
#             {"_id": 0, "session_id": 0}  # Exclude these fields from result
#         ).sort("created_at", 1))
        
#         # Convert datetime to string for JSON serialization
#         for msg in messages:
#             if "created_at" in msg:
#                 msg["created_at"] = msg["created_at"].isoformat()
#         return messages
#     except Exception as e:
#         print("DB Error (get_messages): {}".format(str(e)))
#         return []


# def get_chat_history_pairs_from_db(session_id):
#     """Retrieves chat history as (user, assistant) pairs for LangChain"""
#     if db is None:
#         return []
#     try:
#         messages = list(db.chat_messages.find(
#             {"session_id": session_id},
#             {"_id": 0}
#         ).sort("created_at", 1))
        
#         pairs = []
#         for i in range(0, len(messages) - 1, 2):
#             if messages[i]["role"] == "user" and i + 1 < len(messages) and messages[i + 1]["role"] == "assistant":
#                 pairs.append((messages[i]["content"], messages[i + 1]["content"]))
#         return pairs
#     except Exception as e:
#         print("DB Error (get_history_pairs): {}".format(str(e)))
#         return []


# # ============================================
# # API ENDPOINTS
# # ============================================

# # -------- 1. HEALTH CHECK --------
# @app.get("/")
# async def root():
#     """Returns API and database status"""
#     return {
#         "status": "running",
#         "message": "AI Legal Consultant API is active",
#         "knowledge_base": "loaded" if vector_store else "not loaded",
#         "database": "connected" if db is not None else "not connected",
#         "total_categories": len(LAW_CATEGORIES)
#     }


# # -------- 2. GET ALL CATEGORIES --------
# @app.get("/api/categories")
# async def get_categories():
#     """Returns all 7 law categories for frontend display"""
#     categories = []
#     for name, data in LAW_CATEGORIES.items():
#         categories.append({
#             "name": name,
#             "description": data["description"],
#             "sub_types": data["sub_types"]
#         })
#     return categories


# # -------- 3. CHAT — Main Endpoint --------
# @app.post("/api/chat")
# async def chat(request: dict):
#     """
#     Main chat endpoint — receives user message, returns AI response.
#     Messages are automatically saved to MongoDB.
    
#     Request body:
#     {
#         "message": "my husband is abusing me",
#         "session_id": null or "existing-session-id",
#         "category": null or "Family Law",
#         "religion": "Muslim"
#     }
#     """
#     global vector_store
    
#     if not vector_store:
#         raise HTTPException(status_code=503, detail="Knowledge Base not loaded. Please call /api/sync first.")
    
#     # Extract fields from request
#     message = request.get("message")
#     if not message:
#         raise HTTPException(status_code=400, detail="Message field is required")
    
#     session_id = request.get("session_id")
#     category = request.get("category")
#     religion = request.get("religion", "Muslim")
    
#     # --- Create or retrieve conversation chain ---
#     is_new_session = False
#     if not session_id or session_id not in active_conversations:
#         is_new_session = True
#         session_id = session_id or str(uuid.uuid4())
#         conversation = get_conversation_chain(vector_store, GROQ_API_KEY, religion)
#         active_conversations[session_id] = {
#             "conversation": conversation,
#             "religion": religion,
#             "category": category,
#         }
#         # Save new session to MongoDB
#         title = message[:30] + "..."
#         save_session_to_db(session_id, title, category, religion)
    
#     conv = active_conversations[session_id]
    
#     # Update category if provided
#     if category:
#         conv["category"] = category
#         if db:
#             db.chat_sessions.update_one(
#                 {"session_id": session_id},
#                 {"$set": {"category": category}}
#             )
    
#     # --- Build query with category context ---
#     final_query = message
#     if conv.get("category"):
#         final_query = "[SELECTED CATEGORY: {}]\n\n{}".format(conv["category"], final_query)
    
#     # --- Get chat history from MongoDB (for existing sessions) ---
#     chat_history = get_chat_history_pairs_from_db(session_id)
    
#     # --- Call AI ---
#     try:
#         result = conv["conversation"].invoke({
#             "question": final_query,
#             "chat_history": chat_history
#         })
#     except Exception as e:
#         raise HTTPException(status_code=500, detail="AI processing error: {}".format(str(e)))
    
#     full_answer = result["answer"]
    
#     # --- Extract source documents ---
#     sources = []
#     if "source_documents" in result:
#         for doc in result["source_documents"]:
#             source_name = os.path.basename(doc.metadata.get("source", "Unknown"))
#             cat = doc.metadata.get("category", "Unknown")
#             sources.append("{} | {}".format(cat, source_name))
    
#     # --- Filter references unless user asked ---
#     display_answer = full_answer
#     ref_keywords = ["source", "reference", "citation", "section", "case name"]
#     if not any(k in message.lower() for k in ref_keywords) and "References" in full_answer:
#         display_answer = full_answer.split("References")[0].strip()
    
#     # --- Save messages to MongoDB ---
#     save_message_to_db(session_id, "user", message)
#     save_message_to_db(session_id, "assistant", display_answer, sources)
    
#     # --- Terminal logging ---
#     print("\n--- Chat: {} ---".format(session_id[:8]))
#     print("  User: {}...".format(message[:80]))
#     print("  AI: {}...".format(display_answer[:80]))
#     print("  Sources: {}".format(len(sources)))
#     print("  Saved to DB: {}".format("Yes" if db is not None else "No"))
#     print("-" * 40)
    
#     return {
#         "session_id": session_id,
#         "reply": display_answer,
#         "detected_category": conv.get("category"),
#         "sources": sources
#     }


# # -------- 4. GET CHAT HISTORY --------
# @app.get("/api/chat/history/{session_id}")
# async def get_chat_history(session_id: str):
#     """Returns full chat history for a session from MongoDB"""
#     if db is not None:
#         # Get session info
#         session = db.chat_sessions.find_one(
#             {"session_id": session_id},
#             {"_id": 0}
#         )
#         if not session:
#             raise HTTPException(status_code=404, detail="Session not found")
        
#         # Get all messages
#         messages = get_messages_from_db(session_id)
        
#         return {
#             "session_id": session_id,
#             "title": session.get("title", "Chat"),
#             "category": session.get("category"),
#             "religion": session.get("religion"),
#             "messages": messages
#         }
#     else:
#         raise HTTPException(status_code=503, detail="Database not connected")


# # -------- 5. GET ALL SESSIONS --------
# @app.get("/api/chat/sessions")
# async def get_all_sessions():
#     """Returns list of all chat sessions from MongoDB"""
#     if db is not None:
#         sessions = list(db.chat_sessions.find(
#             {},
#             {"_id": 0}
#         ).sort("updated_at", -1))  # Most recent first
        
#         result = []
#         for s in sessions:
#             # Count messages for this session
#             msg_count = db.chat_messages.count_documents({"session_id": s["session_id"]})
            
#             # Convert datetime to string
#             created = s.get("created_at", "")
#             if hasattr(created, "isoformat"):
#                 created = created.isoformat()
            
#             result.append({
#                 "session_id": s.get("session_id"),
#                 "title": s.get("title", "Chat"),
#                 "message_count": msg_count,
#                 "category": s.get("category"),
#                 "created_at": created
#             })
#         return result
#     else:
#         raise HTTPException(status_code=503, detail="Database not connected")


# # -------- 6. DELETE SESSION --------
# @app.delete("/api/chat/session/{session_id}")
# async def delete_session(session_id: str):
#     """Deletes a session and all its messages from MongoDB"""
#     if db is not None:
#         # Delete session record
#         result = db.chat_sessions.delete_one({"session_id": session_id})
#         if result.deleted_count == 0:
#             raise HTTPException(status_code=404, detail="Session not found")
        
#         # Delete all messages in this session
#         db.chat_messages.delete_many({"session_id": session_id})
        
#         # Remove from active conversations
#         if session_id in active_conversations:
#             del active_conversations[session_id]
        
#         return {"message": "Session and all messages deleted", "session_id": session_id}
#     else:
#         raise HTTPException(status_code=503, detail="Database not connected")


# # -------- 7. UPLOAD DOCUMENT FOR ANALYSIS --------
# @app.post("/api/chat/upload")
# async def upload_document(file: UploadFile = File(...)):
#     """Accepts a legal document upload (PDF or TXT) and extracts text"""
#     allowed_types = ["application/pdf", "text/plain"]
#     if file.content_type not in allowed_types:
#         raise HTTPException(status_code=400, detail="Only PDF and TXT files are allowed")
    
#     temp_path = "temp_{}_{}".format(uuid.uuid4().hex, file.filename)
#     try:
#         with open(temp_path, "wb") as f:
#             content = await file.read()
#             f.write(content)
        
#         documents = DocumentProcessor.extract_content(temp_path)
#         extracted_text = " ".join([doc.page_content for doc in documents])
        
#         if not extracted_text.strip():
#             raise HTTPException(status_code=400, detail="Could not extract text from file")
        
#         return {
#             "filename": file.filename,
#             "extracted_text": extracted_text[:3000],
#             "total_chars": len(extracted_text),
#             "message": "Document processed successfully. You can now ask questions about it in chat."
#         }
#     finally:
#         if os.path.exists(temp_path):
#             os.remove(temp_path)


# # -------- 8. SYNC KNOWLEDGE BASE --------
# @app.post("/api/sync")
# async def sync_knowledge_base():
#     """Rebuilds the FAISS Knowledge Base from all dataset documents"""
#     global vector_store
    
#     try:
#         all_files = load_local_files(DATASET_PATHS)
#         if not all_files:
#             raise HTTPException(status_code=404, detail="No files found in dataset paths")
        
#         docs = DocumentProcessor.get_documents_from_files(all_files)
#         chunks = get_text_chunks(docs)
#         vector_store = get_vector_store(chunks)
        
#         return {
#             "message": "Knowledge Base synced successfully",
#             "files_processed": len(all_files),
#             "chunks_created": len(chunks)
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail="Sync failed: {}".format(str(e)))


# # -------- 9. CREATE NEW CHAT SESSION --------
# @app.post("/api/chat/new")
# async def new_chat_session(religion: str = "Muslim"):
#     """Creates a new chat session and saves it to MongoDB"""
#     if not vector_store:
#         raise HTTPException(status_code=503, detail="Knowledge Base not loaded")
    
#     session_id = str(uuid.uuid4())
#     conversation = get_conversation_chain(vector_store, GROQ_API_KEY, religion)
    
#     # Save to in-memory (for conversation chain)
#     active_conversations[session_id] = {
#         "conversation": conversation,
#         "religion": religion,
#         "category": None,
#     }
    
#     # Save to MongoDB
#     save_session_to_db(session_id, "New Chat", None, religion)
    
#     return {"session_id": session_id, "message": "New chat session created"}


# # -------- 10. DATABASE STATS (Bonus) --------
# @app.get("/api/stats")
# async def get_stats():
#     """Returns database statistics — useful for admin panel"""
#     if db is not None:
#         return {
#             "total_sessions": db.chat_sessions.count_documents({}),
#             "total_messages": db.chat_messages.count_documents({}),
#             "total_categories": len(LAW_CATEGORIES),
#             "knowledge_base": "loaded" if vector_store else "not loaded"
#         }
#     else:
#         return {"error": "Database not connected"}



# # -------- VOICE: Speech-to-Text --------
# @app.post("/api/voice/transcribe")
# async def transcribe_audio(file: UploadFile = File(...)):
#     """Accepts audio file, returns transcribed text using Whisper"""
#     audio_bytes = await file.read()
    
#     # Save to temp file
#     temp_path = f"temp_audio_{uuid.uuid4().hex}.wav"
#     with open(temp_path, "wb") as f:
#         f.write(audio_bytes)
    
#     try:
#         segments, info = whisper_model.transcribe(temp_path, language="ur")  # or "en"
#         text = " ".join([seg.text for seg in segments]).strip()
#         return {"text": text, "language": info.language}
#     finally:
#         if os.path.exists(temp_path):
#             os.remove(temp_path)


# # -------- VOICE: Text-to-Speech --------
# @app.post("/api/voice/synthesize")
# async def synthesize_speech(request: dict):
#     """Converts text to speech using Piper TTS"""
#     from piper import PiperVoice
    
#     text = request.get("text", "")
#     # Download model: https://github.com/rhasspy/piper/releases
#     voice = PiperVoice.load("en_US-lessac-medium.onnx")
    
#     audio_buffer = io.BytesIO()
#     with sf.SoundFile(audio_buffer, 'w', samplerate=22050, channels=1, format='WAV') as wav_file:
#         voice.synthesize(text, wav_file)
    
#     audio_buffer.seek(0)
#     return StreamingResponse(audio_buffer, media_type="audio/wav")

# # ============================================
# # HOW TO RUN
# # ============================================
# # Step 1: Make sure .env has these lines:
# #   MONGODB_URI=mongodb+srv://dilafroze152:FYP1230@legalai.2ucmqcq.mongodb.net/?retryWrites=true&w=majority&appName=LegalAI
# #   MONGODB_DB_NAME=legal_ai_db
# #
# # Step 2: Run server:
# #   uvicorn Api:app --reload --port 8000
# #
# # Step 3: Test:
# #   http://localhost:8000/docs
# #   http://localhost:8000/api/stats  (check DB connection)
# # ============================================

# ============================================
# Api.py — FastAPI Backend with MongoDB
# ============================================
# Chat history is now permanently saved in MongoDB Atlas.
# Compatible with Python 3.9 + Pydantic v1 + FastAPI 0.103
#
# Required packages:
#   pip install fastapi==0.103.2 pydantic==1.10.18 uvicorn==0.27.0 python-multipart pymongo
#
# Run command:
#   uvicorn Api:app --reload --port 8000
# ============================================

from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv
from faster_whisper import WhisperModel
import io
import soundfile as sf
import numpy as np
from fastapi.responses import StreamingResponse

# --- Import existing chatbot logic ---
from utils import (
    load_local_files,
    get_documents_from_files,
    get_text_chunks,
    get_vector_store,
    get_conversation_chain,
    DocumentProcessor,
    get_all_categories,
    get_category_info,
    LAW_CATEGORIES
)

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "legal_ai_db")
raw_paths = os.getenv("DATASET_PATH", "")

# Load Whisper once at startup
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")

# Parse dataset paths from .env
if ";" in raw_paths:
    DATASET_PATHS = [p.strip() for p in raw_paths.split(";") if p.strip()]
elif "," in raw_paths:
    DATASET_PATHS = [p.strip() for p in raw_paths.split(",") if p.strip()]
else:
    DATASET_PATHS = [
        r"D:\FYP\Dataset\Family Law",
        r"D:\FYP\Dataset\Criminal Law"
    ]


# ============================================
# FASTAPI APP SETUP
# ============================================
app = FastAPI(
    title="AI Legal Consultant API",
    description="REST API for Pakistan AI Legal Assistant — 7 Law Categories",
    version="1.0.0"
)

# CORS Middleware — allows React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# PYDANTIC MODELS
# ============================================

# ✅ FIX: Proper Pydantic model for TTS — request: dict doesn't work in FastAPI
class TTSRequest(BaseModel):
    text: str


# ============================================
# GLOBAL STATE
# ============================================
vector_store = None
active_conversations = {}
db = None


# ============================================
# STARTUP EVENT
# ============================================
@app.on_event("startup")
async def startup_event():
    """Loads Knowledge Base and connects to MongoDB on server start"""
    global vector_store, db

    print("\n🚀 Starting AI Legal Consultant API...")

    # --- Connect to MongoDB ---
    try:
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB_NAME]
        client.admin.command("ping")
        print("✅ MongoDB connected successfully!")
        db.chat_sessions.create_index("session_id", unique=True)
        db.chat_messages.create_index("session_id")
        db.chat_messages.create_index("created_at")
        print("✅ Database indexes created!")
    except Exception as e:
        print("❌ MongoDB connection failed: {}".format(str(e)))
        db = None

    # --- Load FAISS Knowledge Base ---
    vector_store = get_vector_store()
    if vector_store:
        print("✅ Knowledge Base loaded successfully!")
    else:
        print("⚠️ No Knowledge Base found. Use /api/sync endpoint to build it.")


# ============================================
# MONGODB HELPER FUNCTIONS
# ============================================

def save_session_to_db(session_id, title, category, religion):
    if db is None:
        return
    try:
        db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {
                "session_id": session_id,
                "title": title,
                "category": category,
                "religion": religion,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
    except Exception as e:
        print("DB Error (save_session): {}".format(str(e)))


def save_message_to_db(session_id, role, content, sources=None):
    if db is None:
        return
    try:
        db.chat_messages.insert_one({
            "session_id": session_id,
            "role": role,
            "content": content,
            "sources": sources or [],
            "created_at": datetime.utcnow()
        })
        db.chat_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
    except Exception as e:
        print("DB Error (save_message): {}".format(str(e)))


def get_messages_from_db(session_id):
    if db is None:
        return []
    try:
        messages = list(db.chat_messages.find(
            {"session_id": session_id},
            {"_id": 0, "session_id": 0}
        ).sort("created_at", 1))
        for msg in messages:
            if "created_at" in msg:
                msg["created_at"] = msg["created_at"].isoformat()
        return messages
    except Exception as e:
        print("DB Error (get_messages): {}".format(str(e)))
        return []


def get_chat_history_pairs_from_db(session_id):
    if db is None:
        return []
    try:
        messages = list(db.chat_messages.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("created_at", 1))
        pairs = []
        for i in range(0, len(messages) - 1, 2):
            if messages[i]["role"] == "user" and i + 1 < len(messages) and messages[i + 1]["role"] == "assistant":
                pairs.append((messages[i]["content"], messages[i + 1]["content"]))
        return pairs
    except Exception as e:
        print("DB Error (get_history_pairs): {}".format(str(e)))
        return []


# ============================================
# API ENDPOINTS
# ============================================

# -------- 1. HEALTH CHECK --------
@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "AI Legal Consultant API is active",
        "knowledge_base": "loaded" if vector_store else "not loaded",
        "database": "connected" if db is not None else "not connected",
        "total_categories": len(LAW_CATEGORIES)
    }


# -------- 2. GET ALL CATEGORIES --------
@app.get("/api/categories")
async def get_categories():
    categories = []
    for name, data in LAW_CATEGORIES.items():
        categories.append({
            "name": name,
            "description": data["description"],
            "sub_types": data["sub_types"]
        })
    return categories


# -------- 3. CHAT — Main Endpoint --------
@app.post("/api/chat")
async def chat(request: dict):
    global vector_store

    if not vector_store:
        raise HTTPException(status_code=503, detail="Knowledge Base not loaded. Please call /api/sync first.")

    message = request.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="Message field is required")

    session_id = request.get("session_id")
    category = request.get("category")
    religion = request.get("religion", "Muslim")

    is_new_session = False
    if not session_id or session_id not in active_conversations:
        is_new_session = True
        session_id = session_id or str(uuid.uuid4())
        conversation = get_conversation_chain(vector_store, GROQ_API_KEY, religion)
        active_conversations[session_id] = {
            "conversation": conversation,
            "religion": religion,
            "category": category,
        }
        title = message[:30] + "..."
        save_session_to_db(session_id, title, category, religion)

    conv = active_conversations[session_id]

    if category:
        conv["category"] = category
        if db:
            db.chat_sessions.update_one(
                {"session_id": session_id},
                {"$set": {"category": category}}
            )

    final_query = message
    if conv.get("category"):
        final_query = "[SELECTED CATEGORY: {}]\n\n{}".format(conv["category"], final_query)

    chat_history = get_chat_history_pairs_from_db(session_id)

    try:
        result = conv["conversation"].invoke({
            "question": final_query,
            "chat_history": chat_history
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI processing error: {}".format(str(e)))

    full_answer = result["answer"]

    sources = []
    if "source_documents" in result:
        for doc in result["source_documents"]:
            source_name = os.path.basename(doc.metadata.get("source", "Unknown"))
            cat = doc.metadata.get("category", "Unknown")
            sources.append("{} | {}".format(cat, source_name))

    display_answer = full_answer
    ref_keywords = ["source", "reference", "citation", "section", "case name"]
    if not any(k in message.lower() for k in ref_keywords) and "References" in full_answer:
        display_answer = full_answer.split("References")[0].strip()

    save_message_to_db(session_id, "user", message)
    save_message_to_db(session_id, "assistant", display_answer, sources)

    print("\n--- Chat: {} ---".format(session_id[:8]))
    print("  User: {}...".format(message[:80]))
    print("  AI: {}...".format(display_answer[:80]))
    print("  Sources: {}".format(len(sources)))
    print("  Saved to DB: {}".format("Yes" if db is not None else "No"))
    print("-" * 40)

    return {
        "session_id": session_id,
        "reply": display_answer,
        "detected_category": conv.get("category"),
        "sources": sources
    }


# -------- 4. GET CHAT HISTORY --------
@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    if db is not None:
        session = db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        messages = get_messages_from_db(session_id)
        return {
            "session_id": session_id,
            "title": session.get("title", "Chat"),
            "category": session.get("category"),
            "religion": session.get("religion"),
            "messages": messages
        }
    else:
        raise HTTPException(status_code=503, detail="Database not connected")


# -------- 5. GET ALL SESSIONS --------
@app.get("/api/chat/sessions")
async def get_all_sessions():
    if db is not None:
        sessions = list(db.chat_sessions.find({}, {"_id": 0}).sort("updated_at", -1))
        result = []
        for s in sessions:
            msg_count = db.chat_messages.count_documents({"session_id": s["session_id"]})
            created = s.get("created_at", "")
            if hasattr(created, "isoformat"):
                created = created.isoformat()
            result.append({
                "session_id": s.get("session_id"),
                "title": s.get("title", "Chat"),
                "message_count": msg_count,
                "category": s.get("category"),
                "created_at": created
            })
        return result
    else:
        raise HTTPException(status_code=503, detail="Database not connected")


# -------- 6. DELETE SESSION --------
@app.delete("/api/chat/session/{session_id}")
async def delete_session(session_id: str):
    if db is not None:
        result = db.chat_sessions.delete_one({"session_id": session_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        db.chat_messages.delete_many({"session_id": session_id})
        if session_id in active_conversations:
            del active_conversations[session_id]
        return {"message": "Session and all messages deleted", "session_id": session_id}
    else:
        raise HTTPException(status_code=503, detail="Database not connected")


# -------- 7. UPLOAD DOCUMENT FOR ANALYSIS --------
@app.post("/api/chat/upload")
async def upload_document(file: UploadFile = File(...)):
    allowed_types = ["application/pdf", "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are allowed")

    temp_path = "temp_{}_{}".format(uuid.uuid4().hex, file.filename)
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        documents = DocumentProcessor.extract_content(temp_path)
        extracted_text = " ".join([doc.page_content for doc in documents])

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        return {
            "filename": file.filename,
            "extracted_text": extracted_text[:3000],
            "total_chars": len(extracted_text),
            "message": "Document processed successfully."
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# -------- 8. SYNC KNOWLEDGE BASE --------
@app.post("/api/sync")
async def sync_knowledge_base():
    global vector_store
    try:
        all_files = load_local_files(DATASET_PATHS)
        if not all_files:
            raise HTTPException(status_code=404, detail="No files found in dataset paths")
        docs = DocumentProcessor.get_documents_from_files(all_files)
        chunks = get_text_chunks(docs)
        vector_store = get_vector_store(chunks)
        return {
            "message": "Knowledge Base synced successfully",
            "files_processed": len(all_files),
            "chunks_created": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Sync failed: {}".format(str(e)))


# -------- 9. CREATE NEW CHAT SESSION --------
@app.post("/api/chat/new")
async def new_chat_session(religion: str = "Muslim"):
    if not vector_store:
        raise HTTPException(status_code=503, detail="Knowledge Base not loaded")
    session_id = str(uuid.uuid4())
    conversation = get_conversation_chain(vector_store, GROQ_API_KEY, religion)
    active_conversations[session_id] = {
        "conversation": conversation,
        "religion": religion,
        "category": None,
    }
    save_session_to_db(session_id, "New Chat", None, religion)
    return {"session_id": session_id, "message": "New chat session created"}


# -------- 10. DATABASE STATS --------
@app.get("/api/stats")
async def get_stats():
    if db is not None:
        return {
            "total_sessions": db.chat_sessions.count_documents({}),
            "total_messages": db.chat_messages.count_documents({}),
            "total_categories": len(LAW_CATEGORIES),
            "knowledge_base": "loaded" if vector_store else "not loaded"
        }
    else:
        return {"error": "Database not connected"}


# ============================================
# VOICE ENDPOINTS
# ============================================

# -------- VOICE: Speech-to-Text --------
@app.post("/api/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts audio from browser (WebM/Opus format), transcribes with Whisper.
    Browser MediaRecorder produces WebM, NOT real WAV — so we save with
    the correct .webm extension so faster-whisper can decode it properly.
    """
    audio_bytes = await file.read()

    # ✅ FIX 1: Browser sends WebM/Opus, not real WAV.
    # Detect format from content type or default to .webm
    content_type = file.content_type or ""
    if "ogg" in content_type:
        ext = ".ogg"
    elif "mp4" in content_type or "mpeg" in content_type:
        ext = ".mp4"
    else:
        ext = ".webm"  # Chrome/Edge default

    temp_path = "temp_audio_{}{}" .format(uuid.uuid4().hex, ext)

    print("🎙️ Received audio: {} bytes, type: {}, saving as {}".format(
        len(audio_bytes), content_type, ext))

    with open(temp_path, "wb") as f:
        f.write(audio_bytes)

    try:
        # ✅ FIX 2: Consume generator into a list BEFORE finally deletes the file.
        # faster-whisper returns a lazy generator — if finally runs first, file is gone.
        segments, info = whisper_model.transcribe(
            temp_path,
            language=None,       # ✅ Auto-detect language (works for both Urdu & English)
            task="transcribe",
            beam_size=5
        )
        # Force full evaluation of the generator here, while file still exists
        segments_list = list(segments)
        text = " ".join([seg.text for seg in segments_list]).strip()

        print("✅ Transcription: '{}' (lang: {})".format(text[:80], info.language))
        return {"text": text, "language": info.language}

    except Exception as e:
        print("❌ Transcription error: {}".format(str(e)))
        raise HTTPException(status_code=500, detail="Transcription failed: {}".format(str(e)))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# -------- VOICE: Text-to-Speech --------
@app.post("/api/voice/synthesize")
async def synthesize_speech(request: TTSRequest):
    """
    Converts AI reply text to speech using Piper TTS.
    Requires: en_US-lessac-medium.onnx in the project root.
    Download from: https://github.com/rhasspy/piper/releases
    """
    # ✅ FIX 3: Use Pydantic model (TTSRequest) instead of raw dict.
    # FastAPI cannot parse JSON body into `request: dict` directly.
    text = request.text
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required")

    try:
        from piper import PiperVoice

        model_path = "en_US-lessac-medium.onnx"
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=503,
                detail="Piper TTS model not found. Download en_US-lessac-medium.onnx from "
                       "https://github.com/rhasspy/piper/releases and place it in the project root."
            )

        voice = PiperVoice.load(model_path)

        audio_buffer = io.BytesIO()
        with sf.SoundFile(audio_buffer, 'w', samplerate=22050, channels=1, format='WAV') as wav_file:
            voice.synthesize(text, wav_file)

        audio_buffer.seek(0)
        print("🔊 TTS synthesized {} chars".format(len(text)))
        return StreamingResponse(audio_buffer, media_type="audio/wav")

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Piper TTS not installed. Run: pip install piper-tts"
        )
    except HTTPException:
        raise
    except Exception as e:
        print("❌ TTS error: {}".format(str(e)))
        raise HTTPException(status_code=500, detail="TTS failed: {}".format(str(e)))


# ============================================
# HOW TO RUN
# ============================================
# Step 1: Make sure .env has:
#   GROQ_API_KEY=...
#   MONGODB_URI=...
#   MONGODB_DB_NAME=legal_ai_db
#
# Step 2: For voice, install ffmpeg (required by faster-whisper):
#   Windows: Download from https://ffmpeg.org/download.html
#            Extract and add to PATH
#   Then: pip install faster-whisper soundfile piper-tts
#
# Step 3: Download Piper TTS model for /api/voice/synthesize:
#   https://github.com/rhasspy/piper/releases
#   Place en_US-lessac-medium.onnx + en_US-lessac-medium.onnx.json in project root
#
# Step 4: Run server:
#   uvicorn Api:app --reload --port 8000
# ============================================