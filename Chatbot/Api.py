# ============================================
# Api.py — Complete Working Backend with Voice
# ============================================

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv
from faster_whisper import WhisperModel
import io
import numpy as np
from fastapi.responses import StreamingResponse
from pathlib import Path
import subprocess

# --- Import existing chatbot logic ---
try:
    from utils import (
        get_vector_store,
        get_conversation_chain,
        LAW_CATEGORIES
    )
    print("✅ utils imported successfully")
except Exception as e:
    print(f"⚠️ utils import error: {e}")
    def get_vector_store(): return None
    def get_conversation_chain(*args): return None
    LAW_CATEGORIES = {}

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "legal_ai_db")

# Create recordings directory
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(exist_ok=True)
print(f"📁 Recordings will be saved to: {RECORDINGS_DIR.absolute()}")

# Get ffmpeg path (look in current directory first)
FFMPEG_PATH = os.path.join(os.path.dirname(__file__), "ffmpeg.exe")
if not os.path.exists(FFMPEG_PATH):
    FFMPEG_PATH = "ffmpeg"  # Try system PATH
print(f"🔧 Using ffmpeg at: {FFMPEG_PATH}")

# Load Whisper model
print("🔄 Loading Whisper model...")
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
print("✅ Whisper model loaded successfully!")

# ============================================
# FASTAPI APP SETUP
# ============================================
app = FastAPI(
    title="AI Legal Consultant API",
    description="REST API for Pakistan AI Legal Assistant",
    version="1.0.0"
)

# CORS Middleware
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

class TTSRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    session_id: str = None
    category: str = None
    religion: str = "Muslim"

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
    global vector_store, db
    
    print("\n🚀 Starting AI Legal Consultant API...")
    
    # Connect to MongoDB
    if MONGODB_URI:
        try:
            client = MongoClient(MONGODB_URI)
            db = client[MONGODB_DB_NAME]
            client.admin.command("ping")
            print("✅ MongoDB connected successfully!")
            
            # Create indexes
            db.chat_sessions.create_index("session_id", unique=True)
            db.chat_messages.create_index("session_id")
            db.chat_messages.create_index("created_at")
            print("✅ Database indexes created!")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            db = None
    else:
        print("⚠️ No MONGODB_URI found, skipping database")
    
    # Load Knowledge Base
    try:
        vector_store = get_vector_store()
        if vector_store:
            print("✅ Knowledge Base loaded successfully!")
        else:
            print("⚠️ No Knowledge Base found. Use /api/sync endpoint to build it.")
    except Exception as e:
        print(f"⚠️ Could not load knowledge base: {e}")


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
        print(f"💾 Session saved: {session_id}")
    except Exception as e:
        print(f"DB Error (save_session): {e}")

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
        print(f"DB Error (save_message): {e}")

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
        print(f"DB Error (get_messages): {e}")
        return []

def get_chat_history_pairs_from_db(session_id):
    """Returns chat history as list of (user, assistant) tuples"""
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
        
        print(f"📜 Retrieved {len(pairs)} conversation pairs from DB")
        return pairs
    except Exception as e:
        print(f"DB Error (get_history_pairs): {e}")
        return []


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "AI Legal Consultant API is active",
        "knowledge_base": "loaded" if vector_store else "not loaded",
        "database": "connected" if db is not None else "not connected",
        "voice_endpoints": "/api/voice/transcribe, /api/voice/synthesize",
        "recordings_dir": str(RECORDINGS_DIR.absolute())
    }

@app.get("/api/categories")
async def get_categories():
    categories = []
    for name, data in LAW_CATEGORIES.items():
        categories.append({
            "name": name,
            "description": data.get("description", ""),
            "sub_types": data.get("sub_types", [])
        })
    return categories

@app.get("/api/chat/sessions")
async def get_all_sessions():
    if db is None:
        return []
    try:
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
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return []

@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    if db is None:
        raise HTTPException(503, "Database not connected")
    
    session = db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    
    messages = get_messages_from_db(session_id)
    return {
        "session_id": session_id,
        "title": session.get("title", "Chat"),
        "category": session.get("category"),
        "religion": session.get("religion"),
        "messages": messages
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    global vector_store
    
    if not vector_store:
        raise HTTPException(503, "Knowledge Base not loaded. Please call /api/sync first.")
    
    message = request.message
    session_id = request.session_id or str(uuid.uuid4())
    category = request.category
    religion = request.religion
    
    print(f"\n💬 Chat: {message[:50]}...")
    print(f"🔑 Session: {session_id}")
    print(f"📂 Category: {category}")
    print(f"🕊️ Religion: {religion}")
    
    # Create conversation if needed
    if session_id not in active_conversations:
        print("🆕 Creating new conversation chain...")
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
    
    # Build query with category context
    final_query = message
    if conv.get("category"):
        final_query = f"[CATEGORY: {conv['category']}]\n\n{message}"
        print(f"🏷️ Added category context: {conv['category']}")
    
    # ✅ FIX: Get chat history from database
    chat_history = get_chat_history_pairs_from_db(session_id)
    print(f"📜 Chat history: {len(chat_history)} previous exchanges")
    
    # Get response from AI with chat history
    try:
        print("🤖 Calling AI model...")
        result = conv["conversation"].invoke({
            "question": final_query,
            "chat_history": chat_history  # ✅ Added chat_history
        })
        reply = result.get("answer", "Sorry, I couldn't process that.")
        print(f"✅ AI response: {reply[:80]}...")
        
        # Extract sources if available
        sources = []
        if "source_documents" in result:
            for doc in result["source_documents"]:
                source_name = os.path.basename(doc.metadata.get("source", "Unknown"))
                cat = doc.metadata.get("category", "Unknown")
                sources.append(f"{cat} | {source_name}")
            if sources:
                print(f"📚 Sources: {len(sources)} documents")
        
    except Exception as e:
        print(f"❌ AI error: {e}")
        reply = "I understand you're asking about legal matters. Please consult a licensed lawyer for specific advice."
        sources = []
    
    # Save to database
    save_message_to_db(session_id, "user", message)
    save_message_to_db(session_id, "assistant", reply, sources)
    print(f"💾 Messages saved to database")
    
    return {
        "session_id": session_id,
        "reply": reply,
        "detected_category": conv.get("category"),
        "sources": sources
    }

@app.delete("/api/chat/session/{session_id}")
async def delete_session(session_id: str):
    if db:
        db.chat_sessions.delete_one({"session_id": session_id})
        db.chat_messages.delete_many({"session_id": session_id})
    if session_id in active_conversations:
        del active_conversations[session_id]
    return {"message": "Session deleted"}

@app.post("/api/chat/new")
async def new_chat_session(religion: str = "Muslim"):
    if not vector_store:
        raise HTTPException(503, "Knowledge Base not loaded")
    session_id = str(uuid.uuid4())
    conversation = get_conversation_chain(vector_store, GROQ_API_KEY, religion)
    active_conversations[session_id] = {
        "conversation": conversation,
        "religion": religion,
        "category": None,
    }
    save_session_to_db(session_id, "New Chat", None, religion)
    return {"session_id": session_id, "message": "New chat session created"}

@app.post("/api/sync")
async def sync_knowledge_base():
    global vector_store
    try:
        from utils import load_local_files, DocumentProcessor, get_text_chunks
        DATASET_PATHS = [
            r"D:\FYP\Dataset\Family Law",
            r"D:\FYP\Dataset\Criminal Law"
        ]
        print("🔄 Syncing knowledge base...")
        all_files = load_local_files(DATASET_PATHS)
        if not all_files:
            raise HTTPException(404, "No files found in dataset paths")
        print(f"📁 Found {len(all_files)} files")
        
        docs = DocumentProcessor.get_documents_from_files(all_files)
        chunks = get_text_chunks(docs)
        print(f"📄 Created {len(chunks)} chunks")
        
        vector_store = get_vector_store(chunks)
        print("✅ Knowledge base synced successfully")
        
        return {
            "message": "Knowledge Base synced successfully",
            "files_processed": len(all_files),
            "chunks_created": len(chunks)
        }
    except Exception as e:
        print(f"❌ Sync failed: {e}")
        raise HTTPException(500, f"Sync failed: {e}")

@app.get("/api/stats")
async def get_stats():
    return {
        "total_sessions": db.chat_sessions.count_documents({}) if db else 0,
        "total_messages": db.chat_messages.count_documents({}) if db else 0,
        "knowledge_base": "loaded" if vector_store else "not loaded"
    }


# ============================================
# VOICE ENDPOINTS - FULLY WORKING
# ============================================

@app.post("/api/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Speech-to-Text endpoint.
    Accepts WebM/Opus audio, converts to WAV using ffmpeg, then transcribes with Whisper.
    """
    print("\n" + "="*50)
    print("🎙️ POST /api/voice/transcribe called")
    
    # Read audio
    audio_bytes = await file.read()
    print(f"📦 Received {len(audio_bytes)} bytes")
    print(f"📋 Content-Type: {file.content_type}")
    
    if len(audio_bytes) == 0:
        raise HTTPException(400, "Empty audio file")
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    webm_path = RECORDINGS_DIR / f"recording_{timestamp}_{unique_id}.webm"
    wav_path = RECORDINGS_DIR / f"recording_{timestamp}_{unique_id}.wav"
    
    # Save original WebM
    with open(webm_path, "wb") as f:
        f.write(audio_bytes)
    print(f"💾 Saved WebM to: {webm_path}")
    print(f"📁 WebM size: {webm_path.stat().st_size} bytes")
    
    # Convert WebM to WAV using ffmpeg
    conversion_success = False
    
    # Try using ffmpeg from project folder
    ffmpeg_cmd = None
    if os.path.exists(FFMPEG_PATH):
        ffmpeg_cmd = FFMPEG_PATH
        print(f"🔧 Found ffmpeg at: {FFMPEG_PATH}")
    else:
        ffmpeg_cmd = "ffmpeg"
        print(f"🔧 Using system ffmpeg")
    
    try:
        cmd = [
            ffmpeg_cmd,
            '-i', str(webm_path),
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            str(wav_path)
        ]
        
        print(f"🔄 Running ffmpeg conversion...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and wav_path.exists() and wav_path.stat().st_size > 0:
            conversion_success = True
            print(f"✅ Conversion successful!")
            print(f"📁 WAV size: {wav_path.stat().st_size} bytes")
        else:
            print(f"❌ FFmpeg conversion failed (code: {result.returncode})")
            if result.stderr:
                print(f"Error: {result.stderr[:200]}")
                
    except subprocess.TimeoutExpired:
        print("❌ FFmpeg conversion timed out")
    except Exception as e:
        print(f"❌ FFmpeg error: {e}")
    
    # Use original file if conversion failed
    audio_to_transcribe = wav_path if conversion_success else webm_path
    if not conversion_success:
        print("⚠️ Using original WebM file (may fail if format not supported)")
    
    # Transcribe with Whisper
    try:
        print("🔄 Starting Whisper transcription...")
        segments, info = whisper_model.transcribe(
            str(audio_to_transcribe),
            language=None,
            task="transcribe",
            beam_size=5
        )
        
        segments_list = list(segments)
        text = " ".join([seg.text for seg in segments_list]).strip()
        
        print(f"✅ Transcription completed!")
        print(f"🎤 Detected language: {info.language} (confidence: {info.language_probability:.2f})")
        print(f"📝 Transcribed text: '{text[:100]}...'")
        print(f"📊 Text length: {len(text)} characters")
        print("="*50 + "\n")
        
        return {
            "text": text if text else "",
            "language": info.language,
            "audio_path": str(audio_to_transcribe.absolute()),
            "webm_path": str(webm_path.absolute()),
            "filename": audio_to_transcribe.name,
            "file_size": audio_to_transcribe.stat().st_size,
            "converted": conversion_success
        }
        
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        print("="*50 + "\n")
        raise HTTPException(500, detail=f"Transcription failed: {str(e)}")


@app.post("/api/video/transcribe")
async def transcribe_audio_alt(file: UploadFile = File(...)):
    """Alternative endpoint for /api/video/transcribe (for compatibility)"""
    print("🎙️ POST /api/video/transcribe called (redirecting)")
    return await transcribe_audio(file)


@app.post("/api/voice/synthesize")
async def synthesize_speech(request: TTSRequest):
    """
    Text-to-Speech endpoint with multiple backends.
    Tries gTTS first (best quality), then pyttsx3, then edge-tts, then fallback beep.
    """
    print(f"\n🔊 POST /api/voice/synthesize called")
    print(f"📝 Text: '{request.text[:50]}...' (length: {len(request.text)})")
    
    if not request.text:
        raise HTTPException(400, "Text is required")
    
    audio_buffer = io.BytesIO()
    
    # ============================================
    # Method 1: Try gTTS (Google TTS - Best quality, needs internet)
    # ============================================
    try:
        from gtts import gTTS
        
        print("🔄 Using gTTS (Google Text-to-Speech)...")
        tts = gTTS(text=request.text, lang='en', slow=False)
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        print(f"✅ TTS complete using gTTS")
        print("="*50 + "\n")
        return StreamingResponse(
            audio_buffer, 
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
        
    except ImportError:
        print("⚠️ gTTS not installed. Run: pip install gtts")
    except Exception as e:
        print(f"⚠️ gTTS error: {e}")
    
    # ============================================
    # Method 2: Try pyttsx3 (Offline, Windows SAPI)
    # ============================================
    try:
        import pyttsx3
        import tempfile
        
        print("🔄 Using pyttsx3 (offline TTS)...")
        engine = pyttsx3.init()
        
        # Configure voice
        voices = engine.getProperty('voices')
        if voices:
            engine.setProperty('voice', voices[0].id)
        engine.setProperty('rate', 150)  # Speed
        engine.setProperty('volume', 0.9)  # Volume
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            temp_path = tmp_file.name
        
        engine.save_to_file(request.text, temp_path)
        engine.runAndWait()
        
        # Read the file
        with open(temp_path, 'rb') as f:
            audio_buffer.write(f.read())
        
        # Clean up
        os.unlink(temp_path)
        
        audio_buffer.seek(0)
        print(f"✅ TTS complete using pyttsx3")
        print("="*50 + "\n")
        return StreamingResponse(audio_buffer, media_type="audio/wav")
        
    except ImportError:
        print("⚠️ pyttsx3 not installed. Run: pip install pyttsx3")
    except Exception as e:
        print(f"⚠️ pyttsx3 error: {e}")
    
    # ============================================
    # Method 3: Try edge-tts (Microsoft Edge voices - Very natural)
    # ============================================
    try:
        import edge_tts
        import asyncio
        
        print("🔄 Using edge-tts (Microsoft Edge voices)...")
        
        # Create a temporary file
        temp_file = RECORDINGS_DIR / f"tts_{uuid.uuid4().hex[:8]}.mp3"
        
        # Use async to run edge_tts
        communicate = edge_tts.Communicate(request.text, "en-US-JennyNeural")
        await communicate.save(str(temp_file))
        
        # Read the file
        with open(temp_file, 'rb') as f:
            audio_buffer.write(f.read())
        
        # Clean up
        temp_file.unlink()
        
        audio_buffer.seek(0)
        print(f"✅ TTS complete using edge-tts")
        print("="*50 + "\n")
        return StreamingResponse(audio_buffer, media_type="audio/mpeg")
        
    except ImportError:
        print("⚠️ edge-tts not installed. Run: pip install edge-tts")
    except Exception as e:
        print(f"⚠️ edge-tts error: {e}")
    
    # ============================================
    # Method 4: Fallback - Simple sine wave beep
    # ============================================
    print("⚠️ No TTS engine available, using beep fallback")
    print("💡 Install gTTS for better quality: pip install gtts")
    
    sample_rate = 22050
    duration = min(2.0, len(request.text) / 20)
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Generate sine wave (beep)
    waveform = 0.3 * np.sin(2 * np.pi * 440 * t)
    
    # Fade in/out
    fade_samples = int(0.05 * sample_rate)
    if len(waveform) > fade_samples * 2:
        fade_in = np.linspace(0, 1, fade_samples)
        fade_out = np.linspace(1, 0, fade_samples)
        waveform[:fade_samples] *= fade_in
        waveform[-fade_samples:] *= fade_out
    
    try:
        import soundfile as sf
        sf.write(audio_buffer, waveform, sample_rate, format='WAV')
        audio_buffer.seek(0)
        print(f"✅ TTS fallback: beep sound")
    except:
        # Very simple WAV header
        audio_buffer.write(b'RIFF$$$\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00\xee\x02\x00\x02\x00\x10\x00data')
        audio_buffer.seek(0)
    
    print("="*50 + "\n")
    return StreamingResponse(audio_buffer, media_type="audio/wav")


# ============================================
# HOW TO RUN
# ============================================
# 1. Install dependencies:
#    pip install fastapi uvicorn pymongo python-dotenv faster-whisper
#    pip install gtts pyttsx3 edge-tts soundfile numpy
#
# 2. Run command:
#    uvicorn Api:app --reload --port 8000
#
# 3. For TTS to work properly, install at least one:
#    pip install gtts              (Recommended - best quality)
#    OR
#    pip install pyttsx3           (Offline, Windows)
#    OR
#    pip install edge-tts          (Microsoft natural voices)
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)