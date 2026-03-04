"""
Urban DNA Sequencer — FastAPI Backend
Layer 1: bbox → pre-computed data → JSON response
Layer 2 (future): bbox → BigQuery GEE → pipeline → JSON response

Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

import os
import sys
import json
import warnings
import time
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

warnings.filterwarnings("ignore")

# ── Path setup ────────────────────────────────────────────────────────────────
ROOT_DIR   = Path(__file__).resolve().parent.parent          # claude_project_Demo/
MODEL_PATH = ROOT_DIR / "apps" / "urban_dna_brain.pkl"

# Pre-computed data locations (drop CSV exports here)
DATA_DIRS = [
    ROOT_DIR / "outputs",
    ROOT_DIR / "urban-dna-frontend" / "public",
]

# ── App init ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Urban DNA Sequencer API",
    description=(
        "Morphological AI for informal settlement detection. "
        "Accepts bounding box queries and returns building cluster predictions."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow requests from Next.js dev server and any Vercel deploy
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "*",          # open for now; restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Load model once at startup ────────────────────────────────────────────────
_brain: Optional[dict] = None

def get_brain() -> dict:
    global _brain
    if _brain is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model not found: {MODEL_PATH}")
        _brain = joblib.load(MODEL_PATH)
    return _brain


def get_cluster_label_map() -> dict[int, str]:
    brain = get_brain()
    raw = brain["metadata"].get("cluster_label_map", {
        0: "Informal / High Risk",
        1: "Upgrading Zone",
        2: "Stable / Formal",
    })
    return {int(k): v for k, v in raw.items()}


RISK_SCORES = {
    "Informal / High Risk": 8,
    "Upgrading Zone":       4,
    "Stable / Formal":      1,
}


# ── Data loading helpers ──────────────────────────────────────────────────────

def _find_csv(city_slug: str) -> Optional[Path]:
    """
    Find a pre-computed results CSV for a city slug (e.g. 'kigali').
    Looks in outputs/ and urban-dna-frontend/public/.
    """
    patterns = [
        f"{city_slug}_results.csv",
        f"{city_slug}*.csv",
        "kigali_results.csv",   # fallback to Kigali if no city match
    ]
    for data_dir in DATA_DIRS:
        if not data_dir.exists():
            continue
        for pattern in patterns:
            matches = sorted(data_dir.glob(pattern))
            if matches:
                return matches[0]
    return None


def _load_city_data(city_slug: str) -> Optional[pd.DataFrame]:
    """Load pre-computed CSV for a city. Returns None if not found."""
    path = _find_csv(city_slug)
    if path is None:
        return None
    df = pd.read_csv(path)
    # Ensure required columns
    if "lat" not in df.columns or "lon" not in df.columns:
        return None
    return df


def _city_slug(name: str) -> str:
    """'Kigali, Rwanda' → 'kigali'"""
    return name.lower().split(",")[0].strip().replace(" ", "_")


def _filter_bbox(
    df: pd.DataFrame,
    min_lon: float, min_lat: float,
    max_lon: float, max_lat: float,
) -> pd.DataFrame:
    mask = (
        (df["lon"] >= min_lon) & (df["lon"] <= max_lon) &
        (df["lat"] >= min_lat) & (df["lat"] <= max_lat)
    )
    return df[mask].copy()


def _synth_inference(
    min_lon: float, min_lat: float,
    max_lon: float, max_lat: float,
    n: int = 600,
) -> pd.DataFrame:
    """
    Synthetic fallback: generate realistic building feature distributions
    classified by the real KMeans model when no pre-computed CSV exists.
    """
    brain      = get_brain()
    scaler     = brain["scaler"]
    km         = brain["kmeans_model"]
    label_map  = get_cluster_label_map()

    rng = np.random.default_rng(seed=int(abs(min_lat * 1e4 + min_lon * 1e3)) % (2**31))

    # Realistic building feature distributions (from Kigali training)
    n0, n1, n2 = int(n * 0.38), int(n * 0.42), n - int(n*0.38) - int(n*0.42)

    def _group(count, area_mu, area_sig, si_mu, si_sig, peri_scale):
        area  = rng.lognormal(np.log(area_mu), area_sig, count).clip(5, 5000)
        si    = rng.normal(si_mu, si_sig, count).clip(0.05, 0.99)
        perim = (4 * np.pi * area / si) ** 0.5 * peri_scale
        return area, perim, si

    a0,p0,s0 = _group(n0, 35,  0.6, 0.35, 0.12, 1.15)
    a1,p1,s1 = _group(n1, 80,  0.5, 0.52, 0.10, 1.05)
    a2,p2,s2 = _group(n2, 200, 0.7, 0.68, 0.09, 1.00)

    area_m2    = np.concatenate([a0, a1, a2])
    perim_m    = np.concatenate([p0, p1, p2])
    shape_idx  = np.concatenate([s0, s1, s2])
    area_log   = np.log1p(area_m2)

    lats = rng.uniform(min_lat, max_lat, n)
    lons = rng.uniform(min_lon, max_lon, n)

    X = np.column_stack([area_m2, perim_m, shape_idx, area_log])
    X_scaled   = scaler.transform(X)
    cluster_ids = km.predict(X_scaled).astype(int)

    df = pd.DataFrame({
        "lat":         lats,
        "lon":         lons,
        "cluster_id":  cluster_ids,
        "category":    [label_map.get(c, "Unknown") for c in cluster_ids],
        "area_m2":     area_m2.round(2),
        "perimeter_m": perim_m.round(2),
        "shape_index": shape_idx.round(4),
        "area_log":    area_log.round(4),
    })
    df["risk_score"] = df["category"].map(RISK_SCORES)
    return df


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class BBoxRequest(BaseModel):
    min_lon: float = Field(..., ge=-180, le=180, description="West boundary longitude")
    min_lat: float = Field(..., ge=-90,  le=90,  description="South boundary latitude")
    max_lon: float = Field(..., ge=-180, le=180, description="East boundary longitude")
    max_lat: float = Field(..., ge=-90,  le=90,  description="North boundary latitude")
    city:    str   = Field("kigali", description="City slug for pre-computed data lookup")
    max_points: int = Field(2000, ge=1, le=10000, description="Max buildings to return")

    @validator("max_lon")
    def max_lon_gt_min(cls, v, values):
        if "min_lon" in values and v <= values["min_lon"]:
            raise ValueError("max_lon must be > min_lon")
        return v

    @validator("max_lat")
    def max_lat_gt_min(cls, v, values):
        if "min_lat" in values and v <= values["min_lat"]:
            raise ValueError("max_lat must be > min_lat")
        return v


class AnalyzeResponse(BaseModel):
    city:         str
    total:        int
    source:       str        # "precomputed" | "synthetic"
    elapsed_ms:   float
    clusters:     dict       # {label: count}
    points:       list[dict]


class CompareRequest(BaseModel):
    roi_a: BBoxRequest
    roi_b: BBoxRequest


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    """Health check — confirms model is loaded."""
    try:
        brain = get_brain()
        km    = brain["kmeans_model"]
        return {
            "status":     "ok",
            "model":      "KMeans",
            "n_clusters": km.n_clusters,
            "inertia":    round(float(brain["metadata"].get("inertia", 0)), 1),
            "model_path": str(MODEL_PATH),
            "model_exists": MODEL_PATH.exists(),
        }
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: BBoxRequest):
    """
    Analyse buildings within a bounding box.

    Layer 1 behaviour:
    - Looks for a pre-computed CSV matching the city slug
    - If found and bbox overlaps → filters and returns real data
    - If not found → generates synthetic data classified by real KMeans model

    Layer 2 (future): replace _synth_inference with a BigQuery GEE lookup.
    """
    t0 = time.perf_counter()

    city_slug = _city_slug(req.city)
    source    = "precomputed"

    # Try pre-computed data first
    df = _load_city_data(city_slug)
    if df is not None:
        # Filter to bbox
        filtered = _filter_bbox(df, req.min_lon, req.min_lat, req.max_lon, req.max_lat)

        # If bbox returns very few points (outside coverage), fall back to synthetic
        if len(filtered) < 10:
            source   = "synthetic"
            filtered = _synth_inference(req.min_lon, req.min_lat, req.max_lon, req.max_lat)
        else:
            # Ensure category and risk_score columns exist
            label_map = get_cluster_label_map()
            if "category" not in filtered.columns:
                filtered["category"] = filtered["cluster_id"].map(label_map)
            if "risk_score" not in filtered.columns:
                filtered["risk_score"] = filtered["category"].map(RISK_SCORES)
    else:
        source   = "synthetic"
        filtered = _synth_inference(req.min_lon, req.min_lat, req.max_lon, req.max_lat)

    # Cap response size
    if len(filtered) > req.max_points:
        filtered = filtered.sample(req.max_points, random_state=42)

    # Cluster distribution summary
    clusters = (
        filtered["category"].value_counts().to_dict()
        if "category" in filtered.columns
        else {}
    )

    # Serialise points — only essential fields to keep payload small
    keep_cols = [c for c in [
        "lat", "lon", "cluster_id", "category", "risk_score",
        "area_m2", "perimeter_m", "shape_index",
    ] if c in filtered.columns]

    points = filtered[keep_cols].replace({np.nan: None}).to_dict(orient="records")

    elapsed = round((time.perf_counter() - t0) * 1000, 1)

    return AnalyzeResponse(
        city=city_slug,
        total=len(points),
        source=source,
        elapsed_ms=elapsed,
        clusters=clusters,
        points=points,
    )


@app.get("/api/cities")
async def list_cities():
    """List cities with pre-computed data available."""
    found = []
    for data_dir in DATA_DIRS:
        if not data_dir.exists():
            continue
        for csv_file in data_dir.glob("*_results.csv"):
            city = csv_file.name.replace("_results.csv", "")
            found.append({"city": city, "path": str(csv_file)})
    return {"available_cities": found, "fallback": "synthetic (any global bbox)"}


@app.post("/api/compare")
async def compare(req: CompareRequest):
    """
    Compare two bounding boxes side by side.
    Returns cluster distributions for ROI A and ROI B.
    """
    result_a = await analyze(req.roi_a)
    result_b = await analyze(req.roi_b)
    return {
        "roi_a": {"city": result_a.city, "total": result_a.total, "clusters": result_a.clusters},
        "roi_b": {"city": result_b.city, "total": result_b.total, "clusters": result_b.clusters},
        "comparison": {
            cat: {
                "roi_a_count": result_a.clusters.get(cat, 0),
                "roi_b_count": result_b.clusters.get(cat, 0),
            }
            for cat in ["Informal / High Risk", "Upgrading Zone", "Stable / Formal"]
        },
    }


@app.get("/api/export/{city}")
async def export_city(
    city: str,
    format: str = Query("csv", enum=["csv", "geojson"]),
):
    """
    Download pre-computed city data as CSV or GeoJSON.
    Example: GET /api/export/kigali?format=geojson
    """
    slug = _city_slug(city)
    df   = _load_city_data(slug)
    if df is None:
        raise HTTPException(status_code=404, detail=f"No pre-computed data for city: {slug}")

    if format == "csv":
        from fastapi.responses import StreamingResponse
        import io
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={slug}_results.csv"},
        )
    else:
        features = []
        for _, row in df.iterrows():
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [row.get("lon"), row.get("lat")]},
                "properties": {
                    k: (None if (isinstance(v, float) and np.isnan(v)) else v)
                    for k, v in row.items()
                    if k not in ("lat", "lon")
                },
            })
        return {"type": "FeatureCollection", "features": features}
