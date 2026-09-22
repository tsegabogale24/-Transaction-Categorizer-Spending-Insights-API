import re

CATEGORY_PATTERNS: dict[str, tuple[str, ...]] = {
    "groceries": (r"\bwhole foods\b", r"\btrader joe", r"\bwalmart\b", r"\bcostco\b"),
    "transport": (r"\buber\b", r"\blyft\b", r"\bshell\b", r"\bmetro\b"),
    "dining": (r"\bstarbucks\b", r"\bmcdonald", r"\brestaurant\b", r"\bcafe\b"),
    "subscriptions": (r"\bnetflix\b", r"\bspotify\b", r"\bhulu\b", r"\badobe\b"),
    "entertainment": (r"\bcinema\b", r"\bamc\b", r"\bticketmaster\b", r"\bsteam\b"),
}


def categorize_merchant(description: str) -> str:
    normalized = description.lower()
    for category, patterns in CATEGORY_PATTERNS.items():
        if any(re.search(pattern, normalized) for pattern in patterns):
            return category
    return "other"
