from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.models import Transaction
from app.schemas.transaction import TransactionBatchCreate, TransactionRead
from app.services.categorizer import categorize_merchant

router = APIRouter()


@router.post("", response_model=list[TransactionRead])
def create_transactions(
    payload: TransactionBatchCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> list[Transaction]:
    transactions = [
        Transaction(
            user_id=current_user.id,
            amount=item.amount,
            merchant_description=item.merchant_description,
            category=item.category or categorize_merchant(item.merchant_description),
            transaction_date=item.date,
        )
        for item in payload.transactions
    ]

    db.add_all(transactions)
    db.commit()
    for transaction in transactions:
        db.refresh(transaction)
    return transactions
