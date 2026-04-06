import requests
import csv
from datetime import datetime

API_KEY = "7f91b991-7387-4a82-a57d-6cfda3e42624"

URL = "https://api.brightdata.com/request"

ZONE = "web_unblocker1"

KEYWORD = "geojit"

PAGES = 5   # how many pages


headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


all_data = []


for page in range(PAGES):

    start = page * 10

    target_url = f"https://www.google.com/search?q={KEYWORD}&tbm=nws&start={start}"

    payload = {
        "zone": ZONE,
        "url": target_url,
        "format": "raw",
        "country": "in"
    }

    print("Fetching page", page + 1)

    r = requests.post(
        URL,
        json=payload,
        headers=headers
    )

    if r.status_code != 200:
        print(r.text)
        continue

    html = r.text

    all_data.append([page + 1, html])


# save CSV

file_name = f"geojit_news_{datetime.now().strftime('%Y%m%d')}.csv"

with open(file_name, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)

    writer.writerow(["page", "html"])

    writer.writerows(all_data)


print("Saved:", file_name)