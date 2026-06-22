"""
database.py - MongoDB Connection Setup
Yeh file database se connect karti hai
"""
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import ssl
# .env file load karo
load_dotenv()

# Connection string .env se uthao
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "qanoonai_db")

# MongoDB client banao
client = None
db = None

def connect_db():
    """Database se connect karo"""
    global client, db
    try:
        client = MongoClient(MONGODB_URI, tlsAllowInvalidCertificates=True)
        db = client[MONGODB_DB_NAME]
        # Test connection
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        
        # Indexes banao (faster searches ke liye)
        db.users.create_index("email", unique=True)
        db.lawyers.create_index("user_id")
        db.past_cases.create_index("category")
        db.lawyer_chats.create_index([("customer_id", 1), ("lawyer_id", 1)])
        db.payments.create_index("customer_id")
        print("Database indexes created!")
        
        return db
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return None

def get_db():
    """Database object do"""
    global db
    if db is None:
        db = connect_db()
    return db