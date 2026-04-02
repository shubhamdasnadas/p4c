import requests
import json
from datetime import datetime, timezone, timedelta

# ─── Configuration ────────────────────────────────────────────────────────────
API_TOKEN = "070e1d57bb0817a34d5d62a4c58a20eee85a3a30"
BASE_URL  = "https://api.opoint.com/search/"

HEADERS = {
    "Authorization": f"Token {API_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# ─── IST Timezone ─────────────────────────────────────────────────────────────
IST = timezone(timedelta(hours=5, minutes=30))

# ─── Core Search Function ─────────────────────────────────────────────────────
def search_articles(searchterm: str, num_articles: int = 100) -> dict:
    payload = {
        "searchterm": searchterm,
        "params": {
            "requestedarticles": num_articles,
            "main": {
                "header": 1,
                "summary": 1,
                "text": 1
            }
        }
    }
    response = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()


# ─── Filter: Today's Articles in IST ─────────────────────────────────────────
def filter_today_ist(documents: list) -> list:
    """
    Keep only articles whose unix_timestamp falls within today in IST (UTC+5:30).
    This prevents missing early-morning IST articles that are still 'yesterday' in UTC.
    """
    today_ist = datetime.now(IST).date()

    filtered = []
    for doc in documents:
        ts = doc.get("unix_timestamp")
        if ts:
            article_date_ist = datetime.fromtimestamp(ts, tz=IST).date()
            if article_date_ist == today_ist:
                filtered.append(doc)
    return filtered


# ─── Display Helper ───────────────────────────────────────────────────────────
def display_articles(documents: list) -> None:
    if not documents:
        print("No articles found for today.")
        return

    today_ist = datetime.now(IST).date()
    print(f"\n{'='*65}")
    print(f"  {len(documents)} article(s) found for today ({today_ist} IST)")
    print(f"{'='*65}\n")

    for i, doc in enumerate(documents, start=1):
        header  = doc.get("header", {}).get("text", "No title")
        summary = doc.get("summary", {}).get("text", "").strip()
        url     = doc.get("url", "N/A")
        source  = doc.get("first_source", {}).get("name", "N/A")
        ts      = doc.get("unix_timestamp")
        date    = (
            datetime.fromtimestamp(ts, tz=IST).strftime("%Y-%m-%d %H:%M IST")
            if ts else "N/A"
        )

        print(f"[{i}] {header}")
        print(f"     Source  : {source}")
        print(f"     Date    : {date}")  # Now shown in IST
        print(f"     URL     : {url}")
        if summary:
            print(f"     Summary : {summary[:200]}...")
        print()


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(">> Searching for 'Geojit' — today's articles only (IST)...\n")

    data      = search_articles("Geojit", num_articles=100)
    documents = data.get("searchresult", {}).get("document", [])

    print(f"   Total articles returned by API : {len(documents)}")

    today_docs = filter_today_ist(documents)
    print(f"   Articles from today (IST)      : {len(today_docs)}")

    display_articles(today_docs)

    # Save today's articles to JSON
    if today_docs:
        filename = f"geojit_{datetime.now(IST).date()}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(today_docs, f, indent=2, ensure_ascii=False)
        print(f"Saved to {filename}")