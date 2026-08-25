# NEXUS OS — Enterprise Commerce Intelligence & Global Connectivity Telemetry ⚡

A high-performance enterprise analytics platform designed with an **Obsidian Glassmorphism & Cyber Aurora** aesthetic. Features instant Supabase RPC connectivity, real-time edge telemetry, interactive fallback demo engine, multi-column leaderboard sorting, CSV exports, dynamic time-of-day greetings, and responsive dark-mode styling.

---

## 🌟 Key Features

- **Hyper-Modern Obsidian Aesthetic**: Deep void background, glowing cyan and neon-violet ambient orbs, glassmorphic metric cards, and refined typography (`Outfit`, `Inter`, `JetBrains Mono`).
- **Supabase Cloud RPC Integration**: Connects seamlessly with PostgreSQL stored procedures (`get_sales_dashboard`, `get_destination_sales`, `get_product_sales`).
- **Interactive In-App Settings Modal**: Switch between **Live Supabase** and **Demo Mode** on the fly, ping RPC connection latency in real-time, and store credentials safely in `localStorage`.
- **High-Fidelity Demo Engine**: Zero-configuration fallback data engine ensuring instant presentation out-of-the-box on Vercel without broken charts or errors.
- **Dynamic Leaderboard Table**: Search by staff name, multi-column sort (Monthly Revenue, Sales, Today's metrics), animated initials avatars, rank chips, pagination, and instant CSV download.
- **Top eSIM Packages & Global Radar World Map**: Interactive ranked lists for global destinations with country flags, radar hotspot glow beacons, and top volume packages.

---

## 📁 Project Structure

```text
terra-dashboard/
├── index.html            # Main Dashboard Application markup
├── style.css             # Obsidian & Cyber Aurora CSS Design System
├── config.js             # Supabase credentials & demo telemetry config
├── script.js             # Normalizer, SVG Chart Engine, Table & Supabase RPC Controllers
├── supabase_schema.sql   # Complete PostgreSQL tables, seed data & RPC functions
├── vercel.json           # Vercel deployment & security headers config
├── package.json          # Package manifest & metadata
├── .gitignore            # Standard git ignore list
└── README.md             # Documentation & deployment guide
```

---

## ⚡ Connecting Your Supabase Project

### Method 1: Using the In-App Settings UI (No Code Changes)
1. Open the dashboard in your browser.
2. Click **Supabase RPC API** in the left sidebar (or click the user profile at the top right).
3. Switch the tab to **LIVE SUPABASE**.
4. Enter your **Supabase Project URL** (e.g. `https://xyzcompany.supabase.co`) and your **Supabase Public Anon Key**.
5. Click **Ping RPC** to verify latency.
6. Click **Apply & Stream Data**. The dashboard will reload and stream data directly from your Supabase database!

### Method 2: In `config.js`
Open `config.js` and set:
```javascript
SUPABASE: {
    URL: "https://your-project.supabase.co",
    ANON_KEY: "your-anon-publishable-key-here"
},
USE_DEMO_MODE: false
```

---

## 🗄️ Setting Up Supabase Database (Schema & RPC)

To get live data populated in your Supabase project:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** from the left menu.
3. Open [`supabase_schema.sql`](supabase_schema.sql), copy all lines, paste them into the SQL editor, and click **Run**.
4. This creates:
   - Tables: `staff`, `destinations`, `sim_packages`, `orders`
   - Initial travel SIM orders and telemetry records
   - The 3 RPC functions (`get_sales_dashboard`, `get_destination_sales`, `get_product_sales`) with public access permissions granted.

---

## 💻 Local Preview

You can open `index.html` directly in any web browser, or serve it locally via:
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000`.
