
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from user_routes import router as user_router
from garage_routes import router as garage_router
from service_routes import router as service_router
from payment_routes import router as payment_router

app = FastAPI(title="QuickFix API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.128.144.132:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(garage_router)
app.include_router(service_router)
app.include_router(payment_router)


@app.get("/")
def home():
    return {"message": "QuickFix API running"}
