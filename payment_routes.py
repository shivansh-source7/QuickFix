from fastapi import APIRouter
from database import db
from models import Invoice
from bson import ObjectId

router = APIRouter(prefix="/payment", tags=["Payment"])


# -------------------------------------------------
# CREATE INVOICE (ONLY IF NOT EXISTS)
# -------------------------------------------------
@router.post("/invoice")
def create_invoice(invoice: Invoice):

    existing = db.invoices.find_one({"requestId": invoice.requestId})
    if existing:
        return {"error": "Invoice already exists"}

    db.invoices.insert_one({
        "requestId": invoice.requestId,
        "amount": invoice.amount,
        "serviceDetails": invoice.serviceDetails,
        "paymentStatus": "unpaid"
    })

    return {"message": "Invoice created successfully"}


# -------------------------------------------------
# GET INVOICE
# -------------------------------------------------
@router.get("/invoice/{requestId}")
def get_invoice(requestId: str):

    invoice = db.invoices.find_one({"requestId": requestId})

    if not invoice:
        return {"message": "Invoice not found"}

    invoice["_id"] = str(invoice["_id"])
    return invoice


# -------------------------------------------------
# PAY INVOICE
# -------------------------------------------------
@router.post("/pay/{requestId}")
def pay_invoice(requestId: str):

    invoice = db.invoices.find_one({"requestId": requestId})
    if not invoice:
        return {"error": "Invoice not found"}

    if invoice["paymentStatus"] == "paid":
        return {"message": "Already paid"}

    db.invoices.update_one(
        {"requestId": requestId},
        {"$set": {"paymentStatus": "paid"}}
    )

    return {"message": "Payment successful"}
