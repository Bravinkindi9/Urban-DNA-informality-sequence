"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Dna, ArrowLeft, ChevronDown, ChevronUp, ExternalLink,
    Satellite, Building2, Ruler, BrainCircuit, AlertTriangle, BookOpen,
} from "lucide-react";

// ── Content ──────────────────────────────────────────────────────────────────

const SECTIONS = [
    {
        id: "overview",
        icon: BookOpen,
        color: "#818cf8",
        title: "Project Overview",
        content: `Urban DNA Sequencer is an open-source research platform that decodes the morphological 
"genetic structure" of African cities using satellite building data. Rather than requiring expensive 
ground surveys, it uses freely available satellite imagery and ML clustering to identify 
informal settlements, measure urban density, and classify building typologies at city scale.

The core insight is that informal vs. formal buildings leave distinct morphological fingerprints: 
informal structures tend to be smaller, more irregular in shape, and more densely packed — 
while formal structures are larger, more regular, and more spaced. By measuring these properties for 
every building in a city, we can automate what urban planners previously had to do manually.`,
    },
    {
        id: "data",
        icon: Satellite,
        color: "#2dd4bf",
        title: "Data Sources",
        content: `**Google Open Buildings V3** is the primary data source. Released by Google Research in 2023, 
it contains ~1.8 billion building footprint polygons across Africa, South and Southeast Asia, 
derived from high-resolution Maxar satellite imagery using a deep learning detection model.

For Kigali, we extract all buildings within a 3km radius Region of Interest (ROI) centred on 
the city centre (lat: -1.9441, lon: 30.0619). We apply a confidence threshold of 0.70 to 
filter out low-confidence detections, resulting in approximately 150,000 building polygons.

Accessed via: Google Earth Engine JavaScript/Python API (free academic access).`,
        links: [
            { label: "Open Buildings V3 Paper", href: "https://arxiv.org/abs/2107.12283" },
            { label: "Google Earth Engine", href: "https://earthengine.google.com" },
        ],
    },
    {
        id: "features",
        icon: Ruler,
        color: "#fbbf24",
        title: "Feature Engineering",
        content: `Seven morphological features are computed per building polygon:

1. **Area (m²)** — footprint area of the building polygon
2. **Perimeter (m)** — total boundary length
3. **Shape Index (SI)** — compactness measure: SI = 4π·Area / Perimeter². A circle = 1.0, irregular = <0.5
4. **Elongation** — ratio of bounding box length to width
5. **Nearest Neighbour Distance (NND)** — straight-line distance to the closest building centroid, computed via KD-tree for efficiency
6. **Local Density** — number of buildings within a 100m radius, normalised to buildings/km²
7. **Orientation** — principal axis angle of the minimum rotated bounding box

All features are standardised using sklearn's StandardScaler (zero mean, unit variance) before clustering.`,
    },
    {
        id: "model",
        icon: BrainCircuit,
        color: "#f472b6",
        title: "Machine Learning Model",
        content: `We use **K-Means clustering** as the primary algorithm due to its interpretability and speed at scale. 
The optimal number of clusters K is selected using the **Elbow Method** (plotting inertia vs. K) and 
validated with the **Silhouette Score**.

For Kigali, K=3 is optimal (Silhouette Score ≈ 0.48, which is considered "reasonable" for spatial data):

- **Cluster 0 — Informal / High Risk**: Small area, low shape index, high density, short NND
- **Cluster 1 — Upgrading / Transitional**: Medium area, moderate shape index, medium density  
- **Cluster 2 — Stable / Formal**: Large area, high shape index, low density, long NND

The trained model is serialised as \`urban_dna_brain.pkl\` using joblib and can be applied to new 
cities without retraining (transfer classification).

**Future**: Gaussian Mixture Models (soft assignments), DBSCAN (arbitrary shapes), and ground-truth 
validation against UN-Habitat informal settlement shapefiles.`,
    },
    {
        id: "validation",
        icon: AlertTriangle,
        color: "#f87171",
        title: "Validation & Limitations",
        content: `**Current Validation Status**: The model has been validated qualitatively — cluster 0 visually 
corresponds to known informal settlement areas in Kigali (Kicukiro, Kimironko periphery). 
Quantitative ground-truth validation against official informal settlement boundaries is planned.

**Limitations to be aware of:**

1. **No temporal data yet** — analysis reflects a single point in time (2023 data). Change detection vs. 2019 (V2) is planned.
2. **Building = household assumed** — the platform treats each polygon as one household. Multi-storey buildings are undercounted.
3. **Satellite occlusion** — trees and cloud cover can cause missed detections.
4. **Single-city model** — the current PKL model was trained on Kigali. Cross-city generalisation needs testing.
5. **Morphology ≠ poverty** — building shape correlates with informality but is not a direct poverty measure. Combine with census / OSM data for policy use.

**Planned**: IoU validation score vs. OpenStreetMap \`landuse=informal\` polygons.`,
    },
    {
        id: "reproduce",
        icon: Building2,
        color: "#34d399",
        title: "How to Reproduce",
        content: `The full pipeline is open source and reproducible:

\`\`\`bash
# 1. Clone the repo
git clone https://github.com/your-username/urban-dna-sequencer

# 2. Install dependencies
pip install -r requirements.txt

# 3. Authenticate with Google Earth Engine
earthengine authenticate

# 4. Run the pipeline on Kigali (or your own ROI)
python pipeline.py --city kigali --lat -1.9441 --lon 30.0619 --radius 3000

# 5. Launch the Streamlit app (internal demo)
streamlit run apps/app.py

# 6. Launch the Next.js frontend (production)
cd urban-dna-frontend && npm run dev
\`\`\`

The Jupyter notebook \`Notebooks/Urban_DNA_Sequencer_Phase1.ipynb\` walks through every step 
interactively with visualisations and commentary. Recommended for first-time users.`,
    },
];

// ── Component ─────────────────────────────────────────────────────────────────

function AccordionSection({
    icon: Icon, color, title, content, links, id,
}: {
    icon: typeof BookOpen; color: string; title: string; content: string;
    links?: { label: string; href: string }[]; id: string;
}) {
    const [open, setOpen] = useState(id === "overview");

    return (
        <div style={{
            background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)",
            border: `1px solid ${open ? color + "30" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 20, overflow: "hidden", transition: "border-color 0.3s",
            boxShadow: open ? `0 0 32px ${color}12` : "none",
        }}>
            {/* Header */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    all: "unset", cursor: "pointer", width: "100%",
                    display: "flex", alignItems: "center", gap: 18,
                    padding: "24px 28px",
                }}
            >
                <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: color + "15", border: `1px solid ${color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={20} color={color} />
                </div>
                <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f8fafc", flex: 1 }}>{title}</span>
                {open
                    ? <ChevronUp size={18} color="#64748b" />
                    : <ChevronDown size={18} color="#64748b" />
                }
            </button>

            {/* Body */}
            {open && (
                <div style={{ padding: "0 28px 28px" }}>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24 }}>
                        {/* Render content — bold markdown-like handling */}
                        {content.split("\n").map((line, i) => {
                            const trimmed = line.trimStart();
                            const isNumbered = /^\d+\./.test(trimmed);
                            const isBullet = trimmed.startsWith("- ");
                            const isCode = trimmed.startsWith("```") || trimmed.endsWith("```");
                            const isBlank = line.trim() === "";

                            if (isBlank) return <div key={i} style={{ height: 12 }} />;
                            if (isCode) return null;

                            // Inline bold
                            const parts = line.split(/\*\*(.*?)\*\*/g);
                            const rendered = parts.map((p, j) =>
                                j % 2 === 1 ? <strong key={j} style={{ color: "#f8fafc" }}>{p}</strong> : p
                            );

                            return (
                                <p key={i} style={{
                                    color: isNumbered || isBullet ? "#94a3b8" : "#64748b",
                                    fontSize: "0.9rem", lineHeight: 1.8,
                                    marginBottom: 4,
                                    paddingLeft: isNumbered || isBullet ? 8 : 0,
                                }}>
                                    {rendered}
                                </p>
                            );
                        })}

                        {/* Code blocks */}
                        {content.includes("```") && (
                            <pre style={{
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 12, padding: "20px 24px", marginTop: 16,
                                fontFamily: "'Space Mono', monospace", fontSize: "0.78rem",
                                color: "#94a3b8", overflowX: "auto", lineHeight: 1.8,
                            }}>
                                {content.match(/```[\w]*\n?([\s\S]*?)```/)?.[1] ?? ""}
                            </pre>
                        )}

                        {/* Links */}
                        {links && links.length > 0 && (
                            <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                                {links.map(l => (
                                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "8px 16px", borderRadius: 999,
                                        background: color + "10", border: `1px solid ${color}30`,
                                        color, fontSize: "0.78rem", textDecoration: "none", fontWeight: 600,
                                        transition: "background 0.2s",
                                    }}
                                        onMouseEnter={e => (e.currentTarget.style.background = color + "20")}
                                        onMouseLeave={e => (e.currentTarget.style.background = color + "10")}>
                                        {l.label} <ExternalLink size={11} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MethodologyPage() {
    return (
        <div style={{ background: "#020617", minHeight: "100vh", padding: "0 0 80px" }}>
            {/* Nav */}
            <div style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "rgba(2,6,23,0.9)", backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "0 2rem", height: 64,
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: "0.8rem" }}>
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
                    <Dna size={16} color="#2dd4bf" />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", fontWeight: 700, color: "#f8fafc" }}>
                        Methodology
                    </span>
                </div>
                <Link href="/dashboard" style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "linear-gradient(135deg, #2dd4bf, #818cf8)",
                    color: "#020617", fontWeight: 700, fontSize: "0.78rem",
                    padding: "8px 18px", borderRadius: 999, textDecoration: "none",
                }}>
                    Open Map →
                </Link>
            </div>

            {/* Page content */}
            <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px 0" }}>
                {/* Header */}
                <div style={{ marginBottom: 56 }}>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: "#2dd4bf", textTransform: "uppercase", marginBottom: 16 }}>
                        Technical Reference
                    </p>
                    <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 16 }}>
                        How Urban DNA Sequencer Works
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "1rem", lineHeight: 1.8, maxWidth: 600 }}>
                        A complete technical breakdown of the satellite data pipeline, feature engineering,
                        and AI clustering that powers morphological city analysis.
                    </p>
                </div>

                {/* Accordion sections */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {SECTIONS.map(s => (
                        <AccordionSection key={s.id} {...s} />
                    ))}
                </div>

                {/* Citation block */}
                <div style={{
                    marginTop: 48, background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 28px",
                }}>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#64748b", letterSpacing: "0.15em", marginBottom: 12 }}>
                        HOW TO CITE
                    </p>
                    <pre style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                        {`Urban DNA Sequencer (2026). Morphological AI for Informal Settlement
Detection in African Cities. GitHub: urban-dna-sequencer.
Data: Google Open Buildings V3 (2023).`}
                    </pre>
                </div>
            </div>
        </div>
    );
}
