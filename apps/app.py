"""
Urban DNA Sequencer — Vercel-level Dark SaaS Platform
Identifying High-Risk Informal Settlements through Morphological AI.
"""

import os
import streamlit as st
import pandas as pd
import numpy as np
import pydeck as pdk
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

# =============================================================================
# PAGE CONFIG — Must be first Streamlit command
# =============================================================================
st.set_page_config(
    page_title="Urban DNA Sequencer",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# =============================================================================
# CUSTOM CSS — Lovable Aesthetic: glassmorphism, neon borders, hide defaults
# =============================================================================
st.markdown(
    """
    <style>
    /* Hide Streamlit header and footer */
    #MainMenu { visibility: hidden; }
    header { visibility: hidden; }
    footer { visibility: hidden; }
    
    /* Remove default padding for full-bleed dashboard */
    .block-container {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
        padding-left: 2rem !important;
        padding-right: 2rem !important;
        max-width: 100% !important;
    }
    
    /* Glowing glassmorphism metric cards */
    div[data-testid="stMetric"] {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 1.5rem;
        border-radius: 16px;
        border: 1px solid rgba(248, 113, 113, 0.25);
        box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 0 24px rgba(248, 113, 113, 0.08);
    }
    
    div[data-testid="stMetric"]:nth-child(1) {
        border-color: rgba(148, 163, 184, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(148, 163, 184, 0.06);
    }
    
    div[data-testid="column"]:nth-child(2) div[data-testid="stMetric"] {
        border-color: rgba(248, 113, 113, 0.4);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 28px rgba(248, 113, 113, 0.12);
    }
    
    div[data-testid="column"]:nth-child(3) div[data-testid="stMetric"] {
        border-color: rgba(45, 212, 191, 0.4);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 28px rgba(45, 212, 191, 0.12);
    }
    
    div[data-testid="stMetric"] label {
        color: #94a3b8 !important;
        font-weight: 600 !important;
        letter-spacing: 0.02em;
    }
    
    div[data-testid="stMetric"] [data-testid="stMetricValue"] {
        font-size: 2.25rem !important;
        font-weight: 800 !important;
        color: #f8fafc !important;
    }
    
    /* Search bar container */
    .stTextInput > div > div > input {
        background: rgba(15, 23, 42, 0.8) !important;
        border: 1px solid rgba(148, 163, 184, 0.2) !important;
        color: #f8fafc !important;
        border-radius: 12px !important;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: rgba(45, 212, 191, 0.5) !important;
        box-shadow: 0 0 0 1px rgba(45, 212, 191, 0.2) !important;
    }
    
    /* Sidebar dark styling */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    }
    
    [data-testid="stSidebar"] .stSlider label {
        color: #94a3b8 !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# =============================================================================
# GEOCODING — Resolve place name to lat/lon
# =============================================================================
@st.cache_data(ttl=3600)
def geocode_place(query: str) -> tuple[float, float] | None:
    """Geocode a city or neighborhood string to (lat, lon) using Nominatim."""
    if not query or not query.strip():
        return None
    try:
        geolocator = Nominatim(user_agent="urban_dna_sequencer")
        location = geolocator.geocode(query.strip(), timeout=10)
        if location:
            return (location.latitude, location.longitude)
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        st.error(f"Geocoding failed: {e}")
    return None


# =============================================================================
# MOCK INFERENCE — Generate simulated building morphology data
# =============================================================================
def mock_inference(
    lat: float,
    lon: float,
    n_points: int = 1000,
    radius_deg: float = 0.01,
) -> pd.DataFrame:
    """
    Generate random scatter of buildings around coordinates.
    Categories: Informal/High Risk (Red), Upgrading (Teal), Stable (Gray).
    """
    np.random.seed(int(lat * 1000 + lon))
    # Random points in a circle around the center
    theta = np.random.uniform(0, 2 * np.pi, n_points)
    r = np.sqrt(np.random.uniform(0, 1, n_points)) * radius_deg
    lats = lat + r * np.cos(theta)
    lons = lon + r * np.sin(theta)
    # Assign categories: ~30% Red, ~40% Teal, ~30% Gray
    cat = np.random.choice(
        ["Informal/High Risk", "Upgrading", "Stable"],
        size=n_points,
        p=[0.3, 0.4, 0.3],
    )
    # Density proxy (1–10) for 3D column height
    density = np.random.uniform(1, 10, n_points)
    return pd.DataFrame({
        "lat": lats,
        "lon": lons,
        "category": cat,
        "density": density,
    })


# =============================================================================
# SESSION STATE — Persist search results
# =============================================================================
if "buildings" not in st.session_state:
    st.session_state.buildings = None
if "center" not in st.session_state:
    st.session_state.center = None

# =============================================================================
# HEADER
# =============================================================================
st.title("🧬 Urban DNA Sequencer")
st.markdown(
    '<p style="color: #64748b; font-size: 1.1rem; margin-top: -0.5rem;">Identifying High-Risk Informal Settlements through Morphological AI.</p>',
    unsafe_allow_html=True,
)

# =============================================================================
# GLOBAL SEARCH BAR
# =============================================================================
search_col, btn_col = st.columns([6, 1])
with search_col:
    search_query = st.text_input(
        "search",
        label_visibility="collapsed",
        placeholder="Enter a city or neighborhood (e.g., Kigali, Rwanda)",
        key="search_input",
    )
with btn_col:
    search_clicked = st.button("🔍 Search", use_container_width=True)

if search_clicked and search_query:
    with st.spinner("Extracting satellite morphology..."):
        coords = geocode_place(search_query)
        if coords:
            lat, lon = coords
            st.session_state.buildings = mock_inference(lat, lon)
            st.session_state.center = (lat, lon)
            st.rerun()
        else:
            st.error(f"Could not find location: {search_query}")

# =============================================================================
# SIDEBAR — Control Panel
# =============================================================================
with st.sidebar:
    st.header("⚙️ Control Panel")
    slope_threshold = st.slider(
        "Slope Risk Threshold (Degrees)",
        min_value=0,
        max_value=45,
        value=15,
        step=1,
    )
    density_threshold = st.slider(
        "Density Threshold",
        min_value=1,
        max_value=10,
        value=5,
        step=1,
        help="Minimum density for high-density areas.",
    )
    st.markdown("---")
    st.caption("Urban DNA Sequencer • Morphological AI")

# =============================================================================
# KPI ANALYTICS — Overlay above map
# =============================================================================
df = st.session_state.buildings

if df is not None:
    total = len(df)
    at_risk = int((df["category"] == "Informal/High Risk").sum())
    safe = int((df["category"] == "Upgrading").sum()) + int(
        (df["category"] == "Stable").sum()
    )
else:
    total = at_risk = safe = 0

col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Total Buildings Analyzed", f"{total:,}")
with col2:
    st.metric("Families at Risk (Red)", f"{at_risk:,}")
with col3:
    st.metric("Safe for Upgrade", f"{safe:,}")

# =============================================================================
# 3D PYDECK MAP
# =============================================================================
if df is not None and st.session_state.center is not None:
    lat, lon = st.session_state.center
    # Build separate layers by category for correct colors
    red_df = df[df["category"] == "Informal/High Risk"]
    teal_df = df[df["category"] == "Upgrading"]
    gray_df = df[df["category"] == "Stable"]

    # Layer config: subtle extrusions, wide columns, glowing glass transparency
    layers = []
    if len(red_df) > 0:
        layers.append(
            pdk.Layer(
                "ColumnLayer",
                data=red_df,
                get_position=["lon", "lat"],
                get_elevation="density",
                elevation_scale=3,
                radius=50,
                get_fill_color=[248, 113, 113, 130],
                pickable=True,
                auto_highlight=True,
            )
        )
    if len(teal_df) > 0:
        layers.append(
            pdk.Layer(
                "ColumnLayer",
                data=teal_df,
                get_position=["lon", "lat"],
                get_elevation="density",
                elevation_scale=3,
                radius=50,
                get_fill_color=[45, 212, 191, 130],
                pickable=True,
                auto_highlight=True,
            )
        )
    if len(gray_df) > 0:
        layers.append(
            pdk.Layer(
                "ColumnLayer",
                data=gray_df,
                get_position=["lon", "lat"],
                get_elevation="density",
                elevation_scale=3,
                radius=50,
                get_fill_color=[107, 114, 128, 130],
                pickable=True,
                auto_highlight=True,
            )
        )

    view_state = pdk.ViewState(
        latitude=lat,
        longitude=lon,
        zoom=15,
        pitch=45,
        bearing=0,
    )

    # Use Mapbox dark if token set; else light (roads/terrain visible)
    map_style = "mapbox://styles/mapbox/dark-v11" if os.getenv("MAPBOX_ACCESS_TOKEN") else "light"

    deck = pdk.Deck(
        layers=layers,
        initial_view_state=view_state,
        map_style=map_style,
        tooltip={
            "html": "<b>{category}</b><br/>Density: {density}",
            "style": {"background": "#1e293b", "color": "#f8fafc"},
        },
    )

    st.pydeck_chart(deck, use_container_width=True, height=600)
else:
    st.markdown(
        """
        <div style="
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
            border: 1px dashed rgba(148, 163, 184, 0.3);
            border-radius: 16px;
            padding: 4rem;
            text-align: center;
            color: #64748b;
            font-size: 1.1rem;
        ">
            🔍 Search for a city or neighborhood above to visualize morphological analysis
        </div>
        """,
        unsafe_allow_html=True,
    )
