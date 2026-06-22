# ============================================
# fix_retrieval.py — Diagnose & Fix FAISS Retrieval
# ============================================
# Step 1: Diagnose current FAISS index (what categories exist)
# Step 2: Rebuild index with proper category metadata
# Step 3: Inject category keywords into chunks for better retrieval
#
# Place in: D:\FYP\old_fiels\Chatbot\fix_retrieval.py
# Run:      python fix_retrieval.py
# ============================================

import os
import sys
import types
import uuid as _uuid
import shutil
from collections import Counter

# UUID fix
if "uuid_utils" not in sys.modules:
    uuid_utils = types.ModuleType("uuid_utils")
    sys.modules["uuid_utils"] = uuid_utils
    compat = types.ModuleType("compat")
    uuid_utils.compat = compat
    sys.modules["uuid_utils.compat"] = compat
    compat.uuid7 = _uuid.uuid4
    uuid_utils.uuid7 = _uuid.uuid4

from dotenv import load_dotenv
load_dotenv()

from utils import (
    get_vector_store,
    get_text_chunks,
    DocumentProcessor,
    LAW_CATEGORIES,
    Config
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter

config = Config()

# ============================================
# DATASET PATHS — Update these to your actual paths
# ============================================
DATASET_PATHS = [
    r"D:\FYP\Dataset\Family Law",
    r"D:\FYP\Dataset\Criminal Law",
    r"D:\FYP\Dataset\Labour Laws",
    r"D:\FYP\Dataset\Land & Property Laws",
    r"D:\FYP\Dataset\Islamic Religious Laws",
    r"D:\FYP\Dataset\Excise Taxation Laws",
    r"D:\FYP\Dataset\Health & Medical Laws",
]

# If your folders are named differently, add mappings here:
# Format: "actual_folder_name_lowercase" -> "LAW_CATEGORIES key"
FOLDER_TO_CATEGORY = {
    "family law": "Family Law",
    "family": "Family Law",
    "familylaw": "Family Law",
    "criminal law": "Criminal Law",
    "criminal": "Criminal Law",
    "criminallaw": "Criminal Law",
    "labour laws": "Labour Laws",
    "labour": "Labour Laws",
    "labor": "Labour Laws",
    "labor laws": "Labour Laws",
    "labourlaws": "Labour Laws",
    "land & property laws": "Land & Property Laws",
    "land and property laws": "Land & Property Laws",
    "land & property": "Land & Property Laws",
    "land property": "Land & Property Laws",
    "property": "Land & Property Laws",
    "property laws": "Land & Property Laws",
    "islamic religious laws": "Islamic Religious Laws",
    "islamic": "Islamic Religious Laws",
    "islamic laws": "Islamic Religious Laws",
    "religious laws": "Islamic Religious Laws",
    "excise taxation laws": "Excise Taxation Laws",
    "taxation": "Excise Taxation Laws",
    "tax": "Excise Taxation Laws",
    "taxation laws": "Excise Taxation Laws",
    "excise": "Excise Taxation Laws",
    "health & medical laws": "Health & Medical Laws",
    "health and medical laws": "Health & Medical Laws",
    "health": "Health & Medical Laws",
    "medical": "Health & Medical Laws",
    "medical laws": "Health & Medical Laws",
    "health laws": "Health & Medical Laws",
}

# Category keywords to inject into chunks for better semantic matching
CATEGORY_KEYWORDS = {
    "Family Law": "family law marriage divorce khula custody meher maintenance nikah children spouse husband wife haq mehr dissolution dower guardian family court",
    "Criminal Law": "criminal law FIR police bail murder theft robbery assault fraud arrest accused crime penal code PPC CrPC investigation complaint challan",
    "Labour Laws": "labour law employment termination salary wages worker employer company dismissal industrial relations standing orders payment workplace harassment",
    "Land & Property Laws": "land property law plot house ownership transfer mutation registry deed inheritance succession revenue patwari tehsildar fraud forgery encroachment",
    "Islamic Religious Laws": "islamic law hudood zina blasphemy waqf auqaf shariat zakat religious federal shariat court qazf ordinance shariah",
    "Excise Taxation Laws": "tax law income tax FBR sales tax customs excise duty NTN STRN assessment refund recovery appeal tribunal taxation revenue",
    "Health & Medical Laws": "health medical law hospital doctor negligence malpractice treatment patient PMDC drug pharmaceutical emergency surgery clinic medicine nursing",
}


def detect_category_from_path(file_path):
    """Improved category detection from file path"""
    path_lower = file_path.lower().replace("\\", "/")
    
    # Extract all folder names from path
    parts = path_lower.split("/")
    
    # Try matching each folder name against our mapping
    for part in parts:
        part_clean = part.strip()
        if part_clean in FOLDER_TO_CATEGORY:
            return FOLDER_TO_CATEGORY[part_clean]
    
    # Try partial matching
    for folder_key, cat_name in FOLDER_TO_CATEGORY.items():
        for part in parts:
            if folder_key in part.strip():
                return cat_name
    
    # Try content-based keywords in path
    for cat_name, keywords in CATEGORY_KEYWORDS.items():
        kw_list = keywords.lower().split()
        matches = sum(1 for kw in kw_list if kw in path_lower)
        if matches >= 2:
            return cat_name
    
    return "general"


def detect_doc_type(file_path):
    """Detect if document is a past case or a law/act"""
    path_lower = file_path.lower()
    case_indicators = ["past case", "cases", "case law", "judgment", "verdict", "ruling", "plc", "pld", "scmr", "clc"]
    for indicator in case_indicators:
        if indicator in path_lower:
            return "case"
    return "law"


# ============================================
# STEP 1: DIAGNOSE CURRENT INDEX
# ============================================
def diagnose_current_index():
    print("\n" + "=" * 60)
    print("🔍 STEP 1: DIAGNOSING CURRENT FAISS INDEX")
    print("=" * 60)
    
    if not os.path.exists(config.INDEX_PATH):
        print("❌ No FAISS index found at:", config.INDEX_PATH)
        return None
    
    vs = get_vector_store()
    if not vs:
        return None
    
    # Get all documents from FAISS
    # FAISS stores docs in docstore
    docstore = vs.docstore
    index_to_docstore = vs.index_to_docstore_id
    
    total_docs = len(index_to_docstore)
    print(f"\n📊 Total chunks in index: {total_docs}")
    
    # Sample categories
    categories = Counter()
    doc_types = Counter()
    sources = Counter()
    sample_metadata = []
    
    for i, (idx, doc_id) in enumerate(index_to_docstore.items()):
        doc = docstore.search(doc_id)
        if doc:
            cat = doc.metadata.get("category", "MISSING")
            dtype = doc.metadata.get("doc_type", "MISSING")
            source = doc.metadata.get("source", "UNKNOWN")
            categories[cat] += 1
            doc_types[dtype] += 1
            
            # Get folder name from source
            if source != "UNKNOWN":
                parts = source.replace("\\", "/").split("/")
                for part in parts:
                    if part.strip() and part.strip() not in ["D:", "FYP", "Dataset", "old_fiels"]:
                        sources[part] += 1
            
            if i < 5:
                sample_metadata.append({
                    "category": cat,
                    "doc_type": dtype,
                    "source": os.path.basename(source) if source else "?",
                    "content_preview": doc.page_content[:100]
                })
    
    print(f"\n📋 Categories found in index:")
    for cat, count in categories.most_common():
        pct = count / total_docs * 100
        status = "✅" if cat in LAW_CATEGORIES else "⚠️ NOT MATCHING" if cat != "general" else "❌ UNTAGGED"
        print(f"  {status} '{cat}': {count} chunks ({pct:.1f}%)")
    
    print(f"\n📋 Document types:")
    for dtype, count in doc_types.most_common():
        print(f"  📄 '{dtype}': {count} chunks")
    
    print(f"\n📋 Source folders (top 15):")
    for folder, count in sources.most_common(15):
        print(f"  📁 '{folder}': {count}")
    
    print(f"\n📋 Sample metadata (first 5 docs):")
    for i, meta in enumerate(sample_metadata):
        print(f"  [{i+1}] cat='{meta['category']}' | type='{meta['doc_type']}' | file='{meta['source']}'")
        print(f"       content: '{meta['content_preview']}...'")
    
    # Check what's wrong
    untagged = categories.get("general", 0)
    if untagged > total_docs * 0.5:
        print(f"\n⚠️  PROBLEM: {untagged}/{total_docs} chunks ({untagged/total_docs:.0%}) are tagged as 'general'!")
        print("   This means category detection from folder paths isn't working.")
        print("   Fix: Rebuild the index with proper folder-to-category mapping.")
    
    return vs


# ============================================
# STEP 2: SCAN DATASET FOLDERS
# ============================================
def scan_dataset():
    print("\n" + "=" * 60)
    print("📂 STEP 2: SCANNING DATASET FOLDERS")
    print("=" * 60)
    
    found_paths = []
    
    # Check configured paths
    for path in DATASET_PATHS:
        if os.path.exists(path):
            files = []
            for root, _, filenames in os.walk(path):
                for f in filenames:
                    if f.lower().endswith((".pdf", ".txt")):
                        files.append(os.path.join(root, f))
            print(f"  ✅ {path}: {len(files)} files")
            found_paths.append(path)
        else:
            print(f"  ❌ {path}: NOT FOUND")
    
    if not found_paths:
        # Try to auto-detect
        print("\n  🔍 Auto-detecting dataset location...")
        possible_roots = [
            r"D:\FYP\Dataset",
            r"D:\FYP\old_fiels\Dataset",
            r"D:\FYP\dataset",
            r".\Dataset",
            r"..\Dataset",
        ]
        for root in possible_roots:
            if os.path.exists(root):
                print(f"  📁 Found dataset root: {root}")
                for item in os.listdir(root):
                    full = os.path.join(root, item)
                    if os.path.isdir(full):
                        files = []
                        for r, _, fnames in os.walk(full):
                            for f in fnames:
                                if f.lower().endswith((".pdf", ".txt")):
                                    files.append(os.path.join(r, f))
                        if files:
                            print(f"    📁 '{item}': {len(files)} files → Category: {detect_category_from_path(full)}")
                            found_paths.append(full)
                break
    
    if not found_paths:
        print("\n  ❌ No dataset folders found!")
        print("  Please update DATASET_PATHS in this script to point to your dataset folders.")
        print("  Your folders should look like:")
        print("    D:\\FYP\\Dataset\\Family Law\\")
        print("    D:\\FYP\\Dataset\\Criminal Law\\")
        print("    etc.")
    
    return found_paths


# ============================================
# STEP 3: REBUILD INDEX WITH PROPER METADATA
# ============================================
def rebuild_index(dataset_paths):
    print("\n" + "=" * 60)
    print("🔨 STEP 3: REBUILDING FAISS INDEX")
    print("=" * 60)
    
    all_documents = []
    file_count = 0
    category_counter = Counter()
    
    for folder_path in dataset_paths:
        if not os.path.exists(folder_path):
            continue
        
        for root, _, files in os.walk(folder_path):
            for filename in files:
                if not filename.lower().endswith((".pdf", ".txt")):
                    continue
                
                file_path = os.path.join(root, filename)
                
                # Improved category detection
                category = detect_category_from_path(file_path)
                doc_type = detect_doc_type(file_path)
                
                try:
                    docs = []
                    if filename.lower().endswith(".pdf"):
                        with open(file_path, "rb") as f:
                            pdf_reader = PdfReader(f)
                            for i, page in enumerate(pdf_reader.pages):
                                text = page.extract_text()
                                if text and text.strip():
                                    docs.append(Document(
                                        page_content=text.strip(),
                                        metadata={
                                            "source": file_path,
                                            "file_name": filename,
                                            "page": i + 1,
                                            "category": category,
                                            "doc_type": doc_type
                                        }
                                    ))
                    elif filename.lower().endswith(".txt"):
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            text = f.read()
                            if text.strip():
                                docs.append(Document(
                                    page_content=text.strip(),
                                    metadata={
                                        "source": file_path,
                                        "file_name": filename,
                                        "page": 1,
                                        "category": category,
                                        "doc_type": doc_type
                                    }
                                ))
                    
                    all_documents.extend(docs)
                    file_count += 1
                    category_counter[category] += len(docs)
                    
                except Exception as e:
                    print(f"  ⚠️ Error reading {filename}: {e}")
    
    print(f"\n📊 Files processed: {file_count}")
    print(f"📊 Total document pages: {len(all_documents)}")
    print(f"\n📋 Category distribution (before chunking):")
    for cat, count in category_counter.most_common():
        print(f"  {'✅' if cat in LAW_CATEGORIES else '❌'} {cat}: {count} pages")
    
    if not all_documents:
        print("\n❌ No documents found! Check your DATASET_PATHS.")
        return None
    
    # ============================================
    # KEY FIX: Inject category keywords into chunk text
    # This ensures FAISS retrieves the right category
    # ============================================
    print(f"\n🔧 Injecting category keywords into documents...")
    enhanced_documents = []
    for doc in all_documents:
        category = doc.metadata.get("category", "general")
        if category in CATEGORY_KEYWORDS:
            # Prepend category context to the content
            # This helps the embedding model associate the content with the right category
            category_prefix = f"[Category: {category}] [Keywords: {CATEGORY_KEYWORDS[category]}]\n\n"
            enhanced_doc = Document(
                page_content=category_prefix + doc.page_content,
                metadata=doc.metadata
            )
            enhanced_documents.append(enhanced_doc)
        else:
            enhanced_documents.append(doc)
    
    print(f"  ✅ Enhanced {len(enhanced_documents)} documents with category context")
    
    # Chunk documents
    print(f"\n📐 Chunking documents (size={config.CHUNK_SIZE}, overlap={config.CHUNK_OVERLAP})...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP
    )
    chunks = text_splitter.split_documents(enhanced_documents)
    print(f"  ✅ Created {len(chunks)} chunks")
    
    # Check chunk category distribution
    chunk_categories = Counter()
    for chunk in chunks:
        chunk_categories[chunk.metadata.get("category", "general")] += 1
    
    print(f"\n📋 Category distribution (after chunking):")
    for cat, count in chunk_categories.most_common():
        pct = count / len(chunks) * 100
        print(f"  {'✅' if cat in LAW_CATEGORIES else '❌'} {cat}: {count} chunks ({pct:.1f}%)")
    
    # Backup old index
    if os.path.exists(config.INDEX_PATH):
        backup_path = config.INDEX_PATH + "_backup"
        if os.path.exists(backup_path):
            shutil.rmtree(backup_path)
        shutil.copytree(config.INDEX_PATH, backup_path)
        print(f"\n💾 Old index backed up to: {backup_path}")
    
    # Build new FAISS index
    print(f"\n🏗️ Building new FAISS index with {config.EMBEDDING_MODEL}...")
    embeddings = HuggingFaceEmbeddings(
        model_name=config.EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"}
    )
    
    vectorstore = FAISS.from_documents(chunks, embeddings)
    
    # Save
    if os.path.exists(config.INDEX_PATH):
        shutil.rmtree(config.INDEX_PATH)
    vectorstore.save_local(config.INDEX_PATH)
    print(f"  ✅ New index saved to: {config.INDEX_PATH}")
    
    return vectorstore


# ============================================
# STEP 4: VERIFY NEW INDEX
# ============================================
def verify_index(vectorstore):
    print("\n" + "=" * 60)
    print("✅ STEP 4: VERIFYING NEW INDEX")
    print("=" * 60)
    
    from utils import SmartCategoryRetriever
    
    test_queries = [
        ("I want to file for divorce", "Family Law"),
        ("Someone snatched my phone, I want to register FIR", "Criminal Law"),
        ("My company fired me without notice", "Labour Laws"),
        ("Someone forged my property documents", "Land & Property Laws"),
        ("Hospital refused emergency treatment", "Health & Medical Laws"),
        ("FBR sent me income tax notice", "Excise Taxation Laws"),
        ("False blasphemy accusation against me", "Islamic Religious Laws"),
    ]
    
    # Test with SmartCategoryRetriever
    smart_retriever = SmartCategoryRetriever(vector_store=vectorstore, k=5)
    
    correct = 0
    total = len(test_queries)
    
    print("\n  📊 Testing with SmartCategoryRetriever:")
    for query, expected_cat in test_queries:
        docs = smart_retriever.invoke(query)
        categories = [doc.metadata.get("category", "Unknown") for doc in docs]
        top_category = Counter(categories).most_common(1)
        detected = top_category[0][0] if top_category else "Unknown"
        match_count = sum(1 for c in categories if c == expected_cat)
        
        is_correct = match_count >= 2  # At least 2 out of 5 docs from correct category
        if is_correct:
            correct += 1
        
        status = "✅" if is_correct else "❌"
        print(f"  {status} '{query[:45]}...'")
        print(f"     Expected: {expected_cat} | Got: {match_count}/5 correct | Top: {detected}")
        print(f"     Categories: {categories}")
    
    accuracy = correct / total * 100
    print(f"\n📊 Retrieval Accuracy: {correct}/{total} ({accuracy:.0f}%)")
    
    if accuracy >= 70:
        print("🎉 Retrieval is working well! Now re-run evaluate_chatbot.py")
    elif accuracy >= 40:
        print("⚠️ Partial improvement. Check if dataset folders are correctly structured.")
    else:
        print("❌ Still poor. Your dataset might not have proper folder structure.")
        print("   Make sure each law category has its own folder with relevant PDFs.")


# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🔧 QanoonAI RETRIEVAL FIX TOOL")
    print("=" * 60)
    
    # Step 1: Diagnose
    diagnose_current_index()
    
    # Step 2: Scan dataset
    dataset_paths = scan_dataset()
    
    if not dataset_paths:
        print("\n❌ Cannot proceed without dataset paths.")
        print("   Update DATASET_PATHS in this script and re-run.")
        sys.exit(1)
    
    # Ask user to confirm
    print(f"\n{'=' * 60}")
    print(f"⚠️  Ready to rebuild FAISS index from {len(dataset_paths)} folders.")
    print(f"   Old index will be backed up to: {config.INDEX_PATH}_backup")
    response = input("   Proceed? (y/n): ").strip().lower()
    
    if response != "y":
        print("   Cancelled.")
        sys.exit(0)
    
    # Step 3: Rebuild
    new_vs = rebuild_index(dataset_paths)
    
    if new_vs:
        # Step 4: Verify
        verify_index(new_vs)
        
        print(f"\n{'=' * 60}")
        print("✅ DONE! Now re-run evaluation:")
        print("   python evaluate_chatbot.py")
        print(f"{'=' * 60}\n")