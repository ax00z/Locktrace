#!/usr/bin/env python3
"""
Scrapes Toronto Police ArcGIS endpoints for auto and bike theft data,
cleans it, and writes JSON to public/data/ for the frontend.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta, timezone

ENDPOINTS = {
    "auto": (
        "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/"
        "Auto_Theft_Open_Data/FeatureServer/0/query"
    ),
    "bike": (
        "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/"
        "Bicycle_Thefts_Open_Data/FeatureServer/0/query"
    ),
}

TIME_WINDOW_MONTHS = 6
PAGE_SIZE = 2000
OUTPUT_DIR = os.path.join("public", "data")
MAX_RETRIES = 3
RETRY_DELAY = 5
TIMEOUT = 60

FIELD_MAP = {
    "id":            ["EVENT_UNIQUE_ID", "OBJECTID"],
    "date":          ["OCC_DATE", "REPORT_DATE"],
    "year":          ["OCC_YEAR"],
    "month":         ["OCC_MONTH"],
    "day":           ["OCC_DAY", "OCC_DOW"],
    "hour":          ["OCC_HOUR"],
    "neighbourhood": ["NEIGHBOURHOOD_158", "NEIGHBOURHOOD_140", "HOOD_158", "NEIGHBOURHOOD"],
    "premise":       ["PREMISES_TYPE", "PREMISE_TYPE"],
    "lat":           ["LAT_WGS84", "Y"],
    "lng":           ["LONG_WGS84", "X"],
    "status":        ["STATUS"],
}

MONTH_NAMES = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
}


def now_utc():
    return datetime.now(timezone.utc)


def http_get(url, params):
    full_url = f"{url}?{urllib.parse.urlencode(params)}"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(full_url, headers={
                "User-Agent": "TorontoRadar/2.0",
                "Accept": "application/json",
            })
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if "error" in data:
                    code = data["error"].get("code", "?")
                    msg = data["error"].get("message", "Unknown")
                    raise RuntimeError(f"ArcGIS {code}: {msg}")
                return data
        except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, OSError) as e:
            print(f"  Attempt {attempt}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
            else:
                raise


def discover_fields(url):
    try:
        data = http_get(url, {"where": "1=1", "outFields": "*", "f": "json", "resultRecordCount": "1", "resultOffset": "0"})
        features = data.get("features", [])
        if features:
            return list(features[0].get("attributes", {}).keys())
        return [f["name"] for f in data.get("fields", [])]
    except Exception as e:
        print(f"  Field discovery failed: {e}")
        return []


def build_where_clauses(available_fields):
    cutoff = now_utc() - timedelta(days=TIME_WINDOW_MONTHS * 30)
    clauses = []

    if "OCC_YEAR" in available_fields:
        clauses.append((f"OCC_YEAR >= '{cutoff.year}'", f"year >= {cutoff.year}"))
    if "OCC_DATE" in available_fields:
        ms = int(cutoff.timestamp() * 1000)
        clauses.append((f"OCC_DATE >= {ms}", "OCC_DATE epoch"))
    if "REPORT_DATE" in available_fields:
        ms = int(cutoff.timestamp() * 1000)
        clauses.append((f"REPORT_DATE >= {ms}", "REPORT_DATE epoch"))

    clauses.append(("1=1", "unfiltered"))
    return clauses


def fetch_features(url, theft_type):
    print(f"\n  Fetching {theft_type} thefts...")

    available = discover_fields(url)
    if available:
        print(f"  Found {len(available)} fields")
    else:
        available = ["OCC_YEAR", "OCC_DATE", "REPORT_DATE"]

    for where, label in build_where_clauses(available):
        print(f"  Trying: {label}")
        features = []
        offset = 0

        try:
            while True:
                params = {
                    "where": where, "outFields": "*", "outSR": "4326", "f": "json",
                    "resultRecordCount": str(PAGE_SIZE), "resultOffset": str(offset),
                }
                page = offset // PAGE_SIZE + 1
                print(f"    Page {page} (offset={offset})...", end=" ", flush=True)
                data = http_get(url, params)
                batch = data.get("features", [])
                print(f"{len(batch)} records")

                if not batch:
                    break

                features.extend(batch)
                offset += PAGE_SIZE

                if len(features) >= 100_000:
                    print("    Hit 100k limit, stopping")
                    break
                if not data.get("exceededTransferLimit", False) and len(batch) < PAGE_SIZE:
                    break

            if features:
                print(f"  Got {len(features)} features via {label}")
                break
        except Exception as e:
            print(f"\n  {label} failed: {e}")
            continue
    else:
        print(f"  All strategies failed for {theft_type}")
        return []

    def sort_key(f):
        a = f.get("attributes", {})
        d = a.get("OCC_DATE") or a.get("REPORT_DATE")
        if isinstance(d, (int, float)) and d > 1_000_000_000:
            return -d
        y = a.get("OCC_YEAR", 0) or 0
        m = a.get("OCC_MONTH", "")
        if isinstance(m, str):
            m = MONTH_NAMES.get(m, 0)
        return -(y * 10000 + int(m or 0) * 100 + int(a.get("OCC_DAY", 0) or 0))

    features.sort(key=sort_key)
    return features


def first_of(attrs, keys, default=None):
    for k in keys:
        v = attrs.get(k)
        if v is not None:
            return v
    return default


def parse_month(raw):
    if isinstance(raw, (int, float)):
        return int(raw)
    if isinstance(raw, str):
        return MONTH_NAMES.get(raw, 1)
    return 1


def parse_date(raw, year, month, day):
    if isinstance(raw, (int, float)) and raw > 1_000_000_000:
        try:
            return datetime.fromtimestamp(raw / 1000.0, tz=timezone.utc).strftime("%Y-%m-%d")
        except (OSError, ValueError):
            pass
    if isinstance(raw, str) and len(raw) >= 10:
        return raw[:10]
    try:
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    except (TypeError, ValueError):
        return f"{now_utc().year}-01-01"


def process(raw_features, theft_type):
    records = []
    bad_coords = 0

    for f in raw_features:
        attrs = f.get("attributes", {})
        geom = f.get("geometry", {})

        lat = geom.get("y") if geom else None
        lng = geom.get("x") if geom else None
        if lat is None or lng is None:
            lat = first_of(attrs, FIELD_MAP["lat"])
            lng = first_of(attrs, FIELD_MAP["lng"])

        try:
            lat = float(lat) if lat is not None else 0.0
            lng = float(lng) if lng is not None else 0.0
        except (TypeError, ValueError):
            lat, lng = 0.0, 0.0

        if (lat == 0 and lng == 0) or not (41 <= lat <= 57 and -95 <= lng <= -73):
            bad_coords += 1
            continue

        year = first_of(attrs, FIELD_MAP["year"], now_utc().year)
        raw_month = first_of(attrs, FIELD_MAP["month"], 1)
        month = parse_month(raw_month)
        day = first_of(attrs, FIELD_MAP["day"], 1)
        hour = first_of(attrs, FIELD_MAP["hour"], 12)

        raw_date = first_of(attrs, FIELD_MAP["date"], "")
        date_str = parse_date(raw_date, year, month, day)

        records.append({
            "id": f"{theft_type}-{first_of(attrs, FIELD_MAP['id'], str(len(records)))}",
            "type": theft_type,
            "date": date_str,
            "year": int(year) if year else now_utc().year,
            "month": month,
            "day": int(day) if day else 1,
            "hour": int(hour) if hour else 0,
            "neighbourhood": str(first_of(attrs, FIELD_MAP["neighbourhood"], "Unknown")).strip(),
            "premiseType": str(first_of(attrs, FIELD_MAP["premise"], "Unknown")).strip(),
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "status": str(first_of(attrs, ["STATUS"], "Unknown")).strip(),
        })

    records = trim_to_window(records)
    print(f"  {len(records)} valid, {bad_coords} bad coords")
    return records


def trim_to_window(records):
    if not records:
        return records
    latest_ym = max(r["year"] * 100 + r["month"] for r in records)
    latest_year = latest_ym // 100
    latest_month = latest_ym % 100
    cutoff = datetime(latest_year, latest_month, 1) - timedelta(days=TIME_WINDOW_MONTHS * 30)
    cutoff_ym = cutoff.year * 100 + cutoff.month
    trimmed = [r for r in records if r["year"] * 100 + r["month"] >= cutoff_ym]
    print(f"  Window: {cutoff.year}-{cutoff.month:02d} to {latest_year}-{latest_month:02d} ({len(records) - len(trimmed)} records outside window)")
    return trimmed


def save(records, filename):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))
    kb = os.path.getsize(path) / 1024
    print(f"  Saved {len(records)} records to {path} ({kb:.1f} KB)")


def main():
    print(f"Toronto Radar scraper — {now_utc().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"Window: {TIME_WINDOW_MONTHS} months | Output: {os.path.abspath(OUTPUT_DIR)}")

    start = time.time()
    total = 0

    for theft_type, url in ENDPOINTS.items():
        filename = f"{theft_type}_thefts.json"
        try:
            raw = fetch_features(url, theft_type)
            clean = process(raw, theft_type)
            save(clean, filename)
            total += len(clean)
        except Exception as e:
            print(f"\n  Fatal error for {theft_type}: {e}")
            save([], filename)

    elapsed = time.time() - start
    print(f"\nDone: {total:,} records in {elapsed:.1f}s")

    if total == 0:
        print("Warning: zero records saved. API may be down.")
        sys.exit(1)


if __name__ == "__main__":
    sys.exit(main() or 0)
