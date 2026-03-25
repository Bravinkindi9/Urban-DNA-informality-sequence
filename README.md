## Project Illiya: Morphological Fingerprinting of Urban Informality

### The Objective
Detecting informal settlements in Kigali using unsupervised spatial statistics on vector geometries (Google Open Buildings V3).

### The Pipeline (The “Least to Highest”)
- **Level 1 (Data)**: Automated extraction of **9,369** building footprints from Google Earth Engine.
- **Level 2 (Feature Engineering)**: Calculation of **15 morphology features**, centered on **Orientation Entropy (Shannon \(H\))** and **Multi-Scale Density Ratios**.
- **Level 3 (The Model)**: A **50-seed K-Means ensemble** protocol (\(K=3\), k-means++ init) for initialization-robust clustering.
- **Level 4 (Validation)**: **Mean Pairwise ARI = 0.964**, demonstrating exceptional cluster stability under random initialization.

### Directory Map
- **`src/`**: Academic pipeline stages (clustering + figure generation).
  - `src/clustering.py`: K-sweep (K=2..5) with validation indices + K=3 ensemble ARI stability + consensus labeling; outputs Fig 1–4 and `kanombe_clustered_final.csv`.
  - `src/generate_map.py`: Publication-ready static thematic map; outputs Fig 5.
- **`paper/figures/`**: Publication-ready figure outputs.
  - Fig 1: Elbow plot (Inertia vs K)
  - Fig 2: Validation indices (Silhouette, Calinski–Harabasz, Davies–Bouldin vs K)
  - Fig 3: PCA embedding scatter (K=3 consensus)
  - Fig 4: Boxplots for star metrics (orientation_entropy, density_ratio)
  - Fig 5: Spatial thematic cluster map (EPSG:4326)
- **Core scripts**
  - `kanombe_extraction.py`: Earth Engine extraction of Open Buildings V3 polygons for Kanombe AOI.
  - `feature.py`: Morphology feature engineering (Tier 1–3), including multi-scale density + orientation entropy.
  - `run_features.py`: Produces `kanombe_features_academic.csv` and prints key statistics.

### Current Status
**Phase 2 (Engineering & Validation) Complete. Transitioning to Phase 3 (Preprint Authoring).**
