# Contributing to NEXUS OS

Thank you for your interest in contributing to **NEXUS OS**! We welcome improvements, optimizations, and bug fixes from developers around the globe.

---

## 🧭 Principles & Engineering Philosophy

- **Zero Runtime Dependencies**: The core platform runs on standard web APIs (HTML5, CSS3 Custom Properties, Vanilla ES6+). Avoid introducing third-party npm bundles without strong architectural justification.
- **Sub-50ms TTFB**: All assets are optimized for global edge execution and instant CDN delivery.
- **Defensive Error Handling**: All network calls and data mutations must fail gracefully to the fallback telemetry engine without crashing the UI.

---

## 🛠️ Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/<your-username>/terra-dashboard.git
   cd terra-dashboard
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feat/telemetry-latency-chart
   ```

3. **Make & Test Your Changes Locally**
   ```bash
   python -m http.server 3000
   ```
   Open `http://localhost:3000` to verify rendering across different viewport resolutions.

4. **Follow Conventional Commits**
   ```bash
   git commit -m "feat(telemetry): add latency distribution sparkline"
   ```

5. **Push & Submit a Pull Request**
   ```bash
   git push origin feat/telemetry-latency-chart
   ```

---

## 📜 Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

- `feat:` Adds a new capability or metric visualization
- `fix:` Fixes a bug or calculation error
- `perf:` Improves rendering performance or reduces payload size
- `refactor:` Code restructure with zero behavioral change
- `docs:` Changes to documentation or diagrams
- `style:` Formatting or CSS visual polish
- `test:` Adds or updates automated validation suites
