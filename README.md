# TERRA — Commerce Intelligence & Global Analytics Platform 🚀

An exact high-performance clone of the **TERRA Commerce Intelligence & Global SIM Analytics Platform** ([dashboard-one-lime-48.vercel.app](https://dashboard-one-lime-48.vercel.app/)), equipped with instant Supabase RPC connectivity, interactive fallback demo engine, search & sorting telemetry, CSV exports, dynamic greetings, and responsive dark-mode styling.

---

## 🌟 Key Features

- **Exact 1:1 UI Clone**: Electric purple neon & deep navy dark aesthetic with glowing gradient cards, responsive layout, SVG charts, and interactive pulse points on a vector world map.
- **Supabase Live RPC Integration**: Connects seamlessly with Supabase stored procedures (`get_sales_dashboard`, `get_destination_sales`, `get_product_sales`).
- **Interactive In-App Settings Modal**: Switch between **Live Supabase** and **Demo Mode** on the fly, test connection latency in real-time, and store credentials safely in `localStorage`.
- **High-Fidelity Demo Engine**: Zero-configuration fallback data engine ensuring instant presentation out-of-the-box on Vercel without broken charts or errors.
- **Dynamic Leaderboard Table**: Search by staff name, multi-column sort (Monthly Revenue, Sales, Today's metrics), pagination, and instant CSV download.
- **Top SIM Packages & Destination Intelligence**: Live ranked lists for global destinations with country flags and top volume packages.

---

## 📁 Project Structure

```text
terra-dashboard/
├── index.html            # Main Dashboard Application markup
├── style.css             # Modern Deep Navy & Neon CSS Design System
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
2. Click **API Settings** in the left sidebar (or click the user profile at the top right).
3. Switch the tab to **LIVE SUPABASE**.
4. Enter your **Supabase Project URL** (e.g. `https://xyzcompany.supabase.co`) and your **Supabase Public Anon Key**.
5. Click **Test Connection** to verify latency.
6. Click **Save Configuration**. The dashboard will reload and stream data directly from your Supabase database!

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
4. This will create:
   - Tables: `staff`, `destinations`, `sim_packages`, `orders`
   - Initial travel SIM orders and telemetry records
   - The 3 RPC functions (`get_sales_dashboard`, `get_destination_sales`, `get_product_sales`) with public access permissions granted.

---

## 🚀 How to Push to Git & Deploy to Vercel

### Step 1: Initialize Git Repository
In this directory:
```bash
git init
git add .
git commit -m "feat: initial release of TERRA Commerce Intelligence Dashboard"
```

### Step 2: Push to GitHub / GitLab
Create a new repository on GitHub (e.g. `terra-commerce-dashboard`), then run:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/terra-commerce-dashboard.git
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Web Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository `terra-commerce-dashboard`.
3. Keep default settings (Framework Preset: **Other** / Root Directory: `./`).
4. Click **Deploy**. Your dashboard will be live in under 30 seconds!

#### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 💻 Local Preview

You can open `index.html` directly in any web browser, or serve it locally via:
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000`.
