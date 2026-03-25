"""
generate_map.py — Publication-ready thematic spatial map (Figure 5)

Generates: paper/figures/fig5_spatial_clusters_map.png

It loads:
  - kanombe_buildings.geojson (polygons)
  - kanombe_clustered_final.csv (cluster_id + category)

Then merges on a stable identifier:
  - prefers `full_plus_code` when available
  - falls back to row index alignment if necessary
"""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Patch  # noqa: E402

import geopandas as gpd  # noqa: E402
import pandas as pd  # noqa: E402


PALETTE = {
    "Informal/High Risk": "#b5523b",  # deep muted terracotta brick red
    "Planned Residential": "#3577b5",  # steel blue
    "Stable/Formal Infrastructure": "#d8b84a",  # muted gold mustard
}


def _pick_join_key(geo_gdf: gpd.GeoDataFrame, feat_df: pd.DataFrame) -> str | None:
    for key in ["full_plus_code", "building_id", "id"]:
        if key in geo_gdf.columns and key in feat_df.columns:
            return key
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Figure 5 spatial clusters map")
    parser.add_argument("--geojson", default="kanombe_buildings.geojson")
    parser.add_argument("--csv", default="kanombe_clustered_final.csv")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    geo_path = repo_root / args.geojson
    csv_path = repo_root / args.csv
    out_dir = repo_root / "paper" / "figures"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "fig5_spatial_clusters_map.png"

    if not geo_path.exists():
        raise FileNotFoundError(f"Missing GeoJSON: {geo_path}")
    if not csv_path.exists():
        raise FileNotFoundError(f"Missing clustered CSV: {csv_path}")

    geo_gdf = gpd.read_file(geo_path)
    feat_df = pd.read_csv(csv_path)

    join_key = _pick_join_key(geo_gdf, feat_df)
    if join_key is None:
        # Last resort: assume the dataframe row order matches. This is weaker,
        # but it preserves the requirement of linking geometry to cluster_id/category.
        # We do this only if no shared identifier exists.
        merged = geo_gdf.copy()
        # If lengths differ, inner-trim.
        n = min(len(merged), len(feat_df))
        merged = merged.iloc[:n].copy()
        feat_trim = feat_df.iloc[:n].copy()
        merged["cluster_id"] = feat_trim["cluster_id"].values
        merged["category"] = feat_trim["category"].values
    else:
        # Inner merge so we only plot buildings that have cluster assignments.
        merged = geo_gdf.merge(
            feat_df[["cluster_id", "category", join_key]],
            on=join_key,
            how="inner",
            suffixes=("", "_feat"),
        )

    # Ensure the projection note is accurate.
    # The figure requirement says EPSG:4326; if CRS exists and differs, reproject.
    if merged.crs is not None and str(merged.crs).lower() != "epsg:4326":
        merged = merged.to_crs(epsg=4326)

    # Build the figure — pure white background, no axes ink.
    fig, ax = plt.subplots(figsize=(12, 10))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    # Plot by category to apply the colorblind-safe palette.
    for cat, color in PALETTE.items():
        subset = merged[merged["category"] == cat]
        if subset.empty:
            continue
        # Maximize data-to-ink ratio: no polygon edges.
        subset.plot(
            ax=ax,
            color=color,
            edgecolor="none",
            linewidth=0,
            alpha=0.85,
        )

    ax.set_xlim(merged.total_bounds[0], merged.total_bounds[2])
    ax.set_ylim(merged.total_bounds[1], merged.total_bounds[3])

    # Remove axis visuals completely.
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.grid(False)
    ax.set_axis_off()

    # Legend bottom-right.
    legend_handles = []
    for cat, color in PALETTE.items():
        if (merged["category"] == cat).any():
            legend_handles.append(Patch(facecolor=color, edgecolor="none", label=cat))
    ax.legend(
        handles=legend_handles,
        loc="lower right",
        frameon=False,
        fontsize=11,
        borderaxespad=0.2,
    )

    # Title + note (minimalistic typography)
    fig.suptitle(
        "Morphological Fingerprinting of Kanombe, Kigali (K=3 Consensus Partition)",
        fontsize=16,
        y=0.98,
    )
    fig.text(
        0.5,
        0.02,
        "Data: Google Open Buildings V3 | Projection: EPSG:4326",
        ha="center",
        fontsize=11,
        color="black",
    )

    # Tight but still respects title/text.
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close(fig)

    print(f"[generate_map] Saved: {out_path}")


if __name__ == "__main__":
    main()

