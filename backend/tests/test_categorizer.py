from app.services.categorizer import categorize_merchant


def test_categorizes_known_merchants() -> None:
    assert categorize_merchant("STARBUCKS #4521") == "dining"
    assert categorize_merchant("UBER TRIP") == "transport"
    assert categorize_merchant("NETFLIX.COM") == "subscriptions"


def test_unknown_merchant_defaults_to_other() -> None:
    assert categorize_merchant("LOCAL SHOP 123") == "other"
