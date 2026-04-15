import re
import json
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

# ─── CONFIG ───────────────────────────────────────────────────────────────────
API_TOKEN = "070e1d57bb0817a34d5d62a4c58a20eee85a3a30"
BASE_URL  = "https://api.opoint.com/search/"

HEADERS = {
    "Authorization": f"Token {API_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

IST = timezone(timedelta(hours=5, minutes=30))

# ─── MONGODB CONFIG ───────────────────────────────────────────────────────────
MONGO_URI = "mongodb://localhost:27017/my_python?tls=false"
client = MongoClient(MONGO_URI)

db = client["my_python"]

collection = db["opoint_articles"]

# ─── KEYWORD GROUP MAPPING (NEW) ──────────────────────────────────────────────
KEYWORD_GROUP_MAP = {
    "Kotak Securities": ['Kotak Securities', 'कोटक सिक्योरिटीज'],
    "Geojit": ['Geojit', 'जियोजित'],
    "ICICI Securities": ['ICICI Securities', 'आईसीआईसीआई सिक्योरिटीज'],
    "Indiainfoline": ['Indiainfoline', 'इंडिया इंफोलाइन'],
    "Motilal Oswal Group": ['Motilal Oswal', 'मोतीलाल ओसवाल']
}

def normalize_keyword(keyword: str) -> str:
    for main, variants in KEYWORD_GROUP_MAP.items():
        if keyword.strip() in variants:
            return main
    return keyword


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def get_text(field) -> str:
    if not field:
        return ""
    if isinstance(field, str):
        return field
    if isinstance(field, dict):
        return field.get("text", "")
    return ""


def clean_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "")


def extract_keywords(text: str) -> list:
    return re.findall(r"<match[^>]*>(.*?)</match>", text or "")


# ─── IST DATE HELPERS ─────────────────────────────────────────────────────────

def get_today_ist_date():
    return datetime.now(IST).date()


def filter_today_ist(documents: list) -> list:
    today_ist = get_today_ist_date()
    filtered = []
    for doc in documents:
        ts = doc.get("unix_timestamp")
        if ts:
            article_date_ist = datetime.fromtimestamp(ts, tz=IST).date()
            if article_date_ist == today_ist:
                filtered.append(doc)
    return filtered


# ─── CORE SEARCH FUNCTION ─────────────────────────────────────────────────────

def search_articles(searchterm: str, num_articles: int = 500, context: str = "") -> dict:
    payload = {
        "searchterm": searchterm,
        "params": {
            "requestedarticles": num_articles,
            "main": {
                "header": 2,
                "summary": 2,
                "text": 2,
                "quotes": 2,
                "matches": True,
            },
            **({"context": context} if context else {}),
        },
    }

    response = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()


# ─── CLEANED ARTICLE MAPPER ───────────────────────────────────────────────────

def map_article(doc: dict, index: int) -> dict:
    header_raw  = get_text(doc.get("header"))
    summary_raw = get_text(doc.get("summary"))
    body_raw    = get_text(doc.get("body"))

    keywords = (
        extract_keywords(header_raw)
        + extract_keywords(summary_raw)
        + extract_keywords(body_raw)
    )

    # ✅ NORMALIZE KEYWORDS HERE
    normalized_keywords = [normalize_keyword(k) for k in keywords]

    unique_keywords = list(dict.fromkeys(normalized_keywords))

    quotes_raw = doc.get("quotes", [])
    quotes = [clean_html(get_text(q)) for q in quotes_raw] if isinstance(quotes_raw, list) else []

    short_header  = clean_html(get_text(doc.get("short_header", "")))
    short_summary = clean_html(get_text(doc.get("short_summary", "")))
    short_body    = clean_html(get_text(doc.get("short_body", "")))

    site_rank = doc.get("site_rank") or {}

    similarweb = doc.get("similarweb") or {}
    readership = {
        "monthly_visits": similarweb.get("readership", "N/A"),
        "article_readership": similarweb.get("article_readership", "N/A"),
    }

    ts = doc.get("unix_timestamp")

    return {
        "id": index + 1,
        "title": clean_html(header_raw),
        "summary": clean_html(summary_raw),
        "body": clean_html(body_raw),

        "short_header": short_header,
        "short_summary": short_summary,
        "short_body": short_body,

        "quotes": quotes,
        "matched_keywords": unique_keywords,

        "url": doc.get("url", "N/A"),
        "source": (doc.get("first_source") or {}).get("name", "N/A"),

        "published_at_unix": ts,
        "published_at_ist": (
            datetime.fromtimestamp(ts, tz=IST).strftime("%Y-%m-%d %H:%M IST")
            if ts else "N/A"
        ),
        "local_time": get_text(doc.get("local_time")),

        "image_url": (
            ((doc.get("articleimages") or {}).get("articleimage") or [{}])[0].get("url", "")
        ),

        "article_details": {
            "entity": get_text(doc.get("entity")),
            "website": (doc.get("first_source") or {}).get("homepage", "N/A"),
            "author": get_text(doc.get("author")),
            "monthly_visitors": doc.get("circulation", "N/A"),
            "readership": readership,
            "global_rank": site_rank.get("rank_global", "N/A"),
            "country_rank": site_rank.get("rank_country", "N/A"),
            "genre": get_text(doc.get("mediatype"))
        },
    }


# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    SEARCH_TERMS = [
        ('"Kotak Securities"', '"कोटक सिक्योरिटीज"'),
        ('"Geojit"', '"जियोजित"'),
        ('"ICICI Securities"', '"आईसीआईसीआई सिक्योरिटीज"'),
        ('"Indiainfoline"', '"इंडिया इंफोलाइन"'),
        ('"Motilal Oswal"', '"मोतीलाल ओसवाल"')
    ]

    SEARCH_TERM = " OR ".join(
        f"({ ' OR '.join(group) })" for group in SEARCH_TERMS
    )

    print(f">> Searching: {SEARCH_TERM}")

    data = search_articles(SEARCH_TERM)
    documents = data.get("searchresult", {}).get("document", [])
    context = data.get("searchresult", {}).get("context", "")

    today_docs = filter_today_ist(documents)

    articles = [map_article(doc, i) for i, doc in enumerate(today_docs)]

    # ─── KEYWORD COUNT (WITH NORMALIZATION) ──────────────────────────
    keyword_counts = {}
    for article in articles:
        for kw in article.get("matched_keywords", []):
            keyword_counts[kw] = keyword_counts.get(kw, 0) + 1

    output = {
        "total": len(articles),
        "date": str(get_today_ist_date()),
        "context": context,
        "keyword_counts": keyword_counts,
        "articles": articles,
    }

    with open("cleaned_articles.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(articles)} cleaned articles to file")

    try:
        if output["articles"]:
            collection.insert_one(output)
            print("✅ Data stored in MongoDB (collection: opoint_articles)")
        else:
            print("⚠️ No data to store")
    except Exception as e:
        print("❌ MongoDB Error:", str(e))