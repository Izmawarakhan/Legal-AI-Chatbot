import sys
import types
import uuid

# --- 1. DLL ERROR BYPASS HACK (Sabse Pehle) ---
if "uuid_utils" not in sys.modules:
    m = types.ModuleType("uuid_utils")
    sys.modules["uuid_utils"] = m
    m.compat = types.ModuleType("compat")
    sys.modules["uuid_utils.compat"] = m.compat
    m.compat.uuid7 = lambda: uuid.uuid4()
    m.uuid7 = lambda: uuid.uuid4()

import streamlit as st
import os
from utils import (
    load_local_pdfs, 
    get_pdf_documents, # Updated Function Name
    get_text_chunks, 
    get_vector_store, 
    get_context_from_db
)
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage

# --- 2. Page Config ---
st.set_page_config(page_title="Legal AI Researcher", page_icon="⚖️", layout="wide")
st.title("⚖️ Legal AI Researcher")

# --- 3. API Key & Path Setup ---
GROQ_API_KEY = "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"
MODEL_NAME = "llama-3.3-70b-versatile"
DATASET_PATH = r"D:\FYP\Dataset\Family Law"

# --- 4. Sidebar for Data Loading ---
with st.sidebar:
    st.header("📂 Dataset Management")
    st.info(f"Current Folder: {DATASET_PATH}")
    
    if st.button("🚀 Load/Sync Family Law Data"):
        with st.spinner("Processing Laws and Past Cases..."):
            pdf_list = load_local_pdfs(DATASET_PATH)
            
            if pdf_list:
                # Step 2: Use get_pdf_documents instead of get_pdf_text
                docs = get_pdf_documents(pdf_list)
                # Step 3: Text chunks
                text_chunks = get_text_chunks(docs)
                # Step 4: Vector Store
                vector_store = get_vector_store(text_chunks)
                
                st.session_state.vector_store = vector_store
                st.success(f"Successfully loaded {len(pdf_list)} documents!")
            else:
                st.error("No PDF files found in the folder.")

# --- 5. Chat History Initialize ---
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# --- 6. Display Chat History ---
for message in st.session_state.chat_history:
    role = "user" if isinstance(message, HumanMessage) else "assistant"
    with st.chat_message(role):
        st.markdown(message.content)

# --- 7. Main Chat Logic ---
if user_query := st.chat_input("Ask a legal question regarding Family Law or Past Cases..."):
    st.session_state.chat_history.append(HumanMessage(content=user_query))
    with st.chat_message("user"):
        st.markdown(user_query)

    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        
        context = ""
        if "vector_store" in st.session_state:
            context = get_context_from_db(user_query, st.session_state.vector_store)
        else:
            st.warning("⚠️ Please load the dataset from the sidebar first.")
        
        llm = ChatGroq(groq_api_key=GROQ_API_KEY, model_name=MODEL_NAME, streaming=True)
        
        # Smart Prompt for Statutes + Past Cases
        prompt = f"""
        You are a Senior Legal Consultant in Pakistan. 
        Analyze the user's situation using the Law Statutes and Judicial Precedents (Past Cases) provided in the context.

        Response Structure:
        1. **Legal Basis**: Mention relevant Sections or Acts (e.g., MFLO 1961).
        2. **Case Precedents**: Identify matching past cases from the context. 
           - Mention the file name/source specifically.
           - Explain the court's decision in that case.
        3. **Strategy & Advice**: Guide the user on what they can do next based on these findings.

        Context: {context}
        Question: {user_query}
        """
        
        full_response = ""
        try:
            for chunk in llm.stream(prompt):
                full_response += chunk.content
                response_placeholder.markdown(full_response + "▌")
            
            response_placeholder.markdown(full_response)
            st.session_state.chat_history.append(AIMessage(content=full_response))
        except Exception as e:
            st.error(f"Chat Error: {str(e)}") 