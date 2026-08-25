<div align="center">

# ⚡ NEXUS OS — Enterprise Commerce Intelligence

**Production-grade, zero-dependency Global Connectivity & Commerce Telemetry Platform.**  
*Engineered for real-time edge telemetry, high-throughput Supabase RPC streaming, and sub-50ms TTFB.*

[![Live Production](https://img.shields.io/badge/Live%20Production-Vercel%20Edge-00F2FE?style=for-the-badge&logo=vercel&logoColor=white)](https://terra-dashboard-seven.vercel.app/)
[![Database](https://img.shields.io/badge/Backend-Supabase%20RPC-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Dependency%20Vanilla%20ES6+-7928CA?style=for-the-badge&logo=javascript&logoColor=white)](#-architectural-design-philosophy)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[**Explore Live Demo ➔**](https://terra-dashboard-seven.vercel.app/) • [**Report Vulnerability**](SECURITY.md) • [**Contribution Guide**](CONTRIBUTING.md)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Live Deployment](#-live-deployment)
- [Key Features](#-key-features)
- [Architectural Design Philosophy](#-architectural-design-philosophy)
- [System Architecture Flow](#-system-architecture-flow)
- [Supabase Schema & Stored Procedures](#-supabase-schema--stored-procedures)
- [Design System & Theme Tokens](#-design-system--theme-tokens)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Security & Performance Engineering](#-security--performance-engineering)
- [Contributing & Standards](#-contributing--standards)
- [License & Author](#-license--author)

---

## 🌐 Overview

**NEXUS OS** is an enterprise-tier Commerce Intelligence & Global eSIM Telemetry Platform. It delivers real-time transactional metrics, velocity sparklines, multi-zone geographical radar distribution, and account-executive sales performance audits.

Built deliberately without bulky monolithic frontend frameworks, NEXUS OS leverages modern **vanilla ES6+ and CSS3 Custom Properties**, ensuring instant First Contentful Paint (FCP < 0.3s), zero runtime dependency vulnerabilities, and ultra-high reliability across global CDNs.

---

## 🚀 Live Deployment

The platform is deployed globally across Vercel's edge network:

> **🔗 Production URL:** [**https://terra-dashboard-seven.vercel.app/**](https://terra-dashboard-seven.vercel.app/)

---

## ✨ Key Features

| Capability | Engineering Highlights |
| :--- | :--- |
| **Real-time RPC Stream** | Direct integration with PostgreSQL stored procedures (`get_sales_dashboard`, `get_destination_sales`, `get_product_sales`). |
| **Fault-Tolerant Local Engine** | Seamless fallback to a deterministic, high-fidelity sandbox engine when cloud credentials are unconfigured or offline. |
| **Obsidian Glassmorphic UI** | Deep void aesthetic (`#07080D`) with ambient blurred aurora orbs (`#00F2FE` cyan, `#7928CA` neon violet), backdrop filters, and subtle 1px frosted borders. |
| **Vector Radar World Map** | Pure SVG global coordinate map with radar ping beacons and flight connection arcs showing active global demand hubs. |
| **High-Precision Leaderboard** | Multi-column client-side sorting, O(N) fuzzy search, initials avatar generator, pagination, and RFC 4180-compliant CSV export. |
| **In-App Telemetry Configurator** | Live ping latency testing against Supabase REST endpoints with secure `localStorage` credential persistence. |

---

## 🏛️ Architectural Design Philosophy

```
+-------------------------------------------------------------------------------+
|                                 NEXUS OS UI                                  |
|   (Command Center • Revenue Velocity • Global Radar • Executive Audit)        |
+---------------------------------------+---------------------------------------+
                                        |
                         +--------------v--------------+
                         |      Normalizer Layer       |
                         |  (Schema sanitization & dt) |
                         +--------------+--------------+
                                        |
                      +-----------------+-----------------+
                      |                                   |
        +-------------v-------------+       +-------------v-------------+
        |     Supabase API Client   |       |    Local Telemetry Engine |
        |  (PostgreSQL Remote RPC)  |       |   (Deterministic Fallback)|
        +-------------+-------------+       +---------------------------+
                      |
        +-------------v-------------+
        |  PostgreSQL Database      |
        |  (Row-Level Security/RPC) |
        +---------------------------+
```

1. **Zero-Dependency Core**: Zero `node_modules` runtime overhead. Eliminates build-step failures, supply-chain vulnerabilities, and bundle bloat.
2. **Normalizer Pattern**: Decouples presentation controllers from raw backend schemas. The `Normalizer` layer guarantees uniform object models regardless of whether data originates from Supabase cloud or local fallbacks.
3. **Defensive API Degradation**: Network latency spikes or invalid API keys trigger non-blocking failovers to the local telemetry sandbox while presenting non-intrusive status indicators.
4. **Security Definer Isolation**: Supabase stored procedures use `SECURITY DEFINER` with scoped `EXECUTE` privileges granted to anonymous and authenticated roles.

---

## 🗄️ Supabase Schema & Stored Procedures

The database schema is fully encapsulated within [`supabase_schema.sql`](supabase_schema.sql).

### Core Database Entities

- `public.staff`: Sales executives and team leads.
- `public.destinations`: Global destinations with country codes, ISO flags, and regional metadata.
- `public.sim_packages`: Connectivity packages with tier allocations, data limits, and pricing.
- `public.orders`: Transactional order log with timestamp, staff foreign key, package foreign key, and channel.

### Remote Procedure Calls (RPC)

```sql
-- 1. Master Dashboard Telemetry (KPI metrics, daily/monthly summaries, staff audit)
SELECT public.get_sales_dashboard(p_as_of_date := '2026-05-20');

-- 2. Destination Distribution Breakdown
SELECT public.get_destination_sales(p_as_of_date := '2026-05-20');

-- 3. Top Performing Data Packages
SELECT public.get_product_sales(p_as_of_date := '2026-05-20');
```

---

## 🎨 Design System & Theme Tokens

NEXUS OS implements an **Obsidian Glassmorphism** design system with CSS custom variables:

```css
:root {
    --bg-void: #07080D;
    --bg-page: #0B0D14;
    --bg-card: rgba(18, 22, 36, 0.7);
    --border: rgba(255, 255, 255, 0.07);
    --cyan: #00F2FE;
    --violet: #7928CA;
    --emerald: #10B981;
    --amber: #F59E0B;
}
```

- **Headings & Body**: `Outfit` & `Inter`
- **Currencies & Telemetry Numbers**: `JetBrains Mono`
- **Effects**: Backdrop filter blur (`blur(16px)`), ambient radial orbs, and pulsing CSS keyframe animations.

---

## 💻 Getting Started & Local Development

### Prerequisites
- Any modern web browser (Chrome, Safari, Firefox, Edge).
- Optional: Python 3, Node.js, or any static file server.

### Quickstart

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shubhthakur363-oss/terra-dashboard.git
   cd terra-dashboard
   ```

2. **Serve Locally:**
   ```bash
   # Option A: Python
   python -m http.server 3000

   # Option B: Node / npx
   npx serve .
   ```

3. **Open in Browser:**
   Navigate to `http://localhost:3000`.

---

## 🛡️ Security & Performance Engineering

- **Content Security**: Hardened HTTP headers configured via [`vercel.json`](vercel.json):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
- **Credential Safety**: Client-side Supabase credentials utilize the public `anon` publishable key only. Sensitive operations are governed by PostgreSQL Row Level Security (RLS) and stored procedure scoping.
- **Client Latency Audit**: Built-in ping tool measures exact round-trip time (`ms`) to cloud RPC endpoints.

---

## 🤝 Contributing & Standards

Contributions following senior engineering practices are welcome!
Please review our **[Contribution Guidelines](CONTRIBUTING.md)** and **[Code of Conduct](CODE_OF_CONDUCT.md)** before submitting pull requests.

### Commit Convention
This repository adheres to [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New telemetry feature or visualization
- `fix:` Bug fix or rendering patch
- `perf:` Performance optimization or asset reduction
- `refactor:` Code refactoring without behavioral change
- `docs:` Documentation improvements

---

## 📄 License & Author

- **Author**: **[Shubh Thakur](https://github.com/shubhthakur363-oss)** — Operations & Software Architecture
- **License**: Released under the **[MIT License](LICENSE)**.
