
from fastapi import APIRouter, HTTPException
from database import db
from bson import ObjectId
from math import radians, cos, sin, sqrt, atan2

router = APIRouter(prefix="/service", tags=["Service Requests"])

# Keep 1000 km for your current testing setup.
# Change to 5 when you are ready to test a 5 km radius.
DISTANCE_LIMIT = 1000

VALID_STATUSES = {
    "pending",
    "accepted",
    "in_progress",
    "completed",
    "cancelled",
}


def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    # Protect against floating-point rounding errors.
    a = max(0, min(1, a))
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def serialize_request(request):
    request["_id"] = str(request["_id"])
    return request


# CREATE SERVICE REQUEST
@router.post("/create")
def create_request(data: dict):
    user_id = data.get("userId")
    description = data.get("description")

    if not ObjectId.is_valid(user_id or ""):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if not isinstance(description, str) or not description.strip():
        raise HTTPException(
            status_code=400,
            detail="Please describe the vehicle problem"
        )

    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    lat = user.get("lat")
    lng = user.get("lng")

    if lat is None or lng is None:
        raise HTTPException(
            status_code=400,
            detail="User location is missing. Update your location first."
        )

    result = db.requests.insert_one({
        "userId": user_id,
        "description": description.strip(),
        "lat": lat,
        "lng": lng,
        "status": "pending",
        "assignedGarageId": None
    })

    return {
        "message": "Service request created successfully",
        "requestId": str(result.inserted_id),
        "status": "pending"
    }


# NEARBY PENDING REQUESTS
@router.get("/pending/{garageId}")
def get_pending_requests_nearby(garageId: str):
    if not ObjectId.is_valid(garageId):
        raise HTTPException(status_code=400, detail="Invalid garage ID")

    garage = db.garages.find_one({"_id": ObjectId(garageId)})

    if not garage:
        raise HTTPException(status_code=404, detail="Garage not found")

    if garage.get("lat") is None or garage.get("lng") is None:
        raise HTTPException(
            status_code=400,
            detail="Garage location is missing"
        )

    requests = db.requests.find({"status": "pending"})
    nearby_requests = []

    for request in requests:
        if request.get("lat") is None or request.get("lng") is None:
            continue

        distance = calculate_distance(
            float(garage["lat"]),
            float(garage["lng"]),
            float(request["lat"]),
            float(request["lng"])
        )

        if distance <= DISTANCE_LIMIT:
            request["distanceKm"] = round(distance, 2)
            nearby_requests.append(serialize_request(request))

    return nearby_requests


# ACCEPT REQUEST: ONLY ONE GARAGE CAN WIN
@router.post("/accept/{request_id}")
def accept_request(request_id: str, data: dict):
    garage_id = data.get("garageId")

    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    if not ObjectId.is_valid(garage_id or ""):
        raise HTTPException(status_code=400, detail="Invalid garage ID")

    if not db.garages.find_one({"_id": ObjectId(garage_id)}):
        raise HTTPException(status_code=404, detail="Garage not found")

    # Atomic update prevents two garages accepting the same pending request.
    result = db.requests.update_one(
        {
            "_id": ObjectId(request_id),
            "status": "pending",
            "assignedGarageId": None
        },
        {
            "$set": {
                "status": "accepted",
                "assignedGarageId": garage_id
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=409,
            detail="This request has already been accepted or is unavailable"
        )

    return {
        "message": "Request accepted successfully",
        "status": "accepted"
    }


# UPDATE STATUS: GARAGE
@router.post("/status/{request_id}")
def update_request_status(request_id: str, data: dict):
    garage_id = data.get("garageId")
    new_status = data.get("status")

    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    if not ObjectId.is_valid(garage_id or ""):
        raise HTTPException(status_code=400, detail="Invalid garage ID")

    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    request = db.requests.find_one({
        "_id": ObjectId(request_id),
        "assignedGarageId": garage_id
    })

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Assigned request not found"
        )

    current_status = request.get("status", "pending")

    # Only allow sensible forward transitions.
    allowed_transitions = {
        "accepted": {"in_progress", "cancelled"},
        "in_progress": {"completed", "cancelled"},
    }

    if new_status not in allowed_transitions.get(current_status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {current_status} to {new_status}"
        )

    result = db.requests.update_one(
        {
            "_id": ObjectId(request_id),
            "assignedGarageId": garage_id,
            "status": current_status
        },
        {"$set": {"status": new_status}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=409,
            detail="Request status changed. Refresh and try again."
        )

    return {
        "message": "Request status updated successfully",
        "status": new_status
    }


# USER VIEW: REQUEST STATUS AND ASSIGNED GARAGE
@router.get("/user/details/{userId}")
def get_user_requests_with_garage(userId: str):
    if not ObjectId.is_valid(userId):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    requests = list(db.requests.find({"userId": userId}))
    result = []

    for request in requests:
        garage_data = None
        garage_id = request.get("assignedGarageId")

        if garage_id and ObjectId.is_valid(garage_id):
            garage = db.garages.find_one(
                {"_id": ObjectId(garage_id)},
                {"password": 0}
            )

            if garage:
                garage_data = {
                    "garageName": garage.get("garageName", "Garage"),
                    "services": garage.get("services", []),
                    "email": garage.get("email", "")
                }

        result.append({
            "requestId": str(request["_id"]),
            "description": request.get("description", ""),
            "status": request.get("status", "pending"),
            "garage": garage_data
        })

    return result


# GARAGE VIEW: ALL REQUESTS ASSIGNED TO THIS GARAGE
@router.get("/garage/{garageId}")
def get_requests_for_garage(garageId: str):
    if not ObjectId.is_valid(garageId):
        raise HTTPException(status_code=400, detail="Invalid garage ID")

    requests = list(
        db.requests.find({"assignedGarageId": garageId})
    )

    return [serialize_request(request) for request in requests]
