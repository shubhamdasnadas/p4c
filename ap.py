from email.utils import parsedate_to_datetime
import feedparser
import requests
from datetime import datetime, UTC, timedelta
from bs4 import BeautifulSoup  # ← NEW: add this for page scraping

# 🔧 CONFIG
API_TOKEN = "+"  # ← put your real token here
BASE_URL = "https://api.marketaux.com/v1/news/all"

def merge_and_deduplicate(api_news, scraped_news):
    seen = set()
    final = []
    for raw in api_news + scraped_news:
        item = normalize_item(raw)
        key = item.get("title", "").strip().lower()
        if key and key not in seen:
            seen.add(key)
            final.append(item)
    return final

def fetch_news_by_keyword(keyword, limit=30):
    yesterday = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")
    params = {
        "api_token": API_TOKEN,
        "search": keyword,
        "language": "en",
        "limit": limit,
        "published_after": yesterday,
        "sort": "published_desc",
        "must_have_entities": "true"
    }
    response = requests.get(BASE_URL, params=params, timeout=15)
    if response.status_code != 200:
        print("❌ API Error:", response.status_code, response.text)
        return []

    results = []
    for article in response.json().get("data", []):
        results.append({
            "title": article.get("title"),
            "source": article.get("source"),
            "published_at": article.get("published_at"),
            "url": article.get("url"),
            "description": article.get("description", ""),
            "snippet": article.get("snippet", "")
        })
    return results

def keyword_in_full_content(item, keyword="geojit financial services"):
    text = (
        item.get("title", "") + " " +
        item.get("description", "") + " " +
        item.get("snippet", "")
    ).lower()
    if keyword.lower() in text:
        return True

    # Fetch full page for strict content match
    try:
        r = requests.get(item.get("url"), timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200 and keyword.lower() in r.text.lower():
            return True
    except:
        pass
    return False

def is_today(date_str):
    try:
        parsed = parsedate_to_datetime(date_str)
        return parsed.date() == datetime.now(UTC).date()
    except:
        return False

def normalize_item(item):
    return {
        "title": item.get("title"),
        "source": item.get("source", "RSS"),
        "published_at": item.get("published_at") or item.get("published"),
        "url": item.get("url"),
        "description": item.get("description", ""),
        "snippet": item.get("snippet", "")
    }

def fetch_rss(url):
    feed = feedparser.parse(url)
    results = []
    for entry in feed.entries:
        published = entry.get("published", "") or entry.get("pubDate", "")
        if not is_today(published):
            continue
        results.append({
            "title": entry.title,
            "url": entry.link,
            "published": published
        })
    return results

# NEW: Scrape direct pages (home / section) for today's articles
def fetch_direct_page(url, keyword="geojit"):
    results = []
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, timeout=15, headers=headers)
        if r.status_code != 200:
            return results
        soup = BeautifulSoup(r.text, "html.parser")
        
        # Find all links (adjust selectors per site if needed)
        for a in soup.find_all("a", href=True):
            title = a.get_text(strip=True)
            link = a["href"]
            if not title or len(title) < 10:
                continue
            # Make absolute URL
            if link.startswith("/"):
                link = url.rstrip("/") + link
            elif not link.startswith("http"):
                continue
                
            # Quick check if title looks recent + contains keyword
            if keyword.lower() in (title + " " + link).lower():
                results.append({
                    "title": title,
                    "url": link,
                    "published": datetime.now(UTC).strftime("%a, %d %b %Y")
                })
    except:
        pass
    return results

if __name__ == "__main__":
    keyword = "geojit"   # ← you can change to "geojit financial services" if you want stricter

    print("Fetching news for 25 March 2026...")

    api_news = fetch_news_by_keyword(keyword, limit=30)

    scraped_news = []   # ← your custom scraper output goes here

    # RSS sources (fast & reliable)
    rss_sources = [
        "https://www.livemint.com/rss/markets",
        "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "https://www.business-standard.com/rss/markets-106.rss",
        "https://www.moneycontrol.com/rss/latestnews.xml",
        "https://www.business-standard.com/rss/brokerage-recommendations.rss",
        # Add any RSS you discover from the new sites
    ]

    rss_news = []
    for url in rss_sources:
        rss_news.extend(fetch_rss(url))

    # NEW direct page sources you requested
    direct_sources = [
        "https://www.whalesbook.com/",
        "https://lendennews.com/",
        "https://www.moneycontrol.com/",
        "https://flipit.money/",
        "https://investmentguruindia.com/",
        "https://www.msn.com/en-in/money/topstories",
        "https://www.business-standard.com/markets/news/",
        "https://www.buzinessbytes.com/business/"
    ]

    direct_news = []
    for url in direct_sources:
        direct_news.extend(fetch_direct_page(url, keyword))

    # Merge everything
    all_scraped = rss_news + direct_news + scraped_news
    final_news = merge_and_deduplicate(api_news, all_scraped)

    # STRICT FILTER: only keep where "geojit" appears in content
    final_news = [item for item in final_news if keyword_in_full_content(item, keyword)]

    print(f"\n✅ Found {len(final_news)} articles with '{keyword}' in the content on 25 Mar 2026\n")

    for i, item in enumerate(final_news, 1):
        print(f"📰 {i}. {item.get('title')}")
        print(f"   Source: {item.get('source', 'Direct/RSS')}")
        print(f"   Date: {item.get('published_at') or item.get('published', 'N/A')}")
        print(f"   Link: {item.get('url')}")
        print("-" * 90)