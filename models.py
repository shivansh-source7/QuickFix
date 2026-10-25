from pydantic import BaseModel
from typing import Optional

# ----------------------------
# USER MODEL
# ----------------------------
class User(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    lat: float
    lng: float


# ----------------------------
# GARAGE MODEL
# ----------------------------
class Garage(BaseModel):
    garageName: str
    ownerName: str
    email: str
    password: str
    services: str
    lat: float
    lng: float


# ----------------------------
# SERVICE REQUEST MODEL
# ----------------------------
class ServiceRequest(BaseModel):
    userId: str
    description: str
    lat: float
    lng: float

    status: str = "pending"                 # pending | accepted
    assignedGarageId: Optional[str] = None  # set when garage accepts


# ----------------------------
# INVOICE MODEL
# ----------------------------
class Invoice(BaseModel):
    requestId: str
    amount: float
    serviceDetails: str
    paymentStatus: str = "unpaid"
