import requests
import json
import time
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
from dateutil import parser as date_parser
import pytz

# ================= CONFIG ================= #

ENTITY_NAME = "ICICI Securities"
ENTITY_REGEX = re.compile(r"\bicici\s+securities\b", re.IGNORECASE)

REQUEST_DELAY = 0.3
MIN_TEXT_LENGTH = 150
MAX_MONEYCONTROL_PAGES = 3

OUTPUT_FILE = "entity_today_results.jsonl"

IST = pytz.timezone("Asia/Kolkata")
TODAY_IST = datetime.now(IST).date()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/"
}

# ================= YOUR PROVIDED URLS ================= #

STRICT_LISTING_URLS = [
    "https://bharathorizon.com/",
    "https://yournews.co.in/category/business",
    "https://www.businesstoday.in/markets",
    "https://www.msn.com/en-in/money",
    "https://topnews.in/business-news/stock-markets",
    "https://economictimes.indiatimes.com/markets/stocks/news",
    "https://bfsi.economictimes.indiatimes.com/articles",
    "https://www.ndtvprofit.com/markets/",
    "https://zeenewsworld.com/business",
    "https://www.business-standard.com/markets/news",
]

MONEYCONTROL_BASE = "https://www.moneycontrol.com/news/business/markets/"

visited_urls = set()

# ================= URL FILTER ================= #

def looks_like_article(url):
    if "share-price" in url.lower():
        return False

    return bool(re.search(r"-\d{6,}(_\d+)?\.html$", url)) or \
           bool(re.search(r"/articleshow/\d{6,}\.cms$", url))

# ================= DATE EXTRACTION ================= #

def extract_publish_date(soup):
    # JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and "datePublished" in data:
                return date_parser.parse(data["datePublished"])
        except:
            continue

    # Standard meta
    meta = soup.find("meta", {"property": "article:published_time"})
    if meta and meta.get("content"):
        return date_parser.parse(meta["content"])

    # Business Standard fallback
    meta2 = soup.find("meta", {"itemprop": "datePublished"})
    if meta2 and meta2.get("content"):
        return date_parser.parse(meta2["content"])

    # Time tag
    time_tag = soup.find("time")
    if time_tag:
        try:
            if time_tag.get("datetime"):
                return date_parser.parse(time_tag["datetime"])
            else:
                return date_parser.parse(time_tag.get_text())
        except:
            pass

    return None

# ================= PROCESS ARTICLE ================= #

def process_article(url, listing_domain):

    print(f"\n🔎 CHECKING: {url}")

    if url in visited_urls:
        print("⛔ Already visited")
        return

    visited_urls.add(url)

    parsed = urlparse(url)

    # Domain enforcement
    if parsed.netloc != listing_domain:
        print(f"⛔ Domain mismatch ({parsed.netloc} != {listing_domain})")
        return
    else:
        print("✔ Domain OK")

    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        publish_date = extract_publish_date(soup)

        if publish_date:
            publish_date_ist = publish_date.astimezone(IST).date()
            print(f"🕒 Publish Date: {publish_date_ist}")

            if publish_date_ist != TODAY_IST:
                print("⛔ SKIP — Not Today")
                return
            else:
                print("✔ Today Match")
        else:
            print("⚠ No publish date found — allowing")

        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()

        full_text = soup.get_text(" ", strip=True)

        if not ENTITY_REGEX.search(full_text):
            print("⛔ SKIP — Entity not found")
            return
        else:
            print("✔ Entity Found")

        record = {
            "entity": ENTITY_NAME,
            "url": url,
            "publish_date": publish_date.isoformat() if publish_date else None,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "text_preview": full_text[:500]
        }

        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        print("✅ SAVED")

        time.sleep(REQUEST_DELAY)

    except Exception as e:
        print(f"⚠ Article Error: {e}")

# ================= LISTING SCAN ================= #

def scan_listing(listing_url):

    print(f"\n📄 Scanning listing: {listing_url}")

    listing_domain = urlparse(listing_url).netloc

    try:
        r = requests.get(listing_url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        for a in soup.find_all("a", href=True):

            href = a["href"].strip()
            href = urljoin(listing_url, href)
            href, _ = urldefrag(href)

            if not looks_like_article(href):
                continue

            print(f"➡ Candidate: {href}")

            process_article(href, listing_domain)

    except Exception as e:
        print(f"⚠ Listing Error: {e}")

# ================= MAIN ================= #

def run():
    print("\n🚀 FULL DEBUG SCRAPER STARTED\n")

    with open(OUTPUT_FILE, "w", encoding="utf-8"):
        pass

    # Moneycontrol pagination
    for page in range(1, MAX_MONEYCONTROL_PAGES + 1):
        page_url = MONEYCONTROL_BASE if page == 1 else f"{MONEYCONTROL_BASE}page-{page}/"
        scan_listing(page_url)

    # Other strict URLs
    for listing in STRICT_LISTING_URLS:
        scan_listing(listing)

    print("\n✅ DEBUG RUN COMPLETE")

if __name__ == "__main__":
    run()
