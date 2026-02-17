import sys
import types
import uuid
import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document  # Naya import metadata ke liye

# --- DLL Bypass Hack (Top par rehne dein) ---
if "uuid_utils" not in sys.modules:
    m = types.ModuleType("uuid_utils")
    sys.modules["uuid_utils"] = m
    m.compat = types.ModuleType("compat")
    sys.modules["uuid_utils.compat"] = m.compat
    m.compat.uuid7 = lambda: uuid.uuid4()
    m.uuid7 = lambda: uuid.uuid4()

def load_local_pdfs(folder_path):
    pdf_files = []
    if os.path.exists(folder_path):
        for root, dirs, files in os.walk(folder_path): # Sub-folders bhi scan karega
            for file in files:
                if file.endswith(".pdf"):
                    pdf_files.append(os.path.join(root, file))
    return pdf_files

def get_pdf_documents(pdf_list):
    """Text ke saath file ka naam (metadata) bhi save karega"""
    documents = []
    for pdf_path in pdf_list:
        try:
            with open(pdf_path, "rb") as f:
                pdf_reader = PdfReader(f)
                file_name = os.path.basename(pdf_path)
                for page in pdf_reader.pages:
                    content = page.extract_text()
                    if content:
                        # Har page ko Document object mein convert karna metadata ke saath
                        documents.append(Document(page_content=content, metadata={"source": file_name}))
        except Exception as e:
            print(f"Error reading {pdf_path}: {e}")
    return documents

def get_text_chunks(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=250)
    return text_splitter.split_documents(documents)

def get_vector_store(chunks):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
    return vectorstore

def get_context_from_db(user_query, vector_store):
    docs = vector_store.similarity_search(user_query, k=5) # 5 results mangwaein taaki law aur cases dono milain
    context = ""
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        context += f"\n[From File: {source}]\n{doc.page_content}\n---\n"
    return context