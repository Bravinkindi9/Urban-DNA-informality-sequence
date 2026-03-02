"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Papa from "papaparse";
import { DeckGL } from "@deck.gl/react";
import { ColumnLayer, ScatterplotLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import Link from "next/link";
import {
    Dna, ArrowLeft, Building2, AlertTriangle, TrendingUp,
    Download, Layers, X, Info,
} from "lucide-react";

type BuildingPoint = {
    lat: number;
    lon: number;
    cluster_id: number;
    [key: string]: unknown;
};

const INITIAL_VIEW_STATE = {
    longitude: 30.06,
    latitude: -1.94,
    zoom: 13,
    pitch: 50,
    bearing: -10,
};

const CLUSTER_META: Record<number, { label: string; color: [number, number, number]; hex: string; desc: string }> = {
    0: { label: "Informal / High Risk", color: [248, 113, 113], hex: "#f87171", desc: "Small, dense, irregular structures — likely informal settlements needing urgent attention." },
    1: { label: "Upgrading Zone", color: [251, 191, 36], hex: "#fbbf24", desc: "Transitional morphology — existing structure but lacking formal grid. Upgrade pathway viable." },
    2: { label: "Stable / Formal", color: [45, 212, 191], hex: "#2dd4bf", desc: "Larger footprints, regular spacing, formal building patterns. Low intervention priority." },
};

function getClusterMeta(id: number) {
    return CLUSTER_META[id] ?? CLUSTER_META[2];
}

export default function Dashboard() {
    const [points, setPoints] = useState<BuildingPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPoint, setSelectedPoint] = useState<BuildingPoint | null>(null);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [activeLayer, setActiveLayer] = useState<"scatter" | "column">("column");
    const [filterCluster, setFilterCluster] = useState<number | null>(null);

    // ── Load CSV ────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const loadCsv = async () => {
            try {
                setLoading(true);
                const res = await fetch("/kigali_results.csv");
                if (!res.ok) throw new Error(`CSV load failed: ${res.status}`);
                const text = await res.text();
                const parsed = Papa.parse<Record<string, unknown>>(text, {
                    header: true, dynamicTyping: true, skipEmptyLines: true,
                });
                const cleaned: BuildingPoint[] = (parsed.data || [])
                    .filter((r): r is Record<string, unknown> => !!r)
                    .filter(r => typeof r.lat === "number" && typeof r.lon === "number")
                    .map(r => ({
                        ...r,
                        lat: r.lat as number,
                        lon: r.lon as number,
                        cluster_id: isNaN(Number(r.cluster_id)) ? 0 : Number(r.cluster_id),
                    }));
                if (!cancelled) setPoints(cleaned);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadCsv();
        return () => { cancelled = true; };
    }, []);

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = points.length;
        const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
        points.forEach(p => { counts[p.cluster_id] = (counts[p.cluster_id] ?? 0) + 1; });
        return { total, counts };
    }, [points]);

    // ── Filtered data ─────────────────────────────────────────────────────
    const displayPoints = useMemo(
        () => filterCluster !== null ? points.filter(p => p.cluster_id === filterCluster) : points,
        [points, filterCluster]
    );

    // ── Layers ───────────────────────────────────────────────────────────────
    const layers = useMemo(() => {
        if (activeLayer === "column") {
            return [
                new ColumnLayer<BuildingPoint>({
                    id: "column",
                    data: displayPoints,
                    diskResolution: 6,
                    radius: 14,
                    elevationScale: 4,
                    getPosition: d => [d.lon, d.lat],
                    getElevation: d => (d.cluster_id === 0 ? 8 : d.cluster_id === 1 ? 5 : 3),
                    getFillColor: d => [...getClusterMeta(d.cluster_id).color, 200] as [number, number, number, number],
                    pickable: true,
                    autoHighlight: true,
                }),
            ];
        }
        return [
            new ScatterplotLayer<BuildingPoint>({
                id: "scatter",
                data: displayPoints,
                radiusMinPixels: 3,
                radiusMaxPixels: 9,
                getPosition: d => [d.lon, d.lat],
                getFillColor: d => [...getClusterMeta(d.cluster_id).color, 220] as [number, number, number, number],
                pickable: true,
                autoHighlight: true,
            }),
        ];
    }, [displayPoints, activeLayer]);

    const handleClick = useCallback((info: { object?: BuildingPoint | null; coordinate?: [number, number] } | null) => {
        if (info?.object) {
            setSelectedPoint(info.object);
            if (info.coordinate) {
                setViewState(vs => ({ ...vs, longitude: info.coordinate![0], latitude: info.coordinate![1] }));
            }
        } else {
            setSelectedPoint(null);
        }
    }, []);

    // ── Export ────────────────────────────────────────────────────────────────
    const handleExport = () => {
        const csv = Papa.unparse(points);
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "urban_dna_kigali.csv";
        a.click();
    };

    const meta = selectedPoint ? getClusterMeta(selectedPoint.cluster_id) : null;

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#020617" }}>

            {/* ── MAP ─────────────────────────────────────────────────────────── */}
            <DeckGL
                layers={layers}
                initialViewState={INITIAL_VIEW_STATE}
                controller
                viewState={viewState}
                onViewStateChange={({ viewState: vs }: { viewState: typeof INITIAL_VIEW_STATE }) => setViewState(vs)}
                onClick={handleClick}
            >
                <Map
                    reuseMaps
                    mapLib={maplibregl}
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    style={{ width: "100%", height: "100%" }}
                />
            </DeckGL>

            {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
                padding: "0 20px", height: 56,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(2,6,23,0.85)", backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: "0.8rem" }}>
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
                    <Dna size={16} color="#2dd4bf" />
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", fontWeight: 700, color: "#f8fafc" }}>
                        Dashboard · Kigali, Rwanda
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Layer toggle */}
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
                        {(["column", "scatter"] as const).map(l => (
                            <button key={l} onClick={() => setActiveLayer(l)} style={{
                                all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "0.72rem",
                                fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase",
                                background: activeLayer === l ? "rgba(45,212,191,0.15)" : "transparent",
                                color: activeLayer === l ? "#2dd4bf" : "#64748b",
                                transition: "all 0.2s",
                            }}>{l === "column" ? "3D" : "Dot"}</button>
                        ))}
                    </div>
                    <button onClick={handleExport} style={{
                        all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8", transition: "all 0.2s",
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {/* ── KPI CARDS (top-right) ─────────────────────────────────────────── */}
            <div style={{ position: "absolute", top: 72, right: 20, zIndex: 20, display: "flex", flexDirection: "column", gap: 10, width: 200 }}>
                <div style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 18px" }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#64748b", letterSpacing: "0.2em", marginBottom: 6 }}>TOTAL BUILDINGS</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "'Space Mono', monospace", color: "#f8fafc" }}>
                        {loading ? "…" : stats.total.toLocaleString()}
                    </div>
                </div>
                {Object.entries(CLUSTER_META).map(([id, m]) => (
                    <div
                        key={id}
                        onClick={() => setFilterCluster(filterCluster === Number(id) ? null : Number(id))}
                        style={{
                            background: filterCluster === Number(id) ? m.hex + "15" : "rgba(2,6,23,0.85)",
                            backdropFilter: "blur(12px)",
                            border: `1px solid ${filterCluster === Number(id) ? m.hex + "50" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 14, padding: "12px 18px", cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: filterCluster === Number(id) ? `0 0 20px ${m.hex}20` : "none",
                        }}
                    >
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", color: m.hex, letterSpacing: "0.15em", marginBottom: 4 }}>
                            {m.label.toUpperCase()}
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "'Space Mono', monospace", color: m.hex }}>
                            {loading ? "…" : (stats.counts[Number(id)] ?? 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 2 }}>
                            {stats.total > 0 ? (((stats.counts[Number(id)] ?? 0) / stats.total) * 100).toFixed(1) + "%" : "-"}
                        </div>
                    </div>
                ))}
                {filterCluster !== null && (
                    <button onClick={() => setFilterCluster(null)} style={{
                        all: "unset", cursor: "pointer", textAlign: "center",
                        padding: "8px", borderRadius: 10, fontSize: "0.7rem",
                        background: "rgba(255,255,255,0.05)", color: "#64748b",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                        Show all clusters
                    </button>
                )}
            </div>

            {/* ── BUILDING DNA SIDEBAR (left, slides in on click) ──────────────── */}
            <aside style={{
                position: "absolute", left: 20, top: 72, zIndex: 20, width: 300,
                background: "rgba(2,6,23,0.9)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
                padding: "24px", color: "#f8fafc",
                transform: selectedPoint ? "translateX(0)" : "translateX(-340px)",
                transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: meta ? `0 0 40px ${meta.hex}18` : "none",
            }}>
                {selectedPoint && meta ? (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                            <div>
                                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#64748b", letterSpacing: "0.2em", marginBottom: 6 }}>
                                    BUILDING DNA PROFILE
                                </div>
                                <span style={{
                                    display: "inline-block", padding: "4px 12px", borderRadius: 999,
                                    background: meta.hex + "20", border: `1px solid ${meta.hex}40`,
                                    color: meta.hex, fontSize: "0.7rem", fontWeight: 700,
                                    fontFamily: "'Space Mono', monospace",
                                }}>
                                    {meta.label}
                                </span>
                            </div>
                            <button onClick={() => setSelectedPoint(null)} style={{ all: "unset", cursor: "pointer", color: "#64748b", padding: 4 }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
                                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: "#64748b", letterSpacing: "0.15em", marginBottom: 6 }}>COORDINATES</div>
                                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "#94a3b8" }}>
                                    {selectedPoint.lat.toFixed(5)}, {selectedPoint.lon.toFixed(5)}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {["cluster_id", "building_id", "area", "shape_index"].map(k => (
                                    selectedPoint[k] != null && (
                                        <div key={k} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px" }}>
                                            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.55rem", color: "#64748b", letterSpacing: "0.12em", marginBottom: 4 }}>
                                                {k.replace(/_/g, " ").toUpperCase()}
                                            </div>
                                            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.82rem", color: "#f8fafc" }}>
                                                {typeof selectedPoint[k] === "number" ? Number(selectedPoint[k]).toFixed(2) : String(selectedPoint[k])}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>

                            <div style={{ background: meta.hex + "10", border: `1px solid ${meta.hex}25`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
                                <Info size={14} color={meta.hex} style={{ flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{meta.desc}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ color: "#64748b", fontSize: "0.8rem", textAlign: "center" }}>
                        <Layers size={24} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                        Click any building to read its DNA profile
                    </div>
                )}
            </aside>

            {/* ── LOADING / ERROR states ───────────────────────────────────────── */}
            {loading && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.7)", backdropFilter: "blur(8px)" }}>
                    <div style={{ textAlign: "center" }}>
                        <Dna size={40} color="#2dd4bf" style={{ animation: "float 1.5s ease-in-out infinite", margin: "0 auto 16px" }} />
                        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "#64748b" }}>Sequencing urban DNA…</p>
                    </div>
                </div>
            )}
            {error && (
                <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "12px 20px", color: "#f87171", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={14} /> {error} — Place <code>kigali_results.csv</code> in <code>public/</code>
                </div>
            )}
        </div>
    );
}
