# Backend

FastAPI service for authentication, transaction ingestion, categorization, and spending insights.

Run locally:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run tests:

```bash
pytest
```
