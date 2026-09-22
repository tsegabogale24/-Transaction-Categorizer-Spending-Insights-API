from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    merchant_description: str = Field(min_length=1, max_length=255)
    date: date
    category: str | None = Field(default=None, max_length=50)


class TransactionBatchCreate(BaseModel):
    transactions: list[TransactionCreate] = Field(min_length=1)


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: Decimal
    merchant_description: str
    category: str
    transaction_date: date
