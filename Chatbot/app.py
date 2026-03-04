import streamlit as st
import os
import uuid 
import pypdf 
from dotenv import load_dotenv
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

# ============================================
# CONFIGURATION
# ============================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
raw_paths = os.getenv("DATASET_PATH", "")

# Handle multiple paths from .env
if ";" in raw_paths:
    DATASET_PATHS = [p.strip() for p in raw_paths.split(";") if p.strip()]
elif "," in raw_paths:
    DATASET_PATHS = [p.strip() for p in raw_paths.split(",") if p.strip()]
else:
    DATASET_PATHS = [
        r"D:\FYP\Dataset\Family Law",
        r"D:\FYP\Dataset\Criminal Law"
    ]

print(f"DEBUG: Dataset Paths loaded: {DATASET_PATHS}")

# ============================================
# PAGE CONFIG & UI STYLING
# ============================================
st.set_page_config(page_title="AI Legal Consultant - Pakistan", page_icon="⚖️", layout="wide")

st.markdown("""
    <style>
    .stChatFloatingInputContainer { background-color: transparent; }
    .stChatMessage { padding: 1.2rem; border-radius: 12px; margin-bottom: 10px; border: 1px solid #e0e0e0; }
    
    .legal-disclaimer { 
        background-color: #fff3cd; 
        padding: 15px; 
        border-radius: 8px; 
        border-left: 5px solid #ffc107; 
        margin-bottom: 25px;
        color: #856404;
    }
    .upload-section {
        padding: 10px;
        border: 1px dashed #ccc;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    </style>
""", unsafe_allow_html=True)

# ============================================
# SESSION STATE MANAGEMENT
# ============================================
if "all_sessions" not in st.session_state:
    st.session_state.all_sessions = {}

if "current_sid" not in st.session_state:
    st.session_state.current_sid = str(uuid.uuid4())
    st.session_state.all_sessions[st.session_state.current_sid] = {
        "title": "New Chat",
        "chat_history": [],
        "display_history": [],
        "selected_category": None,
    }

if "vector_store" not in st.session_state:
    st.session_state.vector_store = get_vector_store()

if "conversation" not in st.session_state and st.session_state.vector_store:
    st.session_state.conversation = get_conversation_chain(
        st.session_state.vector_store, GROQ_API_KEY, "Muslim"
    )

if "uploaded_doc_text" not in st.session_state:
    st.session_state.uploaded_doc_text = ""

def start_new_chat():
    new_id = str(uuid.uuid4())
    st.session_state.all_sessions[new_id] = {
        "title": "New Chat",
        "chat_history": [],
        "display_history": [],
        "selected_category": None,
    }
    st.session_state.current_sid = new_id

# ============================================
# SIDEBAR
# ============================================
with st.sidebar:
    st.title("⚖️ AI Legal Consultant")
    
    if st.button("➕ Start New Chat", use_container_width=True, type="primary", key="btn_new_chat"):
        start_new_chat()
        st.rerun()
    
    st.divider()

    # --- Category Selection ---
    st.subheader("📋 Select Law Category")
    current_sess = st.session_state.all_sessions[st.session_state.current_sid]
    
    category_options = ["Auto-Detect (Let AI decide)"] + get_all_categories()
    selected = st.selectbox("Choose category:", category_options, index=0, key="cat_select")
    
    if selected != "Auto-Detect (Let AI decide)":
        current_sess["selected_category"] = selected
    else:
        current_sess["selected_category"] = None

    st.divider()

    # --- File Upload ---
    st.subheader("📁 Upload Your Document")
    st.markdown('<div class="upload-section">', unsafe_allow_html=True)
    uploaded_file = st.file_uploader("Analyze personal legal files", type=["pdf", "txt"], key="file_analyzer")
    
    if uploaded_file:
        with st.spinner("Processing file..."):
            if uploaded_file.type == "application/pdf":
                reader = pypdf.PdfReader(uploaded_file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                st.session_state.uploaded_doc_text = text
            else:
                st.session_state.uploaded_doc_text = str(uploaded_file.read(), "utf-8")
            st.success("File content loaded!")
    st.markdown('</div>', unsafe_allow_html=True)

    st.divider()

    # --- Chat History ---
    st.subheader("📜 Recent Chats")
    for sid, data in reversed(list(st.session_state.all_sessions.items())):
        label = f"💬 {data['title']}"
        if st.button(label, key=f"hist_{sid}", use_container_width=True):
            st.session_state.current_sid = sid
            st.rerun()

    st.divider()

    # --- Settings ---
    st.subheader("⚙️ Settings")
    user_religion = st.selectbox(
        "Client Religion:", 
        ["Muslim", "Christian", "Hindu", "Other"], 
        key="religion_select"
    )
    
    if st.button("🚀 Sync Knowledge Base", use_container_width=True, key="btn_sync_db"):
        with st.spinner("Processing all law documents..."):
            all_files = load_local_files(DATASET_PATHS)
            if all_files:
                docs = DocumentProcessor.get_documents_from_files(all_files)
                chunks = get_text_chunks(docs)
                st.session_state.vector_store = get_vector_store(chunks)
                st.session_state.conversation = get_conversation_chain(
                    st.session_state.vector_store, GROQ_API_KEY, user_religion
                )
                st.success(f"Synced! {len(all_files)} files processed.")
                st.rerun()

# ============================================
# MAIN INTERFACE
# ============================================
st.title("⚖️ AI Legal Consultant - Pakistan")

st.markdown("""
    <div class="legal-disclaimer">
        <h4 style="color: #856404; margin-top: 0;">⚠️ Legal Disclaimer</h4>
        <p style="color: #856404; font-size: 0.95rem;">
            This tool provides <strong>informational guidance</strong> only. 
            Always consult a licensed lawyer for official court matters.
        </p>
    </div>
""", unsafe_allow_html=True)

# Refresh current session reference
current_sess = st.session_state.all_sessions[st.session_state.current_sid]

# --- Show Category Cards on New Chat ---
if not current_sess["display_history"]:
    st.markdown("### 📋 Available Law Categories")
    
    category_emojis = {
        "Family Law": "👨‍👩‍👧‍👦",
        "Criminal Law": "⚖️", 
        "Labour Laws": "👷",
        "Land & Property Laws": "🏠",
        "Islamic Religious Laws": "☪️",
        "Excise Taxation Laws": "💰",
        "Health & Medical Laws": "🏥",
    }
    
    cols = st.columns(4)
    for i, (cat_name, cat_data) in enumerate(LAW_CATEGORIES.items()):
        with cols[i % 4]:
            emoji = category_emojis.get(cat_name, "📋")
            st.markdown(f"""
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; 
                     margin-bottom: 8px; border-left: 4px solid #1B5E20; min-height: 100px;">
                    <strong>{emoji} {cat_name}</strong><br>
                    <small style="color: #666;">{cat_data['description']}</small>
                </div>
            """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("*Describe your legal concern or select a category from the sidebar to get started.*")

# --- Display Chat History ---
for msg in current_sess["display_history"]:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# ============================================
# CHAT INPUT LOGIC
# ============================================
if user_query := st.chat_input("Describe your legal concern here..."):
    # Set chat title from first message
    if not current_sess["display_history"]:
        current_sess["title"] = user_query[:30] + "..."

    current_sess["display_history"].append({"role": "user", "content": user_query})
    with st.chat_message("user"):
        st.markdown(user_query)

    with st.chat_message("assistant"):
        if not st.session_state.vector_store:
            st.error("⚠️ Knowledge base not initialized. Please click 'Sync Knowledge Base' in the sidebar.")
        else:
            with st.spinner("Consulting legal database..."):
                # Build query with additional context
                final_query = user_query
                
                # Add uploaded document context
                if st.session_state.uploaded_doc_text:
                    final_query = (
                        f"CONTEXT FROM UPLOADED FILE:\n"
                        f"{st.session_state.uploaded_doc_text[:2000]}\n\n"
                        f"USER QUESTION: {user_query}"
                    )
                
                # Add selected category context
                if current_sess.get("selected_category"):
                    cat = current_sess["selected_category"]
                    final_query = f"[SELECTED CATEGORY: {cat}]\n\n{final_query}"

                result = st.session_state.conversation.invoke({
                    "question": final_query,
                    "chat_history": current_sess["chat_history"]
                })
                
                # Terminal logging for debugging
                print(f"\n--- LOG: {current_sess['title']} ---")
                if "source_documents" in result:
                    for i, doc in enumerate(result["source_documents"]):
                        source_path = doc.metadata.get("source", "Unknown")
                        source_name = os.path.basename(source_path)
                        category = doc.metadata.get("category", "Unknown")
                        doc_type = doc.metadata.get("doc_type", "Unknown")
                        print(f"  [{i+1}] {doc_type.upper()} | {category} | {source_name}")
                print("-" * 40)

                full_answer = result["answer"]
                
                # Filter out references unless user asked for them
                display_answer = full_answer
                ref_keywords = ["source", "reference", "citation", "section", "case name"]
                if not any(k in user_query.lower() for k in ref_keywords) and "References" in full_answer:
                    display_answer = full_answer.split("References")[0].strip()

                st.markdown(display_answer)

                # Show download button if response contains a court draft
                if "IN THE COURT OF" in display_answer.upper():
                    st.download_button(
                        label="📄 Download Legal Draft (.txt)",
                        data=display_answer,
                        file_name=f"Legal_Draft_{uuid.uuid4().hex[:8]}.txt",
                        mime="text/plain",
                        key=f"dl_{uuid.uuid4().hex[:8]}"
                    )
                
                # Save to history
                current_sess["chat_history"].append((user_query, full_answer))
                current_sess["display_history"].append({"role": "assistant", "content": display_answer})

# Footer
st.markdown("""
    <br><br>
    <p style='text-align:center; color:grey; font-size:0.75rem;'>
        Powered by AI Legal Engine | 7 Law Categories | 19 Acts & Laws Database<br>
        ⚠️ Verify all information with official statutes and licensed lawyers.
    </p>
""", unsafe_allow_html=True)