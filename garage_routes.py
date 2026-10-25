from fastapi import APIRouter
from models import Garage
from database import db
from utils import hash_password, verify_password, create_token

router = APIRouter(prefix="/garages", tags=["Garages"])


# -------------------------------------------------
# REGISTER GARAGE
# -------------------------------------------------
@router.post("/register")
def register_garage(garage: Garage):

    # ❗ prevent duplicate email
    existing = db.garages.find_one({"email": garage.email})
    if existing:
        return {"error": "Garage already registered with this email"}

    # hash password
    garage.password = hash_password(garage.password)

    # insert into db
    db.garages.insert_one(garage.dict())

    return {"message": "Garage registered successfully"}


# -------------------------------------------------
# GARAGE LOGIN  (REQUIRED)
# -------------------------------------------------
@router.post("/login")
def garage_login(data: dict):

    garage = db.garages.find_one({"email": data.get("email")})

    if not garage:
        return {"error": "Garage not found"}

    if not verify_password(data.get("password"), garage["password"]):
        return {"error": "Invalid credentials"}

    token = create_token({
        "garageId": str(garage["_id"]),
        "role": "garage"
    })

    return {
        "token": token,
        "role": "garage",
        "garageId": str(garage["_id"])
    }


# -------------------------------------------------
# GET ALL GARAGES (USER VIEW)
# -------------------------------------------------
@router.get("")
def get_all_garages():
    garages = list(db.garages.find())

    for g in garages:
        g["_id"] = str(g["_id"])
        g.pop("password", None)

    return garages


# -------------------------------------------------
# FIND NEARBY GARAGES (OPTIONAL - USER SIDE)
# -------------------------------------------------
@router.post("/nearby")
def find_nearby(data: dict):
    garages = list(db.garages.find())

    for g in garages:
        g["_id"] = str(g["_id"])
        g.pop("password", None)

    return garages
