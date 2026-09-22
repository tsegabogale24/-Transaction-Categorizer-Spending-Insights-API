from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.insight import AnomalyRead, MonthlyCategorySpend
from app.services.insights import get_anomalous_transactions, get_monthly_spend_by_category

router = APIRouter()


@router.get("/monthly", response_model=list[MonthlyCategorySpend])
def monthly_insights(
    current_user: CurrentUser,
    db: DbSession,
) -> list[MonthlyCategorySpend]:
    return get_monthly_spend_by_category(db=db, user_id=current_user.id)


@router.get("/anomalies", response_model=list[AnomalyRead])
def anomaly_insights(current_user: CurrentUser, db: DbSession) -> list[AnomalyRead]:
    return get_anomalous_transactions(db=db, user_id=current_user.id)
