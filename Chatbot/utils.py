import sys
import types
import uuid
import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document 
from langchain.chains import ConversationalRetrievalChain
from langchain_groq import ChatGroq 
from langchain.prompts import PromptTemplate

# --- DLL Bypass Hack ---
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
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                if file.endswith(".pdf"):
                    pdf_files.append(os.path.join(root, file))
    return pdf_files

def get_pdf_documents(pdf_list):
    documents = []
    for pdf_path in pdf_list:
        try:
            with open(pdf_path, "rb") as f:
                pdf_reader = PdfReader(f)
                file_name = os.path.basename(pdf_path)
                for i, page in enumerate(pdf_reader.pages):
                    content = page.extract_text()
                    if content:
                        documents.append(Document(
                            page_content=content, 
                            metadata={"source": file_name, "page": i+1}
                        ))
        except Exception as e:
            print(f"Error reading {pdf_path}: {e}")
    return documents

def get_text_chunks(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    return text_splitter.split_documents(documents)

def get_vector_store(chunks=None):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    index_path = "faiss_index_legal"
    if os.path.exists(index_path):
        return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
    if chunks:
        vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
        vectorstore.save_local(index_path)
        return vectorstore
    return None

def get_conversation_chain(vector_store, api_key, user_religion):
    llm = ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key=api_key, temperature=0.3)
    
    template = f"""You are a professional Legal Consultant for Pakistan Family Law. 
    The user is {user_religion} and has NO legal knowledge. 
    
    Instructions:
    1. If the query is vague, ask brief follow-up questions to understand the context (e.g., owner of property, heirs, etc.).
    2. Once details are clear, provide advice based on the context.
    3. Respond in Roman Urdu for Urdu queries and English for English queries.
    4. Do not mention PDF file names or source references.

    Context: {{context}}
    Chat History: {{chat_history}}
    Question: {{question}}
    Lawyer's Guidance:"""

    PROMPT = PromptTemplate(input_variables=["context", "chat_history", "question"], template=template)

    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vector_store.as_retriever(search_kwargs={"k": 5}),
        return_source_documents=False, # Reference part disabled
        combine_docs_chain_kwargs={"prompt": PROMPT}
    )