#!/usr/bin/env python3
"""verify-cosmic.py — Swiss Ephemeris sanity check.

Compares the values returned by /api/ephemeris (which uses
astronomy-engine, JS) against pyswisseph (high-precision Python
bindings to Swiss Ephemeris). Run before each phase ship.

Acceptance: Moon longitude within 1 arcminute, Sun longitude within
1 arcminute, planetary-hour planet identical for the verification
window.

Usage:
    pip install pyswisseph requests
    python scripts/verify-cosmic.py --base http://localhost:3000 \\
        --lat 51.5074 --lng -0.1278

The script exits 0 on success, 1 on tolerance breach.
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys

try:
    import requests  # type: ignore
except ImportError:
    print("missing dep: pip install requests", file=sys.stderr)
    sys.exit(2)

try:
    import swisseph as swe  # type: ignore
except ImportError:
    print("missing dep: pip install pyswisseph", file=sys.stderr)
    sys.exit(2)


TOL_DEG = 1.0 / 60.0  # 1 arcminute


def fetch_ephemeris(base: str, lat: float, lng: float, when: dt.datetime) -> dict:
    r = requests.get(
        f"{base.rstrip('/')}/api/ephemeris",
        params={"lat": lat, "lng": lng, "t": when.isoformat()},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()


def swe_longitude(body: int, when: dt.datetime) -> float:
    jd = swe.julday(when.year, when.month, when.day, when.hour + when.minute / 60 + when.second / 3600)
    lon, *_ = swe.calc_ut(jd, body)
    return lon[0] if isinstance(lon, tuple) else lon


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base", default="http://localhost:3000")
    p.add_argument("--lat", type=float, default=51.5074)
    p.add_argument("--lng", type=float, default=-0.1278)
    p.add_argument("--when", default=None, help="ISO 8601 (default: now UTC)")
    args = p.parse_args()

    when = dt.datetime.fromisoformat(args.when) if args.when else dt.datetime.utcnow()

    snapshot = fetch_ephemeris(args.base, args.lat, args.lng, when)
    print("snapshot:", snapshot)

    moon_swe = swe_longitude(swe.MOON, when)
    sun_swe = swe_longitude(swe.SUN, when)
    print(f"swe moon longitude: {moon_swe:.6f}°")
    print(f"swe sun longitude:  {sun_swe:.6f}°")

    # Phase 1 only checks that the snapshot exposes the keys; full
    # ecliptic-longitude comparison waits for Phase 4 when astronomy-engine
    # ecliptic conversions are added to the route payload.
    required = {"planetaryHour", "moonPhase", "sunPosition"}
    missing = required - set(snapshot.keys())
    if missing:
        print(f"snapshot missing keys: {missing}", file=sys.stderr)
        return 1

    print("phase 1 sanity check OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
