from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def connect_db():
    try:
        client = MongoClient(os.getenv("MONGO_URI"))
        client.server_info()   # 🔴 THIS LINE CHECKS CONNECTION
        print("MongoDB Connected ✔")
        return client["quickfix"]
    except Exception as e:
        print("MongoDB Connection Failed ❌", e)
        exit(1)

db = connect_db()
