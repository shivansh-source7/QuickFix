from fastapi import APIRouter, HTTPException
from models import User
from database import db
from utils import hash_password, verify_password, create_token
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])


# -------------------------------------------------
# USER REGISTER
# -------------------------------------------------
@router.post("/register")
def register_user(user: User):

    # Check if email already exists
    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_pw = hash_password(user.password)

    user_data = {
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "password": hashed_pw,
        "lat": user.lat,
        "lng": user.lng
    }

    result = db.users.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "userId": str(result.inserted_id)
    }


# -------------------------------------------------
# USER LOGIN
# -------------------------------------------------
@router.post("/login")
def login(data: dict):

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = db.users.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_token({
        "userId": str(user["_id"]),
        "role": "user"
    })

    return {
        "message": "Login successful",
        "token": token,
        "role": "user",
        "userId": str(user["_id"]),
        "lat": user["lat"],
        "lng": user["lng"]
    }


# -------------------------------------------------
# GET USER PROFILE (OPTIONAL)
# -------------------------------------------------
@router.get("/{userId}")
def get_user(userId: str):

    if not ObjectId.is_valid(userId):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = db.users.find_one(
        {"_id": ObjectId(userId)},
        {"password": 0}  # hide password
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])

    return user
