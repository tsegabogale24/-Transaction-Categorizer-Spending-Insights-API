from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction


def get_monthly_spend_by_category(db: Session, user_id: int) -> list[dict]:
    month = func.date_trunc("month", Transaction.transaction_date).cast(Transaction.transaction_date.type)
    statement = (
        select(
            month.label("month"),
            Transaction.category.label("category"),
            func.sum(Transaction.amount).label("total_spend"),
        )
        .where(Transaction.user_id == user_id)
        .group_by(month, Transaction.category)
        .order_by(month, Transaction.category)
    )
    return [dict(row._mapping) for row in db.execute(statement)]


def get_anomalous_transactions(db: Session, user_id: int) -> list[dict]:
    category_stats = (
        select(
            Transaction.category.label("category"),
            func.avg(Transaction.amount).label("average_amount"),
            func.coalesce(func.stddev_pop(Transaction.amount), 0).label("stddev_amount"),
            func.count(Transaction.id).label("transaction_count"),
        )
        .where(Transaction.user_id == user_id)
        .group_by(Transaction.category)
        .subquery()
    )

    threshold = category_stats.c.average_amount + (2 * category_stats.c.stddev_amount)
    statement = (
        select(
            Transaction.id.label("transaction_id"),
            Transaction.amount,
            Transaction.merchant_description,
            Transaction.category,
            Transaction.transaction_date,
            threshold.label("threshold"),
        )
        .join(category_stats, Transaction.category == category_stats.c.category)
        .where(
            Transaction.user_id == user_id,
            category_stats.c.transaction_count > 1,
            Transaction.amount > threshold,
        )
        .order_by(Transaction.amount.desc())
    )
    return [dict(row._mapping) for row in db.execute(statement)]
