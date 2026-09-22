from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class MonthlyCategorySpend(BaseModel):
    month: date
    category: str
    total_spend: Decimal


class AnomalyRead(BaseModel):
    transaction_id: int
    amount: Decimal
    merchant_description: str
    category: str
    transaction_date: date
    threshold: Decimal
