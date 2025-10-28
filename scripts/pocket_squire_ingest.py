#!/usr/bin/env python3
"""Pocket Squire ingest utility.

Fetches CC-BY data from Open5e and optionally mirrors D&D Wiki
content (with light license metadata capture). Data is stored under
`ddb_ingest_out/` with HTTP caching to reduce load on upstream sites.
"""

import hashlib
import json
import os
import time
from pathlib import Path
from urllib.parse import urljoin

import html2text
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

OUT = Path("ddb_ingest_out")
OUT.mkdir(exist_ok=True)
CACHE = OUT / "http_cache"
CACHE.mkdir(exist_ok=True)

USER_AGENT = "PocketSquireBot/1.0 (+educational; respects robots; contact: your-email@example.com)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

# -----------------------------
# 1) OPEN, LICENSE-CLEAN SOURCES
# -----------------------------

OPEN5E_BASE = "https://api.open5e.com/"

OPEN5E_ENDPOINTS = {
    # These map well to your “rules, spells, races, feats, backgrounds, etc.”
    "spells": "spells/",
    "races": "races/",
    "backgrounds": "backgrounds/",
    "feats": "feats/",
    "sections": "sections/",  # rules chapters / SRD text
    # You can add monsters, conditions, planes, etc. as needed.
}


def fetch_open5e_collection(slug, endpoint):
    """Fetch a paginated Open5e endpoint and cache the JSON locally."""

    url = urljoin(OPEN5E_BASE, endpoint)
    results = []
    while url:
        response = SESSION.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        results.extend(data.get("results", []))
        url = data.get("next")

    (OUT / f"open5e_{slug}.json").write_text(
        json.dumps(results, indent=2),
        encoding="utf-8",
    )
    return results


def ingest_open5e_all():
    """Download all configured Open5e endpoints."""

    bundles = {}
    for name, endpoint in OPEN5E_ENDPOINTS.items():
        print(f"[Open5e] Fetching {name}…")
        bundles[name] = fetch_open5e_collection(name, endpoint)
    return bundles


# -----------------------------
# 2) OPTIONAL: D&D WIKI SCRAPER
# -----------------------------
# WARNING: Mixed homebrew & mixed licenses. Capture license text per page.
# Crawl slowly and respect robots.txt (manually inspect their policy before use).

WIKI_BASE = "https://www.dandwiki.com"
WIKI_CATEGORY_PAGES = {
    "spells": "/wiki/5e_Spells",
    "races": "/wiki/5e_Races",
    "feats": "/wiki/5e_Feats",
    "backgrounds": "/wiki/5e_Backgrounds",
    # Add classes or subclasses if you need them, but expect heavier variance.
}

REQUEST_DELAY = 2.0  # seconds between requests (be gentle)


def cache_key(url):
    return CACHE / hashlib.sha256(url.encode("utf-8")).hexdigest()


def get_cached(url):
    key = cache_key(url)
    if key.exists():
        with key.open("rb") as handle:
            return handle.read()
    return None


def save_cache(url, content):
    key = cache_key(url)
    with key.open("wb") as handle:
        handle.write(content)


def polite_get(url):
    cached = get_cached(url)
    if cached:
        return cached

    time.sleep(REQUEST_DELAY)
    response = SESSION.get(url, timeout=30)
    response.raise_for_status()
    content = response.content
    save_cache(url, content)
    return content


def extract_license_block(soup: BeautifulSoup):
    """Capture lightweight license hints from a wiki page."""

    footer = soup.find(id="footer") or soup.find("div", {"class": "printfooter"})
    text = soup.get_text(" ", strip=True)
    copyright_links = []
    for anchor in soup.find_all("a", href=True):
        if (
            "Copyright" in anchor.get_text()
            or "copyright" in anchor.get_text()
            or "D%26D_Wiki%3ACopyrights" in anchor["href"]
        ):
            copyright_links.append(urljoin(WIKI_BASE, anchor["href"]))
    return {
        "footer_present": bool(footer),
        "copyright_links": sorted(set(copyright_links)),
        "notice_snippet": text[-600:],  # end of page often contains license notes
    }


def parse_wiki_page(url):
    """Convert a D&D Wiki article to markdown with license metadata."""

    html = polite_get(url).decode("utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")

    title = soup.find(id="firstHeading")
    title_text = title.get_text(strip=True) if title else url

    content = soup.find(id="mw-content-text")
    html_text = str(content) if content else html

    md = html2text.HTML2Text()
    md.ignore_links = False
    md.ignore_images = True
    body_md = md.handle(html_text)

    license_meta = extract_license_block(soup)
    return {
        "url": url,
        "title": title_text,
        "body_markdown": body_md,
        "license_meta": license_meta,
    }


def collect_category_targets(category_url, max_links=1000):
    html = polite_get(
        category_url if category_url.startswith("http") else urljoin(WIKI_BASE, category_url)
    ).decode("utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")
    targets = []
    for anchor in soup.select("#mw-content-text a[href]"):
        href = anchor["href"]
        if not href.startswith("/wiki/"):
            continue
        if any(segment in href.lower() for segment in (":talk", "special:", "help:", "user:", "file:", "category:")):
            continue
        targets.append(urljoin(WIKI_BASE, href))
    targets = sorted(set(targets))
    return targets[:max_links]


def scrape_wiki_categories(selected=("spells", "races", "feats", "backgrounds"), per_category_limit=300):
    os.makedirs(OUT / "wiki", exist_ok=True)
    for key in selected:
        category = WIKI_CATEGORY_PAGES[key]
        print(f"[Wiki] Listing {key} at {category}")
        links = collect_category_targets(category, max_links=per_category_limit)
        rows = []
        for url in tqdm(links, desc=f"Scraping {key}"):
            try:
                rows.append(parse_wiki_page(url))
            except Exception as exc:  # pragma: no cover - best effort logging
                rows.append({"url": url, "error": str(exc)})
        (OUT / "wiki" / f"{key}.json").write_text(
            json.dumps(rows, indent=2),
            encoding="utf-8",
        )


if __name__ == "__main__":
    # 1) Always ingest Open5e first (fast, structured, CC-BY)
    ingest_open5e_all()

    # 2) Toggle wiki scraping if you truly need it (uncomment to run)
    # scrape_wiki_categories(
    #     selected=("spells", "races", "feats", "backgrounds"),
    #     per_category_limit=250,
    # )

    print("\nDone. Outputs in:", OUT.resolve())
