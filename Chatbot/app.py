import streamlit as st
import os
from utils import (
    load_local_pdfs, get_pdf_documents, get_text_chunks, 
    get_vector_store, get_conversation_chain
)
from langchain_core.messages import HumanMessage, AIMessage

# --- Page Configuration ---
st.set_page_config(page_title="Legal AI Researcher", page_icon="⚖️", layout="wide")
st.title("⚖️ AI Legal Consultant: Pakistan Family Law")
st.markdown("---")

GROQ_API_KEY = "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" 
DATASET_PATH = r"D:\FYP\Dataset\Family Law"

# Session States
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [] 
if "display_history" not in st.session_state:
    st.session_state.display_history = [] 
if "conversation" not in st.session_state:
    st.session_state.conversation = None
if "vector_store" not in st.session_state:
    st.session_state.vector_store = None

# --- SIDEBAR ---
with st.sidebar:
    st.header("👤 Configuration")
    religion = st.selectbox("Religion:", ["Muslim", "Christian", "Hindu", "Ahmadi", "Sikh", "Other"])
    st.divider()
    if st.button("🚀 Sync Dataset"):
        with st.spinner("Processing..."):
            v_store = get_vector_store()
            if not v_store:
                pdf_list = load_local_pdfs(DATASET_PATH)
                if pdf_list:
                    docs = get_pdf_documents(pdf_list)
                    chunks = get_text_chunks(docs)
                    v_store = get_vector_store(chunks)
            st.session_state.vector_store = v_store
            st.success("Ready!")

    if st.session_state.vector_store:
        st.session_state.conversation = get_conversation_chain(
            st.session_state.vector_store, GROQ_API_KEY, religion
        )

# --- CHAT DISPLAY ---
for msg in st.session_state.display_history:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# --- CHAT LOGIC ---
if user_query := st.chat_input("Explain your situation..."):
    # UI update
    st.session_state.display_history.append({"role": "user", "content": user_query})
    with st.chat_message("user"):
        st.markdown(user_query)

    if st.session_state.conversation:
        with st.chat_message("assistant"):
            try:
                # Get result (No sources will be returned now)
                result = st.session_state.conversation({
                    "question": user_query,
                    "chat_history": st.session_state.chat_history
                })
                
                answer = result["answer"]
                st.markdown(answer)
                
                # Update history
                st.session_state.chat_history.append((user_query, answer))
                st.session_state.display_history.append({"role": "assistant", "content": answer})
                
            except Exception as e:
                st.error(f"Error: {e}")
    else:
        st.warning("Please click 'Sync Dataset' in the sidebar first.")