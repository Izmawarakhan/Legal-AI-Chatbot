"""
upload_cases.py - Past Cases ko MongoDB mein upload karo
Yeh script dataset folder se .txt files padhega aur past_cases collection mein save karega
"""

import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

# .env file se MongoDB credentials lo
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "qanoonai_db")

# Dataset ka path - YAHI TUMHARA DATASET HAI
DATASET_PATH = r"C:\Users\Dil11\OneDrive\Desktop\FYP\FYP\DATASET"

# Past cases ke folders aur unki categories
PAST_CASES_FOLDERS = {
    os.path.join("Criminal law", "Criminal law past cases"): "Criminal Law",
    os.path.join("Excise Taxation Laws", "Tax_past_case"): "Tax Law",
    os.path.join("Family Law", "Family Law Past Cases"): "Family Law",
}


def extract_case_info(content, filename, category):
    """
    .txt file ka content parse karke case info extract karo
    """
    lines = content.strip().split("\n")
    lines = [l.strip() for l in lines if l.strip()]

    # Default values
    title = filename.replace(".txt", "")
    court = "Supreme Court of Pakistan"
    citation = ""
    judge = ""
    year = 0
    summary = ""

    # Title extract karo - parties (X vs Y)
    full_text = " ".join(lines)
    
    # Try to find "Versus" pattern for parties
    versus_pattern = re.search(r'(.{5,80}?)\s*(?:Versus|vs\.?|v\.)\s*(.{5,80}?)(?:\s*(?:For|Date|ORDER|JUDGMENT))', full_text, re.IGNORECASE)
    if versus_pattern:
        petitioner = versus_pattern.group(1).strip()
        respondent = versus_pattern.group(2).strip()
        # Clean up
        petitioner = re.sub(r'[\.\…]+$', '', petitioner).strip()
        respondent = re.sub(r'[\.\…]+$', '', respondent).strip()
        if len(petitioner) > 3 and len(respondent) > 3:
            title = f"{petitioner} v. {respondent}"

    # Case number / citation extract karo
    case_patterns = [
        r'(Criminal\s+(?:Petition|Appeal|Case)\s+No\.?\s*[\d\w\-/]+\s*(?:of|/)\s*\d{4})',
        r'(Civil\s+(?:Petition|Appeal|Case)\s+No\.?\s*[\d\w\-/]+\s*(?:of|/)\s*\d{4})',
        r'(C\.?A\.?\s*(?:No\.?)?\s*[\d]+\s*(?:of|/)\s*\d{4})',
        r'((?:PLD|SCMR|PCrLJ|CLD|MLD|YLR)\s*\d{4}\s*\w+\s*\d+)',
        r'((?:Petition|Appeal)\s+No\.?\s*[\d\w\-/]+\s*(?:of|/)\s*\d{4})',
    ]
    for pattern in case_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            citation = match.group(1).strip()
            break
    
    if not citation:
        # Filename se citation banao
        citation = f"C.A. Supreme Court - {filename.replace('.txt', '')}"

    # Year extract karo
    year_match = re.search(r'(?:of|/)\s*((?:19|20)\d{2})', citation)
    if year_match:
        year = int(year_match.group(1))
    else:
        # Content se year dhundo
        year_match = re.search(r'((?:19|20)\d{2})', full_text[:500])
        if year_match:
            year = int(year_match.group(1))

    # Judge extract karo
    judge_patterns = [
        r'(?:Mr\.|Mrs\.|Ms\.)\s*Justice\s+([A-Za-z\s\.]+?)(?:\s*[-,]|\s*$)',
        r'Justice\s+([A-Za-z\s\.]+?)(?:\s*[-,\.]|\s*$)',
    ]
    for pattern in judge_patterns:
        match = re.search(pattern, full_text[:1000])
        if match:
            judge = match.group(1).strip()
            # Clean judge name
            judge = re.sub(r'\s+', ' ', judge).strip()
            if len(judge) > 50:
                judge = judge[:50]
            break

    # Court extract karo
    if "SUPREME COURT" in full_text.upper():
        court = "Supreme Court of Pakistan"
    elif "HIGH COURT" in full_text.upper():
        hc_match = re.search(r'((?:\w+\s+)?High\s+Court(?:\s+\w+)?)', full_text, re.IGNORECASE)
        if hc_match:
            court = hc_match.group(1).strip()

    # Summary extract karo - ORDER/JUDGMENT ke baad pehle 500 characters
    order_match = re.search(r'(?:ORDER|JUDGMENT|OPINION)\s*\n', full_text, re.IGNORECASE)
    if order_match:
        after_order = full_text[order_match.end():].strip()
        summary = after_order[:500].strip()
    else:
        # Pehle 500 characters as summary
        summary = full_text[:500].strip()
    
    # Summary clean karo
    summary = re.sub(r'\s+', ' ', summary).strip()
    if len(summary) > 500:
        summary = summary[:497] + "..."

    return {
        "title": title[:200],  # Max 200 chars
        "citation": citation[:100],
        "category": category,
        "summary": summary,
        "court": court,
        "year": year,
        "judge": judge[:100],
        "full_judgment": full_text[:5000],  # First 5000 chars of full text
        "filename": filename,
        "created_at": datetime.utcnow()
    }


def upload_cases():
    """
    Saare past cases MongoDB mein upload karo
    """
    print("\n" + "="*60)
    print("  QanoonAI - Past Cases Uploader")
    print("="*60)
    
    # MongoDB connect
    print("\n1. Connecting to MongoDB...")
    try:
        client = MongoClient(MONGODB_URI)
        db = client[MONGODB_DB_NAME]
        client.admin.command("ping")
        print("   ✅ MongoDB connected!")
    except Exception as e:
        print(f"   ❌ MongoDB connection failed: {e}")
        return

    # Collection
    collection = db.past_cases
    
    # Check existing count
    existing = collection.count_documents({})
    print(f"\n2. Existing cases in database: {existing}")
    
    if existing > 0:
        choice = input("\n   ⚠️  Database mein already cases hain. Kya delete karein? (y/n): ").strip().lower()
        if choice == 'y':
            collection.delete_many({})
            print("   🗑️  Purane cases delete ho gaye!")

    # Dataset path check
    print(f"\n3. Dataset path: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        print(f"   ❌ Dataset folder nahi mila: {DATASET_PATH}")
        print("   Path check karo aur script mein update karo!")
        return
    print("   ✅ Dataset folder found!")

    # Process each category
    total_uploaded = 0
    total_errors = 0
    
    print("\n4. Processing cases...\n")
    
    for folder_path, category in PAST_CASES_FOLDERS.items():
        full_folder = os.path.join(DATASET_PATH, folder_path)
        
        if not os.path.exists(full_folder):
            print(f"   ⚠️  Folder nahi mila: {folder_path}")
            continue
        
        # Sirf .txt files lo
        txt_files = [f for f in os.listdir(full_folder) if f.endswith('.txt')]
        print(f"   📂 {category}: {len(txt_files)} .txt files found")
        
        category_count = 0
        category_errors = 0
        
        for filename in txt_files:
            filepath = os.path.join(full_folder, filename)
            try:
                # File read karo
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                if len(content.strip()) < 50:
                    continue  # Skip empty/very short files
                
                # Case info extract karo
                case_data = extract_case_info(content, filename, category)
                
                # MongoDB mein insert karo
                collection.insert_one(case_data)
                category_count += 1
                
            except Exception as e:
                category_errors += 1
                # Silently skip errors
        
        print(f"      ✅ Uploaded: {category_count} | ❌ Errors: {category_errors}")
        total_uploaded += category_count
        total_errors += category_errors

    # Summary
    print("\n" + "="*60)
    print(f"  UPLOAD COMPLETE!")
    print(f"  Total uploaded: {total_uploaded} cases")
    print(f"  Total errors: {total_errors}")
    print(f"  Categories: {len(PAST_CASES_FOLDERS)}")
    print("="*60)
    
    # Verify
    final_count = collection.count_documents({})
    print(f"\n  📊 Total cases in database now: {final_count}")
    
    # Show sample
    print("\n  📋 Sample cases:")
    for case in collection.find().limit(3):
        print(f"     - [{case.get('category')}] {case.get('title')[:60]}...")
    
    print("\n  Done! Ab Lawyer Dashboard mein Past Cases dikhein gi! 🎉\n")


if __name__ == "__main__":
    upload_cases()
