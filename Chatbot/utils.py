# ============================================
# CRITICAL: UUID DLL FIX (Must be at the very top)
# ============================================
import sys
import types
import uuid as _uuid

if "uuid_utils" not in sys.modules:
    uuid_utils = types.ModuleType("uuid_utils")
    sys.modules["uuid_utils"] = uuid_utils
    compat = types.ModuleType("compat")
    uuid_utils.compat = compat
    sys.modules["uuid_utils.compat"] = compat
    
    def uuid7():
        return _uuid.uuid4()
    
    compat.uuid7 = uuid7
    uuid_utils.uuid7 = uuid7
    print("✓ UUID compatibility layer loaded")

# ============================================
# IMPORTS
# ============================================
import os
from typing import List, Tuple, Optional, Union
from dataclasses import dataclass

from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document 
from langchain.chains import ConversationalRetrievalChain
from langchain_groq import ChatGroq 
from langchain.prompts import PromptTemplate

# ============================================
# CONFIGURATION
# ============================================
@dataclass
class Config:
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    RETRIEVER_K: int = 5
    INDEX_PATH: str = "faiss_index_legal"
    TEMPERATURE: float = 0.1

config = Config()

# ============================================
# LAW CATEGORIES & CONSULTATION FLOW
# ============================================
LAW_CATEGORIES = {
    "Family Law": {
        "description": "Marriage, Divorce, Khula, Custody, Meher, Maintenance, Inheritance",
        "sub_types": ["Divorce / Khula", "Financial Relief (Dower / Maintenance)", "Child Custody"],
        "basic_questions": [
            "Could you please tell me your full name?",
            "What is your date of birth?",
            "When did your marriage take place? (Date of Marriage)",
            "What is your spouse's full name?",
            "What is your spouse's date of birth? (If known)",
            "How many children do you have? Please provide their names and dates of birth.",
            "Who are the children currently living with?",
            "Which school do the children attend?",
            "Do you live in a joint family system or separately?",
            "In whose name is the house or property registered?",
            "Who else lives in the household with you?",
            "When did this issue begin?",
            "What is your CNIC number?",
        ],
        "sub_questions": {
            "Divorce / Khula": [
                "Are you seeking a divorce or khula (wife-initiated dissolution)?",
                "Has any divorce notice been sent previously?",
                "Do you have the Nikah Nama (marriage certificate)? What conditions are mentioned in it?",
                "What was the agreed dower (Haq Mehr) amount? Has it been paid?",
                "How many times have you experienced physical or verbal abuse? Please describe in detail.",
                "Have you previously attempted family mediation or reconciliation?",
                "Do you have any police reports or medico-legal certificates?",
                "Who are your witnesses that can appear in court?",
            ],
            "Financial Relief (Dower / Maintenance)": [
                "What is your spouse's monthly income? Where do they work?",
                "What dower (Haq Mehr) amount is written in the Nikah Nama?",
                "How much of the dower has been paid and how much remains outstanding?",
                "What are your current monthly expenses? (Rent, food, children's school fees, etc.)",
                "Has your spouse stopped providing maintenance? Since when?",
                "Do you have any independent source of income?",
                "What items were given as dowry? Please prepare a list.",
            ],
            "Child Custody": [
                "What is the current age of the child or children?",
                "Who currently has the child and since when?",
                "Does the other party visit the children or not?",
                "How is the child's schooling, health, and daily routine?",
                "Has the child experienced any abuse or neglect?",
                "Who does the child prefer to live with? (If age 7 or above)",
                "What is the financial capability and moral character of the other party?",
            ],
        }
    },
    "Criminal Law": {
        "description": "FIR, Bail, Murder, Theft, Fraud, PPC Sections, Anti-Terrorism",
        "sub_types": ["FIR / Complaint Registration", "Bail Application", "Murder / Assault / Violence"],
        "basic_questions": [
            "Please tell me your full name.",
            "What is your date of birth and CNIC number?",
            "Are you the complainant or the accused?",
            "What happened? Please describe the entire incident in your own words.",
            "When did the incident occur? (Date and time)",
            "Where did it happen? (Exact location, city, and district)",
            "Has an FIR been registered? If yes, please provide the FIR number and police station name.",
            "Who is the accused? Please provide their name and relationship to you.",
            "Were there any witnesses present at the time of the incident?",
            "Do you have any evidence? (Photos, videos, medical reports, documents)",
        ],
        "sub_questions": {
            "FIR / Complaint Registration": [
                "Have you previously reported this to the police? What was their response?",
                "If the police refused to register the FIR, what reason did they give?",
                "Have you filed a complaint with any other authority? (District Magistrate, etc.)",
                "How many people were involved in the incident?",
            ],
            "Bail Application": [
                "Which jail is the accused in and since when?",
                "What section or charge has been applied against the accused?",
                "Has bail been applied for previously? What was the result?",
                "Does the accused have any prior criminal record?",
                "Has the investigation been completed or is it still ongoing?",
                "Who will provide surety for the accused?",
            ],
            "Murder / Assault / Violence": [
                "Who is the victim and what is their current condition?",
                "What weapon was used? (Firearm, knife, blunt object, etc.)",
                "Is there a medical report or post-mortem report available?",
                "Was there any pre-existing enmity or dispute between the parties?",
                "Is the victim's family willing to settle through compromise or blood money (Diyat)?",
            ],
        }
    },
    "Labour Laws": {
        "description": "Employment, Wages, Termination, Workers Rights, Workplace Harassment",
        "sub_types": ["Wrongful Termination / Dismissal", "Unpaid Wages / Benefits", "Workplace Harassment / Safety"],
        "basic_questions": [
            "Please tell me your full name.",
            "What is your date of birth and CNIC number?",
            "Are you an employee or an employer?",
            "What is the name of the company or organization?",
            "What was your designation or position?",
            "When did you join and when was your last working day? (Joining date and end date)",
            "What was your monthly salary? (Basic pay plus allowances)",
            "Do you have an appointment letter or employment contract?",
            "What is the issue you are facing? Please describe in detail.",
        ],
        "sub_questions": {
            "Wrongful Termination / Dismissal": [
                "How were you terminated? (Verbally, by written notice, or suddenly without notice?)",
                "Did you receive a termination letter? What reason was stated?",
                "Were you issued a show cause notice beforehand?",
                "Was a disciplinary inquiry committee formed?",
                "Did you receive gratuity, pending salary, or other benefits?",
                "Do you want reinstatement to your position or financial compensation?",
            ],
            "Unpaid Wages / Benefits": [
                "For how many months has your salary been unpaid?",
                "Is overtime pay also outstanding?",
                "Was EOBI or Social Security being deducted from your salary?",
                "Do you have salary slips or bank statements as proof?",
                "Have you submitted a written complaint to the company?",
            ],
            "Workplace Harassment / Safety": [
                "What type of harassment occurred? (Sexual, verbal, bullying)",
                "How many times has this happened? Since when has it been going on?",
                "Have you filed a complaint with the company's harassment committee?",
                "Do you have any evidence? (Messages, emails, recordings, witnesses)",
                "Were there proper safety measures at the workplace? (Fire exits, first aid, etc.)",
            ],
        }
    },
    "Land & Property Laws": {
        "description": "Property Disputes, Land Transfer, Fraud, Inheritance Property",
        "sub_types": ["Property Dispute / Ownership Conflict", "Property Fraud / Forgery", "Inheritance Property"],
        "basic_questions": [
            "Please tell me your full name.",
            "What is your CNIC number and date of birth?",
            "What is the complete address of the property? (Include tehsil and district)",
            "What type of property is it? (Residential plot, house, agricultural land, commercial)",
            "What is the size of the property? (In marla, kanal, or acre)",
            "In whose name is the property currently registered?",
            "How did you acquire the property? (Purchase, inheritance, gift, government allotment)",
            "What documents do you have? (Sale deed, registry, fard, mutation record)",
        ],
        "sub_questions": {
            "Property Dispute / Ownership Conflict": [
                "Who is the dispute with? (Family member, neighbor, stranger, or government)",
                "What is the other party claiming?",
                "How long has this dispute been going on?",
                "Is your name recorded in the revenue record (fard)?",
                "Is there any existing court case regarding this property?",
                "What is the stance of the Patwari or Tehsildar?",
            ],
            "Property Fraud / Forgery": [
                "What exactly happened? Has someone transferred the property using forged documents?",
                "When did you discover the fraud?",
                "Have you filed an FIR for the fraud?",
                "Do you still have the original documents in your possession?",
                "What is the name and details of the person who committed the fraud?",
            ],
            "Inheritance Property": [
                "What is the name of the deceased and their date of death?",
                "How many legal heirs are there? Please provide their names and relationship.",
                "Has a succession certificate been obtained?",
                "Has the property been transferred (mutation) to the heirs' names?",
                "Has any heir taken more than their rightful share or illegally occupied the property?",
                "Did the deceased leave a will?",
            ],
        }
    },
    "Islamic Religious Laws": {
        "description": "Hudood, Zakat, Waqf, Blasphemy, Federal Shariat Court",
        "sub_types": ["Hudood / Zina / Qazf Cases", "Waqf / Auqaf Property", "Blasphemy Cases (295-B, 295-C)"],
        "basic_questions": [
            "Please tell me your full name.",
            "What is your CNIC number and date of birth?",
            "What is your religious sect or school of thought? (Sunni, Shia, Deobandi, Barelvi, etc.)",
            "What is the nature of your issue? (Zakat, Waqf, Hudood, Blasphemy, etc.)",
            "Is this matter in the Federal Shariat Court or a regular court?",
        ],
        "sub_questions": {
            "Hudood / Zina / Qazf Cases": [
                "Which section of the Hudood Ordinance 1979 has been applied in the FIR?",
                "Are you the complainant or the accused?",
                "How many witnesses are available? (Hudood requires 4 witnesses)",
                "Is there medical evidence available?",
                "Was there a valid marriage (nikah) between the parties?",
                "Could this case be converted into a Qazf (false accusation) complaint?",
            ],
            "Waqf / Auqaf Property": [
                "What is the address and description of the Waqf property?",
                "Is there a Waqf deed? When was it created?",
                "Has anyone illegally encroached upon the Waqf property?",
                "Have you contacted the Auqaf Department?",
                "Who is the current Mutawalli (caretaker or trustee)?",
            ],
            "Blasphemy Cases (295-B, 295-C)": [
                "What exactly was said or written that is being considered blasphemy?",
                "When and where did this occur?",
                "How many witnesses are there?",
                "Has an FIR been registered? Under which section?",
                "Where is the accused currently? (In jail, on bail, or in hiding)",
                "Was there any pre-existing enmity between the complainant and the accused?",
            ],
        }
    },
    "Excise Taxation Laws": {
        "description": "Income Tax, Sales Tax, Customs, FBR Disputes, Tax Appeals",
        "sub_types": ["Income Tax Dispute / Assessment", "Sales Tax / Customs Issues", "Tax Refund / Recovery"],
        "basic_questions": [
            "Please provide your full name or your company or business name.",
            "What is your NTN (National Tax Number) or STRN?",
            "What is your CNIC number?",
            "Are you filing as an individual or as a business or company?",
            "What type of business do you have? (Sole proprietor, partnership, Private Limited)",
            "What is your approximate annual turnover or income?",
            "Which tax is this issue related to? (Income Tax, Sales Tax, Customs, Excise Duty)",
        ],
        "sub_questions": {
            "Income Tax Dispute / Assessment": [
                "What notice has the FBR issued? (Please mention the section number)",
                "Was the tax return filed? For which tax year?",
                "What is the FBR's assessed amount versus your declared amount?",
                "Have you filed an appeal before the Commissioner (Appeals)?",
                "Has any penalty or additional tax been imposed?",
                "Who is your tax advisor or accountant?",
            ],
            "Sales Tax / Customs Issues": [
                "Do you import or export goods?",
                "What objection has Customs raised?",
                "What is the HS Code of the goods in question?",
                "Are you registered for Sales Tax? Do you file monthly returns?",
                "Did you claim input tax credit? Has FBR disallowed it?",
            ],
            "Tax Refund / Recovery": [
                "How much refund was claimed and when was the application filed?",
                "Why did the FBR reject the refund claim?",
                "What is the application status on the IRIS portal?",
                "Has the FBR issued a recovery notice?",
                "Has your bank account been frozen or property been attached?",
            ],
        }
    },
    "Health & Medical Laws": {
        "description": "Medical Negligence, Hospital Disputes, Drug Cases, Patient Rights",
        "sub_types": ["Medical Negligence / Malpractice", "Hospital Billing / Insurance Disputes", "Drug / Pharmaceutical Cases"],
        "basic_questions": [
            "Please tell me your full name.",
            "What is your CNIC number and date of birth?",
            "Who is the patient? (Yourself or someone else?)",
            "What is the patient's current medical condition?",
            "What is the name of the hospital or clinic where the treatment was provided?",
            "What is the name of the treating doctor?",
            "When was the treatment provided? (Date)",
            "What happened exactly? Please describe the entire incident.",
        ],
        "sub_questions": {
            "Medical Negligence / Malpractice": [
                "What did the doctor do wrong? (Misdiagnosis, wrong surgery, wrong medication?)",
                "What was the patient's condition before the treatment?",
                "What happened after the treatment? (Injury, disability, death?)",
                "Was an informed consent form signed before the treatment?",
                "Did you seek a second opinion from another doctor? What did they say?",
                "Do you have the medical records and reports?",
                "Have you filed a complaint with PMDC (Pakistan Medical and Dental Council)?",
            ],
            "Hospital Billing / Insurance Disputes": [
                "What is the total amount billed by the hospital?",
                "Do you have health insurance? What is the insurance company's name?",
                "Why did the insurance company reject the claim?",
                "Has the hospital detained the patient or deceased body over unpaid bills?",
                "Do you have an itemized breakdown of the hospital bill?",
            ],
            "Drug / Pharmaceutical Cases": [
                "Which medicine caused the problem?",
                "Was the medicine prescribed by a doctor or purchased over the counter?",
                "What adverse reaction occurred after taking the medicine?",
                "Was the medicine expired or suspected to be counterfeit?",
                "Where was the medicine purchased from? (Pharmacy name)",
                "Have you filed a complaint with DRAP (Drug Regulatory Authority of Pakistan)?",
            ],
        }
    },
}

# ============================================
# DOCUMENT PROCESSOR (PDF + TXT)
# ============================================
class DocumentProcessor:
    """Handles loading and extracting text from PDF and TXT files"""
    
    @staticmethod
    def load_local_files(folder_paths: Union[str, List[str]]) -> List[str]:
        file_list = []
        if isinstance(folder_paths, str):
            folder_paths = [folder_paths]
        
        print(f"\n{'='*60}\n📂 SCANNING DATASET FOLDERS\n{'='*60}")
        for folder_path in folder_paths:
            if not os.path.exists(folder_path):
                print(f"⚠️ Folder missing: {folder_path}")
                continue
            for root, _, files in os.walk(folder_path):
                for file in files:
                    if file.lower().endswith((".pdf", ".txt")):
                        file_list.append(os.path.join(root, file))
        
        print(f"✅ Total Files Found: {len(file_list)}\n")
        return file_list

    @staticmethod
    def extract_content(file_path: str) -> List[Document]:
        """Extracts text based on file extension (PDF or TXT)"""
        file_name = os.path.basename(file_path)
        
        # Detect category from path
        category = "general"
        path_lower = file_path.lower()
        for cat_name in LAW_CATEGORIES:
            if cat_name.lower().replace(" & ", " ").replace(" ", "") in path_lower.replace(" & ", " ").replace(" ", ""):
                category = cat_name
                break
        
        # Detect if it's a past case or a law/act
        doc_type = "case" if "past case" in path_lower or "cases" in path_lower else "law"
        
        documents = []
        try:
            if file_path.lower().endswith(".pdf"):
                with open(file_path, "rb") as f:
                    pdf_reader = PdfReader(f)
                    for i, page in enumerate(pdf_reader.pages):
                        text = page.extract_text()
                        if text and text.strip():
                            documents.append(Document(
                                page_content=text.strip(),
                                metadata={
                                    "source": file_path,
                                    "file_name": file_name,
                                    "page": i + 1,
                                    "category": category,
                                    "doc_type": doc_type
                                }
                            ))
            elif file_path.lower().endswith(".txt"):
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                    if text.strip():
                        documents.append(Document(
                            page_content=text.strip(),
                            metadata={
                                "source": file_path,
                                "file_name": file_name,
                                "page": 1,
                                "category": category,
                                "doc_type": doc_type
                            }
                        ))
            return documents
        except Exception as e:
            print(f"✗ Error reading {file_name}: {e}")
            return []

    @classmethod
    def get_documents_from_files(cls, file_list: List[str]) -> List[Document]:
        all_docs = []
        for f in file_list:
            all_docs.extend(cls.extract_content(f))
        return all_docs

# ============================================
# VECTOR STORE & CHUNKING
# ============================================
def get_text_chunks(documents: List[Document]) -> List[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP
    )
    return text_splitter.split_documents(documents)

def get_vector_store(chunks: Optional[List[Document]] = None) -> Optional[FAISS]:
    """Loads FAISS from disk or creates a new index if chunks provided"""
    embeddings = HuggingFaceEmbeddings(
        model_name=config.EMBEDDING_MODEL,
        model_kwargs={'device': 'cpu'}
    )
    
    if os.path.exists(config.INDEX_PATH):
        print(f"🔄 Loading existing Knowledge Base from: {config.INDEX_PATH}")
        return FAISS.load_local(
            config.INDEX_PATH, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
    
    if chunks:
        print("🏗️ Creating new Knowledge Base index...")
        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore.save_local(config.INDEX_PATH)
        print(f"✅ Saved new index to: {config.INDEX_PATH}")
        return vectorstore
    
    print("⚠️ No Knowledge Base found and no documents provided.")
    return None

# ============================================
# LLM & CONVERSATION CHAIN
# ============================================
def create_legal_prompt(user_religion: str) -> PromptTemplate:
    """Creates the main prompt for the AI Legal Consultant with consultation flow"""
    
    # Build category list for prompt
    category_list = ""
    for i, (cat_name, cat_data) in enumerate(LAW_CATEGORIES.items(), 1):
        category_list += f"   {i}. {cat_name} - {cat_data['description']}\n"
    
    template_text = f"""You are a specialized AI Legal Consultant for Pakistan Law.
You behave exactly like a real Pakistani lawyer — asking questions one by one, collecting information step by step, and then providing legal advice.

============================================
CRITICAL: LANGUAGE DETECTION & MIRRORING
============================================
You MUST detect the language the user is writing in and reply in the EXACT SAME language. This is the HIGHEST PRIORITY rule.

HOW TO DETECT THE LANGUAGE:
Look at the user's LAST message only. 

If the message contains proper English sentences like "A private hospital refused to treat", "Can legal action be taken", "Is a hospital legally allowed" → The user is writing in ENGLISH. You MUST reply in ENGLISH.

If the message contains Roman Urdu words like "hospital ne ilaaj se inkaar kiya", "kya hum case kar sakte hain", "mera shohar mujhe maarta hai" → The user is writing in ROMAN URDU. You MUST reply in ROMAN URDU.

If the message is mixed → Reply in mixed style.

SIMPLE TEST: Read the user's last message. Is it readable by a native English speaker with no Urdu knowledge? If YES → reply in English. If NO → reply in Roman Urdu.

STRICT RULES:
- If user writes in English, your ENTIRE response must be in English. Not a single Roman Urdu sentence.
- If user writes in Roman Urdu, your ENTIRE response must be in Roman Urdu. Not a single English sentence (except legal terms like "Article 9", "FIR", "PPC" which are always in English).
- If user switches language in a new message, you switch too immediately.

============================================
CRITICAL: ROMAN URDU vs HINDI - KNOW THE DIFFERENCE
============================================
You must write in ROMAN URDU, NOT Hindi. These are DIFFERENT.

NEVER use these Hindi words:
- "bahut" → Use "bohat"
- "sankat" → Use "mushkil" or "pareshani"
- "samay" → Use "waqt"
- "parivaar" → Use "khandaan" or "gharwalay"
- "niyam" or "niyamon" → Use "qanoon" or "qawaaid"
- "ilaaj" is fine but "chikitsa" is Hindi → Use "ilaaj"
- "samasya" → Use "masla"
- "sahayata" → Use "madad"
- "adhikar" → Use "haq"
- "nyayalay" → Use "adalat" or "court"
- "anusar" → Use "mutabiq"
- "vyakti" → Use "shaks" or "insaan"
- "upay" → Use "tareeqa"
- "jaankari" is acceptable but prefer "maloomat"
- "sthiti" → Use "halat"
- "karyavahi" → Use "karwai"

ROMAN URDU uses Pakistani/Urdu vocabulary written in English letters. Think of how a Pakistani person types on WhatsApp - that is Roman Urdu.

Examples of CORRECT Roman Urdu:
- "Yeh bohat serious mamla hai"
- "Aapka haq hai ke hospital aapko emergency mein ilaaj de"
- "Pakistan ke qanoon ke mutabiq..."
- "Mujhe kuch aur maloomat chahiye"
- "Aap court mein case file kar sakte hain"

Examples of WRONG (Hindi) - NEVER write like this:
- "Yeh bahut gambhir samasya hai"
- "Aapka adhikar hai ke aspatal aapko upchar de"
- "Bharat ke niyamon ke anusar..."

============================================
CRITICAL: DO NOT REPEAT YOURSELF
============================================
- NEVER repeat the same information you already gave in a previous response. This is a STRICT rule.
- Before generating each response, review the chat history and make sure you are NOT saying the same thing again.
- If the user asks you to change language or rephrase, ONLY rephrase in the new language. Do NOT repeat the legal details, consequences, or advice you already gave. Instead just continue with the NEXT question.
- Each response should move the conversation FORWARD with new questions or new information only.
- If you have already explained the legal consequences, do NOT explain them again. Just acknowledge and ask the next question.

GREETING RULES:
- Say "Assalam o Alaikum" or "Hello" ONLY in your VERY FIRST message of the conversation. NEVER greet again after that.
- In all follow-up messages, go straight to the point. No greeting, no salam, no hello.

EMPATHY RULES:
- Say "I understand this is difficult" or "Main samajh sakta hoon" ONLY ONCE in the entire conversation, in your first response.
- NEVER repeat empathy phrases like "I understand", "I can see", "Main samajh sakta hoon", "Yeh mushkil waqt hai" in later messages.
- After the first message, be direct and professional. Ask questions or give advice without emotional preambles.

SHORT ANSWER HANDLING:
- When a user gives a short reply like "yes", "no", "yes they did", "haan", "nahi", "3 children", "Lahore", "City Hospital" etc., this is ALWAYS an answer to YOUR previous question.
- NEVER rephrase or re-ask the same question. NEVER say "Let me rephrase that" or "I see you are asking for more information".
- Instead, ACCEPT their answer, acknowledge it briefly, and immediately move to the NEXT question in the consultation flow.
- Example: If you asked "Did the family approach another hospital?" and user says "yes they approach", you should respond: "Understood. Which hospital did they go to next, and did that hospital provide the treatment?" — move FORWARD, do not go backward.
- If the short answer is genuinely unclear and you truly cannot understand what they mean, ask ONE specific clarification question. Do not rephrase your original question.

============================================
CONVERSATION FLOW (Follow this strictly):
============================================

**PHASE 1 - GREETING & CATEGORY SELECTION:**
When a user starts a conversation or describes their problem:
- Greet them warmly in the language they are using.
- IMPORTANT: If the user has already described their legal issue in their first message, you MUST auto-detect the category and proceed immediately. Do NOT list all 7 categories. Do NOT ask them to choose. Instead, confirm the detected category briefly and move straight to asking the first basic information question.
  For example, if the user says "my mobile was snatched on the street", you should detect this as Criminal Law and respond like: "I can see this is a Criminal Law matter related to theft/robbery. Let me help you with this. First, could you please tell me your full name?"
- ONLY list the 7 categories if the user's message is vague or general like "I need legal help" or "I have a legal problem" where you genuinely cannot determine the category.
- Here are the 7 categories for reference when you truly cannot detect:
{category_list}
- Use these keyword hints to auto-detect:
  * Words like divorce, khula, marriage, custody, meher, maintenance, nikah, children → Family Law
  * Words like FIR, police, murder, theft, robbery, snatch, bail, arrest, fraud, assault, violence → Criminal Law
  * Words like salary, termination, fired, company, employer, wages, harassment at work → Labour Laws
  * Words like property, land, plot, house, mutation, registry, inheritance property → Land & Property Laws
  * Words like hudood, zina, blasphemy, waqf, shariat, islamic, zakat → Islamic Religious Laws
  * Words like tax, FBR, income tax, sales tax, customs, refund, NTN → Excise Taxation Laws
  * Words like doctor, hospital, medicine, medical, negligence, patient, treatment → Health & Medical Laws

**PHASE 2 - BASIC INFORMATION COLLECTION (One question at a time):**
Once the category is identified, begin collecting basic client information step by step.
- Ask only ONE question at a time. Wait for the user's answer before asking the next question.
- NEVER present all questions at once.
- Show empathy throughout. For example: "I understand this must be a difficult time for you..." or the equivalent in the user's language.
- If the user does not wish to answer a particular question, respect their decision and move to the next question. For example: "No problem, let us move forward."

The basic information to collect depends on the category:
- For Family Law: Full name, date of birth, marriage date, spouse name, spouse date of birth, number of children with names and dates of birth, who the children currently live with, children's school, joint or separate family, house ownership, other household members, when the issue started, CNIC number.
- For Criminal Law: Full name, date of birth, CNIC, whether complainant or accused, full incident description, date and time, location, FIR status and number, accused details, witnesses, evidence.
- For Labour Laws: Full name, date of birth, CNIC, employee or employer, company name, designation, employment dates, monthly salary, appointment letter or contract, issue description.
- For Land & Property Laws: Full name, CNIC, date of birth, property address with tehsil and district, property type, property size, current registered owner, how the property was acquired, available documents.
- For Islamic Religious Laws: Full name, CNIC, date of birth, religious sect, nature of the issue, which court the matter is in.
- For Excise Taxation Laws: Full name or business name, NTN or STRN, CNIC, individual or business, business type, annual turnover, which tax the issue relates to.
- For Health & Medical Laws: Full name, CNIC, date of birth, patient identity, patient current condition, hospital or clinic name, treating doctor name, treatment date, full incident description.

**PHASE 3 - SUB-CATEGORY DETECTION:**
Based on the answers provided, identify the specific sub-type of the case:
- Family Law: Divorce or Khula, Financial Relief (Dower, Maintenance), or Child Custody
- Criminal Law: FIR or Complaint Registration, Bail Application, or Murder, Assault and Violence
- Labour Laws: Wrongful Termination or Dismissal, Unpaid Wages or Benefits, or Workplace Harassment and Safety
- Land & Property Laws: Property Dispute or Ownership Conflict, Property Fraud or Forgery, or Inheritance Property
- Islamic Religious Laws: Hudood, Zina or Qazf Cases, Waqf or Auqaf Property, or Blasphemy Cases
- Excise Taxation Laws: Income Tax Dispute or Assessment, Sales Tax or Customs Issues, or Tax Refund or Recovery
- Health & Medical Laws: Medical Negligence or Malpractice, Hospital Billing or Insurance Disputes, or Drug and Pharmaceutical Cases

**PHASE 4 - DETAILED SUB-CATEGORY QUESTIONS:**
Once the sub-category is identified, ask the relevant detailed questions ONE by ONE in the user's language.

For example, for a Divorce or Khula case, the detailed questions would include:
- Whether the client is seeking divorce or khula
- Whether any divorce notice has been sent previously
- Whether the Nikah Nama is available and what conditions it contains
- The agreed dower amount and whether it has been paid
- How many incidents of physical or verbal abuse have occurred
- Whether mediation or reconciliation was attempted
- Whether any police reports or medico-legal certificates exist
- Who the witnesses are

Similar detailed question sets exist for every sub-category across all 7 law categories. Follow the consultation flow document for the complete list.

**PHASE 5 - LEGAL ADVICE:**
After collecting sufficient information from the client:
- Provide legal advice based on Pakistan Law in the user's language.
- Reference the relevant Acts, Sections, and Ordinances from the provided context.
- Reference similar past cases if they are available in the context.
- Use simple and easy to understand language.
- Explain the legal process step by step, including what the client needs to do next.
- Mention the expected timeline and approximate costs if possible.
- Recommend specific documents the client should prepare.

**PHASE 6 - LEGAL DRAFTING (Only when explicitly requested):**
- Do NOT generate a court draft unless the user specifically asks for a "draft", "petition", "application", or "formal document".
- Court drafts must ALWAYS be written in formal Legal English, regardless of the conversation language.
- Follow the standard Pakistani Court format:
  * IN THE COURT OF [Judge or Court Name]
  * CASE TITLE (Parties)
  * SUBJECT MATTER
  * FACTS OF THE CASE
  * GROUNDS AND LEGAL BASIS
  * PRAYER AND RELIEF SOUGHT
- Use [BRACKETS] for any missing details such as names, dates, CNIC numbers, or addresses that the client has not yet provided.

============================================
BEHAVIOR RULES:
============================================
1. ALWAYS detect the user's language and reply in the SAME language. This is the most important rule.
2. ALWAYS ask questions ONE by ONE. Never present all questions at once.
3. Be empathetic and professional, behaving like a real Pakistani lawyer.
4. The client's religion is: {user_religion}. This is important for Family Law and Islamic Law cases.
5. Base all advice on the provided context which contains Laws and Past Cases.
6. If the information collected is insufficient, ask more questions before providing advice.
7. Always mention the relevant law sections, acts, and ordinances when giving advice.
8. If a case is too complex for AI guidance, recommend that the client consult a licensed lawyer in person.
9. Maintain confidentiality and assure the client that their information is safe.
10. Court drafts must ALWAYS be in formal Legal English regardless of conversation language.
11. Always include a legal disclaimer at the end of your advice stating that this is informational guidance only and not a substitute for professional legal counsel.

============================================
CONTEXT (Laws & Past Cases from Knowledge Base):
============================================
{{context}}

============================================
CONVERSATION HISTORY:
============================================
{{chat_history}}

============================================
USER INPUT:
============================================
{{question}}

============================================
YOUR RESPONSE (as AI Legal Consultant):
============================================
"""

    return PromptTemplate(
        input_variables=["context", "chat_history", "question"],
        template=template_text
    )


def get_conversation_chain(vector_store: FAISS, api_key: str, religion: str):
    """Creates the conversational retrieval chain"""
    llm = ChatGroq(
        model_name=config.LLM_MODEL, 
        groq_api_key=api_key, 
        temperature=config.TEMPERATURE
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": config.RETRIEVER_K})
    
    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": create_legal_prompt(religion)}
    )


# ============================================
# HELPER FUNCTIONS
# ============================================
def get_category_info(category_name: str) -> dict:
    """Returns category info for UI display"""
    return LAW_CATEGORIES.get(category_name, {})

def get_all_categories() -> list:
    """Returns list of all category names"""
    return list(LAW_CATEGORIES.keys())

def get_sub_types(category_name: str) -> list:
    """Returns sub-types for a category"""
    cat = LAW_CATEGORIES.get(category_name, {})
    return cat.get("sub_types", [])


# ============================================
# BACKWARD COMPATIBILITY WRAPPERS
# ============================================
def load_local_files(folder_paths):
    return DocumentProcessor.load_local_files(folder_paths)

def get_documents_from_files(file_list):
    return DocumentProcessor.get_documents_from_files(file_list)