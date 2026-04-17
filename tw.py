import re
import json
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from collections import Counter, defaultdict

# NLP
import nltk
from nltk.corpus import stopwords
from textblob import TextBlob

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

# ─── NLP SETUP ────────────────────────────────────────────────────────────────
nltk.download('punkt')
nltk.download('stopwords')
STOP_WORDS = set(stopwords.words("english"))

# ─── KEYWORD GROUP MAPPING ────────────────────────────────────────────────────
KEYWORD_GROUP_MAP = {
    "Kotak Securities": ['Kotak Securities', 'कोटक सिक्योरिटीज'],
    "Geojit": ['Geojit', 'जियोजित'],
    "ICICI Securities": ['ICICI Securities', 'आईसीआईसीआई सिक्योरिटीज'],
    "Indiainfoline": ['Indiainfoline', 'इंडिया इंफोलाइन'],
    "Motilal Oswal Group": ['Motilal Oswal', 'मोतीलाल ओसवाल'],
    "Zerodha": ['Zerodha', 'ज़ेरोधा'],
    "Prudent": ['Prudent'],
    "Angel One": ['Angel One'],
    "Groww": ['Groww'],
}

def normalize_keyword(keyword: str) -> str:
    for main, variants in KEYWORD_GROUP_MAP.items():
        if keyword.strip() in variants:
            return main
    return keyword

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def get_text(field):
    if not field:
        return ""
    if isinstance(field, str):
        return field
    if isinstance(field, dict):
        return field.get("text", "")
    return ""

def clean_html(text):
    return re.sub(r"<[^>]+>", "", text or "")

def extract_keywords(text):
    return re.findall(r"<match[^>]*>(.*?)</match>", text or "")

def preprocess_text(text):
    text = clean_html(text).lower()
    words = re.findall(r"\b[a-zA-Z]+\b", text)
    return [w for w in words if w not in STOP_WORDS and len(w) > 2]

def clean_author(author):
    return author.strip() if author else "Unknown"

def clean_source(source):
    return source.strip() if source else "Unknown"

# ─── IST DATE HELPERS ─────────────────────────────────────────────────────────
def get_today_ist_date():
    return datetime.now(IST).date()

def filter_today_ist(documents):
    today = get_today_ist_date()
    return [
        doc for doc in documents
        if doc.get("unix_timestamp") and
        datetime.fromtimestamp(doc["unix_timestamp"], tz=IST).date() == today
    ]

# ─── API CALL ─────────────────────────────────────────────────────────────────
def search_articles(searchterm, num_articles=2000):
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
        },
    }

    res = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=30)
    res.raise_for_status()
    return res.json()

# ─── NLP FUNCTIONS ────────────────────────────────────────────────────────────
def get_sentiment(text):
    try:
        polarity = TextBlob(text).sentiment.polarity
        if polarity > 0:
            return "positive"
        elif polarity < 0:
            return "negative"
        return "neutral"
    except:
        return "neutral"

def get_summary(text):
    try:
        sentences = nltk.sent_tokenize(text)
        return " ".join(sentences[:2])
    except:
        return ""

# ─── ARTICLE MAPPER ───────────────────────────────────────────────────────────
def map_article(doc, index):
    header = clean_html(get_text(doc.get("header")))
    summary = clean_html(get_text(doc.get("summary")))
    body = clean_html(get_text(doc.get("body")))

    full_text = f"{header} {summary} {body}"

    keywords = (
        extract_keywords(get_text(doc.get("header"))) +
        extract_keywords(get_text(doc.get("summary"))) +
        extract_keywords(get_text(doc.get("body")))
    )

    normalized_keywords = list(dict.fromkeys([normalize_keyword(k) for k in keywords]))

    ts = doc.get("unix_timestamp")
    site_rank = doc.get("site_rank") or {}

    return {
        "id": index + 1,
        "title": header,
        "summary": summary,
        "body": body,
        "matched_keywords": normalized_keywords,

        "author": clean_author(get_text(doc.get("author"))),
        "source": clean_source((doc.get("first_source") or {}).get("name")),

        # ✅ RESTORED
        "global_rank": site_rank.get("rank_global", "N/A"),
        "country_rank": site_rank.get("rank_country", "N/A"),

        "sentiment": get_sentiment(full_text),
        "ai_summary": get_summary(full_text),
        "tokens": preprocess_text(full_text),

        "published_at_ist": datetime.fromtimestamp(ts, tz=IST).strftime("%Y-%m-%d %H:%M IST") if ts else "N/A",
        "url": doc.get("url", "N/A"),
    }

# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    SEARCH_TERMS = [
        ['"Kotak Securities"', '"कोटक सिक्योरिटीज"'],
        ['"Geojit"', '"जियोजित"'],
        ['"ICICI Securities"', '"आईसीआईसीआई सिक्योरिटीज"'],
        ['"Indiainfoline"', '"इंडिया इंफोलाइन"'],
        ['"Motilal Oswal"', '"मोतीलाल ओसवाल"'],
        ['"Zerodha"', '"ज़ेरोधा"'],
        ['"Prudent"'],
        ['"Angel One"'],
        ['"Groww"'],
    ]

    SEARCH_TERM = " OR ".join(f"({ ' OR '.join(g) })" for g in SEARCH_TERMS)

    print(f">> Searching: {SEARCH_TERM}")

    data = search_articles(SEARCH_TERM)
    documents = data.get("searchresult", {}).get("document", [])
    context = data.get("searchresult", {}).get("context", "")

    today_docs = filter_today_ist(documents)
    articles = [map_article(doc, i) for i, doc in enumerate(today_docs)]

    # ─── ANALYTICS ────────────────────────────────────────────────
    keyword_counts = Counter()
    sentiment_by_brand = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
    bow = defaultdict(Counter)

    author_counts = Counter()
    source_counts = Counter()

    # ✅ NEW
    source_keyword_map = defaultdict(lambda: Counter())
    keyword_source_map = defaultdict(lambda: Counter())

    for article in articles:
        kws = article["matched_keywords"]
        tokens = article["tokens"]
        sentiment = article["sentiment"]
        author = article["author"]
        source = article["source"]

        for kw in kws:
            keyword_counts[kw] += 1

            for word in tokens:
                bow[kw][word] += 1

            sentiment_by_brand[kw][sentiment] += 1

            # ✅ SOURCE → KEYWORD
            source_keyword_map[source][kw] += 1

            # ✅ KEYWORD → SOURCE
            keyword_source_map[kw][source] += 1

        author_counts[author] += 1
        source_counts[source] += 1

    bow_top = {k: dict(v.most_common(15)) for k, v in bow.items()}

    source_keyword_breakdown = {
        src: dict(counter)
        for src, counter in source_keyword_map.items()
    }

    keyword_source_breakdown = {
        kw: dict(counter)
        for kw, counter in keyword_source_map.items()
    }

    output = {
        "date": str(get_today_ist_date()),
        "total": len(articles),
        "context": context,

        "keyword_counts": dict(keyword_counts),
        "sentiment_by_brand": dict(sentiment_by_brand),
        "bag_of_words": bow_top,

        "author_counts": dict(author_counts),
        "unique_authors": len(author_counts),

        "source_counts": dict(source_counts),
        "unique_sources": len(source_counts),

        # ✅ YOUR FEATURE
        "source_keyword_breakdown": source_keyword_breakdown,

        # ✅ BONUS
        "keyword_source_breakdown": keyword_source_breakdown,

        "articles": articles,
    }

    # ─── SAVE FILE ────────────────────────────────────────────────
    with open("final_output.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(articles)} enriched articles")
    print(f"👤 Unique Authors: {len(author_counts)}")
    print(f"📰 Unique Sources: {len(source_counts)}")

    # ─── MONGODB STORE ────────────────────────────────────────────
    try:
        MAX_ARTICLES = 1000
        if len(output["articles"]) > MAX_ARTICLES:
            output["articles"] = output["articles"][:MAX_ARTICLES]

        collection.update_one(
            {"date": output["date"]},
            {"$set": output},
            upsert=True
        )

        print("✅ Stored in MongoDB (single document per day)")

    except Exception as e:
        print("❌ MongoDB Error:", str(e))