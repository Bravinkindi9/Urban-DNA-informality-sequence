"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Dna,
  Map,
  BarChart3,
  FileDown,
  Globe,
  ChevronRight,
  Satellite,
  Building2,
  Ruler,
  BrainCircuit,
  AlertTriangle,
  Github,
  ArrowRight,
  TrendingUp,
  Users,
  Layers,
} from "lucide-react";

// ─── Pipeline Steps ───────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    icon: Satellite,
    num: "01",
    title: "Satellite Acquisition",
    subtitle: "Google Earth Engine",
    desc: "Open Buildings V3 dataset provides polygons of 1.8 billion+ structures across Africa, derived from satellite imagery using computer vision.",
    color: "#818cf8",
    glow: "rgba(129,140,248,0.15)",
    detail: "Source: Google + Maxar satellite imagery · Resolution: 50cm/px · Coverage: Sub-Saharan Africa",
  },
  {
    icon: Building2,
    num: "02",
    title: "Building Detection",
    subtitle: "Open Buildings V3",
    desc: "Each polygon is extracted with high confidence score (>0.7). We filter to a region of interest — initially a 3km radius ROI around Kigali city centre.",
    color: "#2dd4bf",
    glow: "rgba(45,212,191,0.15)",
    detail: "~150,000 buildings extracted · Confidence threshold: 0.70 · Format: GeoJSON",
  },
  {
    icon: Ruler,
    num: "03",
    title: "Feature Engineering",
    subtitle: "Morphological Metrics",
    desc: "Seven shape metrics computed per building: area, perimeter, shape index (compactness), elongation, nearest-neighbour distance, and local density.",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.15)",
    detail: "Shape Index = 4π·Area / Perimeter² · NND via KD-tree · Density = buildings/km²",
  },
  {
    icon: BrainCircuit,
    num: "04",
    title: "AI Clustering",
    subtitle: "K-Means + Elbow Method",
    desc: "Standardised features are fed into K-Means. The optimal K is selected via the Elbow Method. Each cluster represents a distinct morphological 'DNA signature'.",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.15)",
    detail: "K=3 optimal · Silhouette Score: ~0.48 · StandardScaler normalisation",
  },
  {
    icon: AlertTriangle,
    num: "05",
    title: "Risk Classification",
    subtitle: "Informal / Upgrading / Stable",
    desc: "Clusters are labelled by morphological profile: Informal (small, dense, irregular), Upgrading (transitional), and Stable (larger, regular, spacious).",
    color: "#f87171",
    glow: "rgba(248,113,113,0.15)",
    detail: "Output: risk score 0–10 per building · Export: GeoJSON, CSV, Shapefile",
  },
];

// ─── Stats ─────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Buildings Analysed", value: "150K+", icon: Building2 },
  { label: "Cities Covered", value: "1 → 10+", icon: Globe },
  { label: "Risk Categories", value: "3", icon: Layers },
  { label: "Data Accuracy", value: "~94%", icon: TrendingUp },
];

// ─── Features ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Map,
    title: "Interactive 3D Map",
    desc: "Deck.gl-powered map with 3D column extrusion showing risk density across every building in real time.",
    color: "#2dd4bf",
  },
  {
    icon: BarChart3,
    title: "Statistical Dashboard",
    desc: "Cluster statistics, silhouette scores, distribution histograms and building-level detail panels.",
    color: "#818cf8",
  },
  {
    icon: FileDown,
    title: "Multi-Format Export",
    desc: "Download your analysis as GeoJSON, Shapefile, or CSV. PDF report generation coming in v2.",
    color: "#fbbf24",
  },
  {
    icon: Globe,
    title: "Multi-City Coverage",
    desc: "Starting with Kigali. Expanding to Nairobi, Lagos, Kampala, and Dar es Salaam.",
    color: "#f472b6",
  },
  {
    icon: Users,
    title: "Open + Reproducible",
    desc: "All notebooks, model weights, and pipeline scripts are open source on GitHub.",
    color: "#34d399",
  },
  {
    icon: Dna,
    title: "DNA Profiles",
    desc: "Every building gets a unique morphological DNA vector — click any point on the map to read it.",
    color: "#f87171",
  },
];

// ─── Nav ───────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 2rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(2,6,23,0.90)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Dna size={22} color="#2dd4bf" />
        <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "0.9rem", color: "#f8fafc", letterSpacing: "0.02em" }}>
          Urban DNA
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link href="/methodology" style={{ color: "#94a3b8", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f8fafc")}
          onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
          Methodology
        </Link>
        <Link href="/dashboard" style={{ color: "#94a3b8", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f8fafc")}
          onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
          Dashboard
        </Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
          style={{ color: "#94a3b8", display: "flex", alignItems: "center", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f8fafc")}
          onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
          <Github size={18} />
        </a>
        <Link href="/dashboard" style={{
          background: "linear-gradient(135deg, #2dd4bf, #818cf8)",
          color: "#020617",
          fontWeight: 700,
          fontSize: "0.8rem",
          padding: "8px 20px",
          borderRadius: "999px",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "0.02em",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          Launch Map <ArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="hero-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 2rem 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Badge */}
      <div className="animate-fade-up" style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)",
        borderRadius: "999px", padding: "6px 16px", marginBottom: "28px",
        fontSize: "0.75rem", fontFamily: "'Space Mono', monospace",
        color: "#2dd4bf", letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2dd4bf", animation: "pulse-dot 2s ease infinite" }} />
        Research Preview · Kigali, Rwanda
      </div>

      {/* Headline */}
      <h1 className="animate-fade-up delay-100" style={{
        fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
        fontWeight: 900,
        lineHeight: 1.08,
        letterSpacing: "-0.03em",
        maxWidth: "900px",
        marginBottom: "24px",
      }}>
        Decode the{" "}
        <span className="gradient-text">Genetic Structure</span>
        {" "}of Cities
      </h1>

      {/* Subtitle */}
      <p className="animate-fade-up delay-200" style={{
        color: "#94a3b8", fontSize: "clamp(1rem, 2vw, 1.25rem)",
        maxWidth: "600px", lineHeight: 1.7, marginBottom: "48px",
      }}>
        Urban DNA Sequencer uses satellite building data and morphological AI to detect
        informal settlements, measure urban growth, and guide infrastructure investment
        across African cities.
      </p>

      {/* CTAs */}
      <div className="animate-fade-up delay-300" style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/dashboard" style={{
          background: "linear-gradient(135deg, #2dd4bf 0%, #818cf8 100%)",
          color: "#020617", fontWeight: 800, fontSize: "1rem",
          padding: "16px 36px", borderRadius: "999px", textDecoration: "none",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 0 40px rgba(45,212,191,0.25)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(45,212,191,0.35)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(45,212,191,0.25)"; }}>
          <Map size={18} /> Open Live Map
        </Link>
        <Link href="/methodology" style={{
          background: "transparent", color: "#f8fafc", fontWeight: 600, fontSize: "1rem",
          padding: "16px 36px", borderRadius: "999px", textDecoration: "none",
          border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: "10px",
          transition: "border-color 0.2s, background 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "transparent"; }}>
          How It Works <ChevronRight size={16} />
        </Link>
      </div>

      {/* Stats row */}
      <div className="animate-fade-up delay-400" style={{
        display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center",
        marginTop: "72px", padding: "32px 48px",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "24px",
      }}>
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <Icon size={16} color="#64748b" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "'Space Mono', monospace", color: "#f8fafc" }}>{value}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Pipeline Section ──────────────────────────────────────────────────────
function Pipeline() {
  const [active, setActive] = useState(0);
  const step = PIPELINE_STEPS[active];

  return (
    <section id="how-it-works" style={{ padding: "120px 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: "72px" }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#2dd4bf", textTransform: "uppercase", marginBottom: "16px" }}>
          The Method
        </p>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px" }}>
          Five Steps from Satellite to Insight
        </h2>
        <p style={{ color: "#64748b", maxWidth: "520px", margin: "0 auto", lineHeight: 1.7 }}>
          Every building's morphological signature is decoded through a reproducible,
          open-source pipeline — from raw pixels to actionable risk maps.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
        {/* Step buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {PIPELINE_STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === active;
            return (
              <button
                key={s.num}
                onClick={() => setActive(i)}
                style={{
                  all: "unset", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "20px 24px", borderRadius: "16px",
                  border: `1px solid ${isActive ? s.color + "40" : "rgba(255,255,255,0.06)"}`,
                  background: isActive ? "rgba(15,23,42,0.8)" : "transparent",
                  boxShadow: isActive ? `0 0 32px ${s.glow}` : "none",
                  transition: "all 0.25s ease",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
                  background: isActive ? s.color + "20" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? s.color + "40" : "rgba(255,255,255,0.06)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s",
                }}>
                  <Icon size={20} color={isActive ? s.color : "#64748b"} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: isActive ? s.color : "#64748b", letterSpacing: "0.15em", marginBottom: "4px" }}>
                    STEP {s.num}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: isActive ? "#f8fafc" : "#94a3b8" }}>
                    {s.title}
                  </div>
                </div>
                {isActive && <ChevronRight size={16} color={s.color} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div
          key={active}
          className="glass animate-fade-in"
          style={{ padding: "40px", position: "sticky", top: "96px", boxShadow: `0 0 48px ${step.glow}` }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "18px", marginBottom: "24px",
            background: step.color + "15", border: `1px solid ${step.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <step.icon size={28} color={step.color} />
          </div>

          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: step.color, letterSpacing: "0.2em", marginBottom: "8px" }}>
            STEP {step.num} · {step.subtitle}
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.01em" }}>
            {step.title}
          </h3>
          <p style={{ color: "#94a3b8", lineHeight: 1.75, marginBottom: "28px", fontSize: "0.95rem" }}>
            {step.desc}
          </p>
          <div style={{
            padding: "16px 20px", borderRadius: "12px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            fontFamily: "'Space Mono', monospace", fontSize: "0.72rem",
            color: "#64748b", lineHeight: 1.7,
          }}>
            {step.detail}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: "8px", marginTop: "32px" }}>
            {PIPELINE_STEPS.map((_, i) => (
              <div key={i} onClick={() => setActive(i)} style={{
                cursor: "pointer",
                width: i === active ? 24 : 8, height: 8,
                borderRadius: "999px",
                background: i === active ? step.color : "rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Grid ─────────────────────────────────────────────────────────
function Features() {
  return (
    <section style={{ padding: "80px 2rem 120px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "64px" }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#818cf8", textTransform: "uppercase", marginBottom: "16px" }}>
          Platform Features
        </p>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Everything you need to analyse urban morphology
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="glass"
            style={{ padding: "32px", cursor: "default", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 0 40px ${color}15`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: "14px", marginBottom: "20px",
              background: color + "12", border: `1px solid ${color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={22} color={color} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "10px" }}>{title}</h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Banner ─────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{ padding: "0 2rem 120px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, rgba(129,140,248,0.08) 50%, rgba(244,114,182,0.06) 100%)",
        border: "1px solid rgba(45,212,191,0.15)",
        borderRadius: "32px",
        padding: "72px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(45,212,191,0.06) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(129,140,248,0.06) 0%, transparent 50%)`,
        }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#2dd4bf", textTransform: "uppercase", marginBottom: "20px" }}>
          Open Source · Free to Use
        </p>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "20px" }}>
          Ready to decode your city?
        </h2>
        <p style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.7 }}>
          Launch the interactive map, explore the methodology, or clone the repo and run the pipeline on your own ROI.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{
            background: "linear-gradient(135deg, #2dd4bf, #818cf8)",
            color: "#020617", fontWeight: 800, fontSize: "0.95rem",
            padding: "14px 32px", borderRadius: "999px", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Map size={16} /> Open Live Map
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
            background: "rgba(255,255,255,0.05)", color: "#f8fafc", fontWeight: 600,
            fontSize: "0.95rem", padding: "14px 32px", borderRadius: "999px",
            textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Github size={16} /> View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "40px 2rem",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      flexWrap: "wrap", gap: "16px",
      maxWidth: "1200px", margin: "0 auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Dna size={18} color="#2dd4bf" />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "#64748b" }}>
          Urban DNA Sequencer · MIT License
        </span>
      </div>
      <div style={{ display: "flex", gap: "24px" }}>
        <Link href="/methodology" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>Methodology</Link>
        <Link href="/dashboard" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>Dashboard</Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>GitHub</a>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: "#020617", minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <Pipeline />
      <Features />
      <CTABanner />
      <Footer />
    </div>
  );
}
