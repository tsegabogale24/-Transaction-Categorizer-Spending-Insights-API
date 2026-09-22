from fastapi import APIRouter

from app.api.routes import auth, insights, transactions

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
