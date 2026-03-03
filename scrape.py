#!/usr/bin/env python3
import json
import os
import time
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

LIVE_API = (
    "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/"
    "C4S_Public/FeatureServer/0/query"
)
AUTO_API = (
    "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/"
    "Auto_Theft_Open_Data/FeatureServer/0/query"
)
BIKE_API = (
    "https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/"
    "Bicycle_Thefts_Open_Data/FeatureServer/0/query"
)

DATA_FILE = "public/data/locktrace_live.json"
MAX_HISTORY_DAYS = 90


def fetch_features(url, where="1=1", page_size=2000):
    all_features = []
    offset = 0
    while True:
        params = urllib.parse.urlencode({
            "where": where,
            "outFields": "*",
            "outSR": "4326",
            "f": "json",
            "resultRecordCount": str(page_size),
            "resultOffset": str(offset),
        })
        try:
            req = urllib.request.Request(
                f"{url}?{params}",
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
            if "error" in data:
                print(f"  API error: {data['error'].get('message', 'unknown')}")
                break
            batch = data.get("features", [])
            if not batch:
                break
            all_features.extend(batch)
            offset += page_size
            if not data.get("exceededTransferLimit", False) and len(batch) < page_size:
                break
            if offset >= page_size * 50:
                break
        except Exception as e:
            print(f"  Fetch error {url}: {e}")
            break
    return all_features


def parse_record(feature, explicit_type=None):
    attr = feature.get("attributes", {})
    geom = feature.get("geometry", {})

    lat = geom.get("y") or attr.get("LAT_WGS84") or attr.get("Y") or 0
    lng = geom.get("x") or attr.get("LONG_WGS84") or attr.get("X") or 0
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        return None
    if lat == 0 or not (41 <= lat <= 57 and -95 <= lng <= -73):
        return None

    call_type = str(
        attr.get("TYPE") or attr.get("EVENT_TYPE") or
        attr.get("CALL_TYPE") or attr.get("PREMISES_TYPE") or ""
    ).upper()

    if explicit_type:
        theft_type = explicit_type
    else:
        is_auto = any(k in call_type for k in ["AUTO", "VEHICLE", "CAR"])
        is_bike = any(k in call_type for k in ["BIKE", "BICYCLE"])
        if is_auto:
            theft_type = "auto"
        elif is_bike:
            theft_type = "bike"
        else:
            return None

    raw_date = (
        attr.get("OCC_DATE") or attr.get("REPORT_DATE") or
        attr.get("DATE") or int(time.time() * 1000)
    )
    if isinstance(raw_date, (int, float)) and raw_date > 1_000_000_000:
        dt = datetime.fromtimestamp(raw_date / 1000.0)
    elif isinstance(raw_date, str) and len(raw_date) >= 10:
        try:
            dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
        except Exception:
            dt = datetime.now()
    else:
        dt = datetime.now()

    obj_id = attr.get("EVENT_UNIQUE_ID") or attr.get("OBJECTID") or f"{theft_type}-{int(time.time()*1000)}"

    return {
        "id": f"{theft_type}-{obj_id}",
        "type": theft_type,
        "date": dt.strftime("%Y-%m-%d"),
        "year": dt.year,
        "month": dt.month,
        "day": dt.day,
        "hour": dt.hour,
        "neighbourhood": str(
            attr.get("NEIGHBOURHOOD_158") or attr.get("NEIGHBOURHOOD_140") or
            attr.get("HOOD_158") or attr.get("DIVISION") or "Unknown"
        ).strip(),
        "premiseType": str(
            attr.get("PREMISES_TYPE") or attr.get("PREMISE_TYPE") or call_type or "Unknown"
        ).strip(),
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "status": "ACTIVE DISPATCH" if not explicit_type else str(attr.get("STATUS") or "Unknown").strip(),
    }


def main():
    print(f"Locktrace Ingestion — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    new_records = []

    live_features = fetch_features(LIVE_API)
    if live_features:
        print(f"Live feed online: {len(live_features)} dispatches")
        for f in live_features:
            rec = parse_record(f)
            if rec:
                new_records.append(rec)
    else:
        print("Live feed restricted — falling back to historical datasets")
        year = datetime.now().year
        # OCC_YEAR is a string field in the ArcGIS schema — quotes required
        for f in fetch_features(AUTO_API, f"OCC_YEAR >= '{year - 1}'"):
            rec = parse_record(f, "auto")
            if rec:
                new_records.append(rec)
        for f in fetch_features(BIKE_API, f"OCC_YEAR >= '{year - 1}'"):
            rec = parse_record(f, "bike")
            if rec:
                new_records.append(rec)

    print(f"Extracted {len(new_records)} targets")

    history = {}
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as fh:
                for r in json.load(fh):
                    history[r["id"]] = r
        except Exception as e:
            print(f"  Could not load existing database: {e}")

    for r in new_records:
        history[r["id"]] = r

    cutoff_str = (datetime.now() - timedelta(days=MAX_HISTORY_DAYS)).strftime("%Y-%m-%d")
    final_list = [r for r in history.values() if r["date"] >= cutoff_str]
    final_list.sort(key=lambda x: (x["date"], x["hour"]), reverse=True)

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as fh:
        json.dump(final_list, fh, ensure_ascii=False, separators=(",", ":"))

    print(f"Database updated: {len(final_list)} records")

    if not final_list:
        print("Warning: zero records — API may be down")
        import sys
        sys.exit(1)


if __name__ == "__main__":
    main()
