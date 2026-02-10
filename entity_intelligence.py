import requests
import json
import time
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from newspaper import Article
from urllib.parse import urljoin

# ================= CONFIG ================= #

HEADERS = {
    "User-Agent": "Mozilla/5.0 (EntityIntelligence/4.0)"
}

OUTPUT_FILE = "entity_intelligence_live_results.jsonl"
REQUEST_DELAY = 0.6
MIN_BODY_LENGTH = 80
MAX_GENERIC_ARTICLES = 700

# ================= ENTITY RULES ================= #

ENTITY_KEYWORDS = [
    "says", "said", "according to", "as per",
    "recommends", "recommended",
    "rating", "target price", "upside", "downside",
    "buy", "sell", "hold",
    "coverage", "outperform", "underperform",
    "bullish", "positive", "cautious",
    "stocks to buy", "top picks"
]

BLOCK_TERMS = [
    "icici bank",
    "icici prudential",
    "icici lombard",
    "icici mutual",
    "icici life"
]

# ================= SOURCES ================= #

GENERIC_SOURCES = {
    "NDTV Profit": "https://www.ndtvprofit.com/markets",
    "Business Today": "https://www.businesstoday.in/markets",
    "Business Standard": "https://www.business-standard.com/markets/news",
    "Economic Times": "https://economictimes.indiatimes.com/markets",
    "ET Now": "https://www.etnownews.com/markets",
    "CNBC TV18": "https://www.cnbctv18.com/market/",
    "Zee Business": "https://www.zeebiz.com/markets",
    "Financial Express": "https://www.financialexpress.com/market/",
    "Hindu BusinessLine": "https://www.thehindubusinessline.com/markets/",
    "Good Returns": "https://www.goodreturns.in/news/",
    "India Infoline": "https://www.indiainfoline.com/markets/news",
    "DSIJ": "https://www.dsij.in/market-news"
}

# ================= LIVEMINT ================= #

LIVEMINT_BASE = "https://www.livemint.com"
LIVEMINT_SECTION = "https://www.livemint.com/market/stock-market-news"
LIVEMINT_PAGES = 5

# ================= MONEYCONTROL ================= #

MONEYCONTROL_SECTIONS = [
    "https://www.moneycontrol.com/news/business/markets/",
    "https://www.moneycontrol.com/technology/"
]
MONEYCONTROL_PAGES = 3

# ================= HELPERS ================= #

def generate_aliases(entity):
    base = entity.lower().strip()
    return {
        base,
        f"{base} ltd",
        f"{base} limited",
        base.replace("securities", "sec"),
        base.split()[0]
    }

def extract_article(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        if article.text and len(article.text) >= MIN_BODY_LENGTH:
            return article.title or "", article.text
    except Exception:
        pass

    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(r.text, "lxml")

        title = soup.title.string.strip() if soup.title else ""

        paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        body = " ".join(paragraphs)
        if len(body) >= MIN_BODY_LENGTH:
            return title, body

        for script in soup.find_all("script", {"type": "application/ld+json"}):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if data.get("articleBody"):
                        return title, data["articleBody"]
            except Exception:
                continue

        return title, None
    except Exception:
        return None, None

def entity_mentioned(text, aliases):
    t = text.lower()
    return any(a in t for a in aliases)

def meaningful_context(text):
    t = text.lower()
    return any(k in t for k in ENTITY_KEYWORDS)

def is_blocked(text):
    t = text.lower()
    return any(b in t for b in BLOCK_TERMS)

def extract_key_sentences(text, aliases):
    if not text:
        return []
    sentences = re.split(r'[.!?]', text)
    return [
        s.strip()
        for s in sentences
        if any(a in s.lower() for a in aliases) and meaningful_context(s.lower())
    ]

def classify_article(title, body):
    text = (title + " " + (body or "")).lower()
    if "stocks to buy" in text or "top picks" in text:
        return "broker_recommendation"
    if any(k in text for k in ["rating", "target price", "upside", "coverage"]):
        return "broker_opinion"
    if any(k in text for k in ["says", "said", "according to", "as per"]):
        return "broker_quote"
    return "broker_mention"

def write_json(record):
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
        f.flush()

# ================= MONEYCONTROL LOGIC ================= #

def extract_moneycontrol_date(soup):
    span = soup.select_one("div.article_schedule span")
    if not span:
        return None
    try:
        return datetime.strptime(span.get_text(strip=True), "%B %d, %Y").date()
    except Exception:
        return None

def collect_moneycontrol_links():
    urls = set()
    for section in MONEYCONTROL_SECTIONS:
        for page in range(1, MONEYCONTROL_PAGES + 1):
            page_url = section if page == 1 else f"{section}page-{page}/"
            print(f"🔎 Moneycontrol: {page_url}")
            try:
                r = requests.get(page_url, headers=HEADERS, timeout=10)
                soup = BeautifulSoup(r.text, "lxml")
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if href.startswith("/"):
                        href = urljoin(section, href)
                    if re.match(r"^https://www\.moneycontrol\.com/.+-\d+\.html$", href):
                        urls.add(href)
            except Exception:
                continue
    return list(urls)

def process_moneycontrol(entity):
    aliases = generate_aliases(entity)
    today = datetime.now().date()

    urls = collect_moneycontrol_links()

    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            soup = BeautifulSoup(r.text, "lxml")

            publish_date = extract_moneycontrol_date(soup)
            if publish_date != today:
                continue

            title, body = extract_article(url)
            combined = (title or "") + " " + (body or "")

            if is_blocked(combined):
                continue
            if not entity_mentioned(combined, aliases):
                continue
            if not meaningful_context(combined):
                continue

            sentences = extract_key_sentences(body, aliases)
            if not sentences:
                sentences = extract_key_sentences(title, aliases)

            record = {
                "entity": entity,
                "headline": title,
                "publication": "Moneycontrol",
                "article_type": classify_article(title, body),
                "content_quality": "full_body" if body else "headline_only",
                "key_sentences": sentences[:3],
                "url": url,
                "collected_at": datetime.now(timezone.utc).isoformat()
            }

            write_json(record)
            print(f"✅ [Moneycontrol] {title}")
            time.sleep(REQUEST_DELAY)

        except Exception:
            continue

# ================= LIVEMINT ================= #

def collect_livemint_links():
    urls = []
    for page in range(1, LIVEMINT_PAGES + 1):
        page_url = LIVEMINT_SECTION if page == 1 else f"{LIVEMINT_SECTION}/page-{page}"
        print(f"🔎 LiveMint: {page_url}")
        try:
            r = requests.get(page_url, headers=HEADERS, timeout=10)
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.startswith("/market/stock-market-news/"):
                    full_url = urljoin(LIVEMINT_BASE, href)
                    if full_url not in urls:
                        urls.append(full_url)
        except Exception:
            continue
    return urls

# ================= GENERIC ================= #

def collect_generic_links():
    urls = []
    for _, page_url in GENERIC_SOURCES.items():
        try:
            r = requests.get(page_url, headers=HEADERS, timeout=10)
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.startswith("/"):
                    href = urljoin(page_url, href)
                if href.startswith("http") and href not in urls:
                    urls.append(href)
        except Exception:
            continue
    return urls[:MAX_GENERIC_ARTICLES]

def process_urls(entity, urls, publication):
    aliases = generate_aliases(entity)
    for url in urls:
        title, body = extract_article(url)
        if not title:
            continue

        combined = title + " " + (body or "")

        if is_blocked(combined):
            continue
        if not entity_mentioned(combined, aliases):
            continue
        if not meaningful_context(combined):
            continue

        sentences = extract_key_sentences(body, aliases)
        if not sentences:
            sentences = extract_key_sentences(title, aliases)

        record = {
            "entity": entity,
            "headline": title,
            "publication": publication,
            "article_type": classify_article(title, body),
            "content_quality": "full_body" if body else "headline_only",
            "key_sentences": sentences[:3],
            "url": url,
            "collected_at": datetime.now(timezone.utc).isoformat()
        }

        write_json(record)
        print(f"✅ [{publication}] {title}")
        time.sleep(REQUEST_DELAY)

# ================= MAIN ================= #

def run(entity):
    print(f"\n🚀 Entity Intelligence Run: {entity}\n")

    # 1️⃣ Moneycontrol (TODAY ONLY)
    process_moneycontrol(entity)

    # 2️⃣ LiveMint
    livemint_urls = collect_livemint_links()
    process_urls(entity, livemint_urls, "LiveMint")

    # 3️⃣ Other publications
    generic_urls = collect_generic_links()
    process_urls(entity, generic_urls, "Other")

    print("\n✅ Entity intelligence run complete")

# ================= RUN ================= #

if __name__ == "__main__":
    entity = input("Enter entity name: ").strip()
    run(entity)
