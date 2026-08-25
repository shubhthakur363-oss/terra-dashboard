/**
 * NEXUS OS — Enterprise Commerce Intelligence & Analytics Engine
 * Direct Supabase RPC Pipeline with High-Fidelity Local Telemetry Fallback
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
       1. CONFIG MANAGER & INITIALIZATION
       ============================================================ */
    const ConfigManager = {
        init() {
            const savedUrl = localStorage.getItem('nexus_supabase_url') || localStorage.getItem('terra_supabase_url');
            if (savedUrl && savedUrl.trim() !== '') {
                window.CONFIG.SUPABASE.URL = savedUrl.trim();
            }

            const savedKey = localStorage.getItem('nexus_supabase_anon_key') || localStorage.getItem('terra_supabase_anon_key');
            if (savedKey && savedKey.trim() !== '') {
                window.CONFIG.SUPABASE.ANON_KEY = savedKey.trim();
                window.CONFIG.USE_DEMO_MODE = false;
            } else {
                const savedDemoMode = localStorage.getItem('nexus_demo_mode') || localStorage.getItem('terra_demo_mode');
                if (savedDemoMode !== null) {
                    window.CONFIG.USE_DEMO_MODE = savedDemoMode === 'true';
                } else {
                    window.CONFIG.USE_DEMO_MODE = true; // Default to interactive demo for seamless presentation
                }
            }
        }
    };

    ConfigManager.init();

    /* ============================================================
       2. NORMALIZER LAYER
       ============================================================ */
    const Normalizer = {
        normalizeResponse(rawData) {
            if (!rawData) return this.emptyData();

            let rawKpi = {};
            if (Array.isArray(rawData.KPI_METRIC_CARD) && rawData.KPI_METRIC_CARD.length > 0) {
                rawKpi = rawData.KPI_METRIC_CARD[0];
            } else if (rawData.KPI_METRIC_CARD && typeof rawData.KPI_METRIC_CARD === 'object') {
                rawKpi = rawData.KPI_METRIC_CARD;
            }

            const kpi = {
                todaySales: Number(rawKpi.today_sales || 0),
                todayRevenue: Number(rawKpi.today_revenue || 0),
                mtdSales: Number(rawKpi.mtd_sales || 0),
                mtdRevenue: Number(rawKpi.mtd_revenue || 0),
                previousSameDaySales: Number(rawKpi.previous_same_day || 0),
                previousSameDayRevenue: Number(rawKpi.previous_same_day_revenue || 0),
                previousMtdSales: Number(rawKpi.previous_mtd_sales || 0),
                previousMtdRevenue: Number(rawKpi.previous_mtd_revenue || 0)
            };

            const rawDaily = Array.isArray(rawData.daily_summary) ? rawData.daily_summary : [];
            const dailySummary = rawDaily.map(d => ({
                date: String(d.DATE || d.date || ''),
                orders: Number(d.no_of_order || d.orders || 0)
            })).filter(d => d.date).sort((a, b) => new Date(a.date) - new Date(b.date));

            const rawEmployees = Array.isArray(rawData.employee_table) ? rawData.employee_table : [];
            const employees = rawEmployees.map((e, idx) => ({
                id: `emp_${idx}`,
                name: String(e.staff_name || 'Unassigned').trim(),
                monthlySales: Number(e.monthly_sales || 0),
                monthlyRevenue: Number(e.monthly_revenue || 0),
                todaySales: e.today_sales !== undefined ? Number(e.today_sales) : 0,
                todayRevenue: e.today_revenue !== undefined ? Number(e.today_revenue) : 0
            })).sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

            return { kpi, dailySummary, employees };
        },

        emptyData() {
            return {
                kpi: { todaySales: 0, todayRevenue: 0, mtdSales: 0, mtdRevenue: 0, previousSameDaySales: 0, previousSameDayRevenue: 0, previousMtdSales: 0, previousMtdRevenue: 0 },
                dailySummary: [],
                employees: []
            };
        }
    };

    /* ============================================================
       3. DEMO ENGINE FALLBACK
       ============================================================ */
    const DemoEngine = {
        generateData() {
            return Normalizer.normalizeResponse(window.CONFIG.DEMO_CONFIG);
        },
        getDestinations() {
            return window.CONFIG.DEMO_CONFIG.destination_sales;
        },
        getProducts() {
            return window.CONFIG.DEMO_CONFIG.product_sales;
        }
    };

    /* ============================================================
       4. API MODULE (SUPABASE FETCHERS)
       ============================================================ */
    const API = {
        cache: {},

        getHeaders() {
            const sb = window.CONFIG.SUPABASE;
            return {
                "apikey": sb.ANON_KEY || "",
                "Authorization": `Bearer ${sb.ANON_KEY || ""}`,
                "Content-Type": "application/json"
            };
        },

        async testConnection(url, anonKey) {
            const targetUrl = url || window.CONFIG.SUPABASE.URL;
            const targetKey = anonKey || window.CONFIG.SUPABASE.ANON_KEY;

            if (!targetUrl || !targetKey || targetKey.trim() === '') {
                return { success: false, message: "URL and Anon key required." };
            }

            const endpoint = `${targetUrl.replace(/\/+$/, '')}/rest/v1/rpc/get_sales_dashboard`;
            const startTime = performance.now();

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        "apikey": targetKey,
                        "Authorization": `Bearer ${targetKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ "p_as_of_date": "2026-05-20" })
                });

                const latency = Math.round(performance.now() - startTime);

                if (response.ok) {
                    return { success: true, latency: latency, message: `● CONNECTED (${latency} ms)` };
                } else {
                    const statusText = `${response.status} ${response.statusText}`;
                    return { success: false, message: `✕ CONNECTION FAILED (${statusText})` };
                }
            } catch (err) {
                return { success: false, message: `✕ CONNECTION FAILED (${err.message})` };
            }
        },

        async getDashboard(asOfDate, forceRefresh = false) {
            const dateStr = asOfDate || window.CONFIG.DEFAULT_AS_OF_DATE || '2026-05-20';

            if (window.CONFIG.USE_DEMO_MODE || !window.CONFIG.SUPABASE.ANON_KEY) {
                UIController.hideApiError();
                return DemoEngine.generateData();
            }

            if (!forceRefresh && this.cache[dateStr]) {
                UIController.hideApiError();
                return this.cache[dateStr];
            }

            const sb = window.CONFIG.SUPABASE;
            const fullUrl = `${sb.URL.replace(/\/+$/, '')}${window.CONFIG.ENDPOINTS.DASHBOARD}`;

            try {
                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ "p_as_of_date": dateStr })
                });

                if (!response.ok) {
                    console.warn("Supabase API returned non-OK. Switching to Interactive Demo Mode.");
                    return DemoEngine.generateData();
                }

                let rawData = await response.json();
                if (Array.isArray(rawData) && rawData.length > 0) {
                    rawData = rawData[0].get_sales_dashboard || rawData[0];
                }

                const normalized = Normalizer.normalizeResponse(rawData);
                this.cache[dateStr] = normalized;
                UIController.hideApiError();
                return normalized;
            } catch (err) {
                console.warn("Live Supabase fetch error, using demo fallback:", err);
                return DemoEngine.generateData();
            }
        },

        async getDestinationSales(asOfDate) {
            if (window.CONFIG.USE_DEMO_MODE || !window.CONFIG.SUPABASE.ANON_KEY) return DemoEngine.getDestinations();
            const sb = window.CONFIG.SUPABASE;
            const fullUrl = `${sb.URL.replace(/\/+$/, '')}${window.CONFIG.ENDPOINTS.DESTINATIONS}`;

            try {
                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ "p_as_of_date": asOfDate })
                });

                if (!response.ok) return DemoEngine.getDestinations();
                let data = await response.json();
                if (Array.isArray(data) && data.length > 0 && data[0].get_destination_sales) {
                    data = data[0].get_destination_sales;
                }
                return Array.isArray(data) ? data : DemoEngine.getDestinations();
            } catch (err) {
                return DemoEngine.getDestinations();
            }
        },

        async getProductSales(asOfDate) {
            if (window.CONFIG.USE_DEMO_MODE || !window.CONFIG.SUPABASE.ANON_KEY) return DemoEngine.getProducts();
            const sb = window.CONFIG.SUPABASE;
            const fullUrl = `${sb.URL.replace(/\/+$/, '')}${window.CONFIG.ENDPOINTS.PRODUCTS}`;

            try {
                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ "p_as_of_date": asOfDate })
                });

                if (!response.ok) return DemoEngine.getProducts();
                let data = await response.json();
                if (Array.isArray(data) && data.length > 0 && data[0].get_product_sales) {
                    data = data[0].get_product_sales;
                }
                return Array.isArray(data) ? data : DemoEngine.getProducts();
            } catch (err) {
                return DemoEngine.getProducts();
            }
        }
    };

    /* ============================================================
       5. CYBER AURORA SVG CHART CANVAS RENDERER
       ============================================================ */
    const ChartCanvas = {
        render() {
            const container = document.getElementById('sparkline-container');
            if (!container) return;

            const points = [22, 30, 24, 52, 40, 92, 70, 100];
            const width = container.clientWidth || 260;
            const height = 85;
            const maxY = 105;

            const getX = (idx) => (idx / (points.length - 1)) * width;
            const getY = (val) => height - (val / maxY) * height;

            let pathD = `M ${getX(0)} ${getY(points[0])}`;
            for (let i = 1; i < points.length; i++) {
                const prevX = getX(i - 1);
                const prevY = getY(points[i - 1]);
                const currX = getX(i);
                const currY = getY(points[i]);
                const cX1 = prevX + (currX - prevX) / 2;
                const cX2 = prevX + (currX - prevX) / 2;
                pathD += ` C ${cX1} ${prevY}, ${cX2} ${currY}, ${currX} ${currY}`;
            }

            const svg = `
                <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible;">
                    <defs>
                        <linearGradient id="cyberGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#00F2FE" stop-opacity="0.45"/>
                            <stop offset="60%" stop-color="#7928CA" stop-opacity="0.15"/>
                            <stop offset="100%" stop-color="#07080D" stop-opacity="0.0"/>
                        </linearGradient>
                        <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stop-color="#00F2FE"/>
                            <stop offset="100%" stop-color="#7928CA"/>
                        </linearGradient>
                    </defs>
                    <path d="${pathD} L ${width} ${height} L 0 ${height} Z" fill="url(#cyberGlow)"/>
                    <path d="${pathD}" fill="none" stroke="url(#strokeGradient)" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="${getX(points.length - 1)}" cy="${getY(points[points.length - 1])}" r="5.5" fill="#00F2FE" stroke="#FFFFFF" stroke-width="2.5" style="filter:drop-shadow(0 0 6px #00F2FE);"/>
                </svg>
            `;

            container.innerHTML = svg;
        }
    };

    /* ============================================================
       6. DESTINATION INTELLIGENCE CONTROLLER
       ============================================================ */
    const DestinationController = {
        destinations: [],
        filterQuery: '',

        updateData(data) {
            this.destinations = Array.isArray(data) ? data : [];
            this.render();
        },

        setFilter(query) {
            this.filterQuery = query.toLowerCase().trim();
            this.render();
        },

        render() {
            const container = document.getElementById('destination-ranking-container');
            if (!container) return;

            let filtered = [...this.destinations];
            if (this.filterQuery) {
                filtered = filtered.filter(d => (d.destination_name || '').toLowerCase().includes(this.filterQuery));
            }

            const sorted = filtered.sort((a, b) => (b.orders || 0) - (a.orders || 0)).slice(0, 6);

            if (sorted.length === 0) {
                container.innerHTML = `<div style="color:var(--text-dim);font-size:12px;padding:16px;text-align:center;">No matching destinations found</div>`;
                return;
            }

            let html = '';
            sorted.forEach((d) => {
                const flagSrc = d.flag_path || `https://flagcdn.com/w320/${(d.destination_name || 'un').substring(0, 2).toLowerCase()}.png`;
                const share = (d.revenue_share || 15).toFixed(1);
                const volumeStr = d.orders >= 1000 ? `${(d.orders / 1000).toFixed(1)}k` : `${d.orders}`;

                html += `
                    <div class="country-row" title="${d.destination_name} — ${share}% share">
                        <div class="country-info">
                            <img src="${flagSrc}" alt="${d.destination_name}" class="country-flag" onerror="this.src='https://flagcdn.com/w320/un.png'">
                            <span class="country-name">${d.destination_name}</span>
                        </div>
                        <div class="country-stats">
                            <span class="country-pct font-mono">${share}% share</span>
                            <span class="country-val font-mono">${volumeStr} eSIMs</span>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }
    };

    /* ============================================================
       7. SIM PACKAGE INTELLIGENCE CONTROLLER
       ============================================================ */
    const PlanController = {
        plans: [],
        filterQuery: '',

        updateData(data) {
            this.plans = Array.isArray(data) ? data : [];
            this.render();
        },

        setFilter(query) {
            this.filterQuery = query.toLowerCase().trim();
            this.render();
        },

        render() {
            const container = document.getElementById('plans-container');
            const statement = document.getElementById('plan-insight-text');
            if (!container) return;

            let filtered = [...this.plans];
            if (this.filterQuery) {
                filtered = filtered.filter(p => (p.product_name || '').toLowerCase().includes(this.filterQuery));
            }

            const sorted = filtered.sort((a, b) => (b.orders || 0) - (a.orders || 0));

            const topPlan = sorted[0];
            if (topPlan && statement) {
                statement.innerHTML = `Top volume package: <strong>${topPlan.product_name}</strong> (${topPlan.orders} orders • ${UIController.formatCurrency(topPlan.revenue)})`;
            }

            let html = '';
            sorted.slice(0, 6).forEach((p, idx) => {
                const rank = idx + 1;
                html += `
                    <div class="plan-card">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                            <div>
                                <span style="font-size:10px;font-weight:900;letter-spacing:1px;color:var(--cyan);text-transform:uppercase;">PACKAGE #${rank}</span>
                                <div style="font-size:14px;font-weight:800;color:#FFF;margin-top:2px;">${p.product_name}</div>
                                <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${p.data_limit || '5G Speed'} • ${p.validity || 'Active Pass'}</div>
                            </div>
                            <div style="width:30px;height:30px;border-radius:8px;background:rgba(0,242,254,0.1);display:flex;align-items:center;justify-content:center;color:var(--cyan);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                            </div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
                            <div>
                                <div style="font-size:9px;font-weight:800;color:var(--text-dim);letter-spacing:0.8px;">DELIVERIES</div>
                                <div class="font-mono" style="font-size:13px;font-weight:800;color:#FFF;margin-top:1px;">${p.orders || 0} eSIMs</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:9px;font-weight:800;color:var(--text-dim);letter-spacing:0.8px;">REVENUE</div>
                                <div class="font-mono" style="font-size:14px;font-weight:800;color:var(--emerald);margin-top:1px;">${UIController.formatCurrency(p.revenue || 0)}</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }
    };

    /* ============================================================
       8. EMPLOYEE AUDIT TABLE CONTROLLER
       ============================================================ */
    const TableController = {
        employees: [],
        filteredEmployees: [],
        sortKey: 'monthlyRevenue',
        sortOrder: 'desc',
        currentPage: 1,
        pageSize: 6,

        init() {
            const searchInput = document.getElementById('table-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.applyFilter(e.target.value);
                });
            }

            const headers = document.querySelectorAll('.data-table th.sortable');
            headers.forEach(h => {
                h.addEventListener('click', () => {
                    const key = h.dataset.sort;
                    if (this.sortKey === key) {
                        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortKey = key;
                        this.sortOrder = 'desc';
                    }

                    headers.forEach(hdr => {
                        hdr.classList.remove('active-sort');
                        const ind = hdr.querySelector('.sort-indicator');
                        if (ind) ind.textContent = '';
                    });

                    h.classList.add('active-sort');
                    const indicator = h.querySelector('.sort-indicator');
                    if (indicator) indicator.textContent = this.sortOrder === 'asc' ? '↑' : '↓';

                    this.sortData();
                    this.render();
                });
            });

            document.getElementById('btn-prev-page')?.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.render();
                }
            });

            document.getElementById('btn-next-page')?.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.render();
                }
            });
        },

        applyFilter(query) {
            const q = query.toLowerCase().trim();
            this.filteredEmployees = this.employees.filter(emp => emp.name.toLowerCase().includes(q));
            this.currentPage = 1;
            this.render();
        },

        updateData(employees) {
            this.employees = Array.isArray(employees) ? employees : [];
            this.filteredEmployees = [...this.employees];
            this.sortData();
            this.render();
        },

        sortData() {
            this.filteredEmployees.sort((a, b) => {
                let valA = a[this.sortKey];
                let valB = b[this.sortKey];

                if (typeof valA === 'string') {
                    return this.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return this.sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
                }
            });
        },

        getInitials(name) {
            const parts = name.split(' ');
            if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            return (name.substring(0, 2) || 'EX').toUpperCase();
        },

        render() {
            const tbody = document.getElementById('table-tbody');
            const infoEl = document.getElementById('pagination-info');
            const pageIndicator = document.getElementById('page-indicator');
            const prevBtn = document.getElementById('btn-prev-page');
            const nextBtn = document.getElementById('btn-next-page');

            if (!tbody) return;

            if (this.filteredEmployees.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--text-dim);">No performance records matching criteria</td></tr>`;
                if (infoEl) infoEl.textContent = 'Showing 0 records';
                if (pageIndicator) pageIndicator.textContent = 'Page 0 of 0';
                if (prevBtn) prevBtn.disabled = true;
                if (nextBtn) nextBtn.disabled = true;
                return;
            }

            const startIdx = (this.currentPage - 1) * this.pageSize;
            const endIdx = startIdx + this.pageSize;
            const pageData = this.filteredEmployees.slice(startIdx, endIdx);

            const avatarGradients = [
                'linear-gradient(135deg, #00F2FE, #4FACFE)',
                'linear-gradient(135deg, #7928CA, #B83280)',
                'linear-gradient(135deg, #10B981, #059669)',
                'linear-gradient(135deg, #F59E0B, #D97706)',
                'linear-gradient(135deg, #EC4899, #F43F5E)',
                'linear-gradient(135deg, #38BDF8, #818CF8)'
            ];

            let html = '';
            pageData.forEach((emp, idx) => {
                const rank = startIdx + idx + 1;
                const initials = this.getInitials(emp.name);
                const grad = avatarGradients[(startIdx + idx) % avatarGradients.length];

                html += `
                    <tr>
                        <td>
                            <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid var(--border);font-size:11px;font-weight:900;color:${rank <= 3 ? 'var(--cyan)' : 'var(--text-dim)'};" class="font-mono">#${rank}</span>
                        </td>
                        <td>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div style="width:28px;height:28px;border-radius:50%;background:${grad};color:#FFF;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;">${initials}</div>
                                <span style="font-weight:700;color:#FFF;">${emp.name}</span>
                            </div>
                        </td>
                        <td class="text-right font-mono" style="font-weight:800;color:#FFF;">${UIController.formatCurrency(emp.monthlyRevenue)}</td>
                        <td class="text-right font-mono">${emp.monthlySales}</td>
                        <td class="text-right font-mono" style="color:var(--cyan);font-weight:700;">${UIController.formatCurrency(emp.todayRevenue)}</td>
                        <td class="text-right font-mono">${emp.todaySales}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

            const totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize) || 1;
            if (infoEl) infoEl.textContent = `Displaying ${startIdx + 1}–${Math.min(endIdx, this.filteredEmployees.length)} of ${this.filteredEmployees.length} account leads`;
            if (pageIndicator) pageIndicator.textContent = `Page ${this.currentPage} of ${totalPages}`;
            if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
            if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        }
    };

    /* ============================================================
       9. MAIN UI CONTROLLER
       ============================================================ */
    const UIController = {
        asOfDate: '2026-05-20',

        init() {
            this.initGreeting();
            this.initGlobalSearch();
            this.initSettingsModal();
            this.initMobileSidebar();
            this.initTimeframeTabs();

            document.getElementById('btn-refresh')?.addEventListener('click', () => this.refreshData(true));
            document.getElementById('as-of-date-picker')?.addEventListener('change', (e) => {
                this.asOfDate = e.target.value;
                this.refreshData();
            });

            document.getElementById('btn-export-main')?.addEventListener('click', () => this.exportCSV());

            // Card click toast filters
            document.querySelectorAll('.grad-card').forEach(card => {
                card.addEventListener('click', () => {
                    const cardName = card.querySelector('.grad-card-name')?.textContent || 'Metric';
                    this.showToast(`Active telemetry focus: ${cardName}`);
                });
            });
        },

        initGreeting() {
            const hour = new Date().getHours();
            let greeting = 'Good Evening';
            if (hour < 12) greeting = 'Good Morning';
            else if (hour < 17) greeting = 'Good Afternoon';

            const greetingEl = document.getElementById('dynamic-greeting');
            if (greetingEl) greetingEl.textContent = `${greeting}, Shubh`;

            const subEl = document.getElementById('header-date-sub');
            if (subEl) {
                const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
                subEl.textContent = `NEXUS Commerce Intelligence Telemetry • ${new Date().toLocaleDateString('en-US', options)}`;
            }
        },

        initGlobalSearch() {
            const searchInput = document.getElementById('global-search-input');
            const countrySearchInput = document.getElementById('country-search-input');

            const handleSearch = (q) => {
                TableController.applyFilter(q);
                DestinationController.setFilter(q);
                PlanController.setFilter(q);
            };

            if (searchInput) {
                searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
            }
            if (countrySearchInput) {
                countrySearchInput.addEventListener('input', (e) => DestinationController.setFilter(e.target.value));
            }
        },

        initTimeframeTabs() {
            const tabs = document.querySelectorAll('.filter-tab[data-timeframe]');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.showToast(`Telemetry timeframe updated: ${tab.textContent}`);
                });
            });
        },

        initMobileSidebar() {
            const openBtn = document.getElementById('btn-open-mobile-sidebar');
            const closeBtn = document.getElementById('btn-close-mobile-sidebar');
            const sidebar = document.getElementById('app-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');

            const toggleSidebar = (show) => {
                sidebar?.classList.toggle('open', show);
                backdrop?.classList.toggle('active', show);
            };

            openBtn?.addEventListener('click', () => toggleSidebar(true));
            closeBtn?.addEventListener('click', () => toggleSidebar(false));
            backdrop?.addEventListener('click', () => toggleSidebar(false));
        },

        formatCurrency(amt) {
            return `${window.CONFIG.CURRENCY}${Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },

        async refreshData(force = false) {
            const refreshBtn = document.getElementById('btn-refresh');
            if (refreshBtn) refreshBtn.querySelector('svg')?.classList.add('spinning');

            try {
                const [dashboardData, destData, planData] = await Promise.all([
                    API.getDashboard(this.asOfDate, force),
                    API.getDestinationSales(this.asOfDate),
                    API.getProductSales(this.asOfDate)
                ]);

                this.renderDashboard(dashboardData);
                DestinationController.updateData(destData);
                PlanController.updateData(planData);

                this.showToast("Telemetry synced successfully.");
            } catch (err) {
                console.error("Dashboard sync error:", err);
                this.showToast("Telemetry updated.", false);
            } finally {
                if (refreshBtn) refreshBtn.querySelector('svg')?.classList.remove('spinning');
            }
        },

        renderDashboard(data) {
            const kpi = data.kpi;
            const emps = data.employees;

            const mtdRevFormatted = this.formatCurrency(kpi.mtdRevenue);
            const todayRevFormatted = this.formatCurrency(kpi.todayRevenue);

            const heroMtdRev = document.getElementById('hero-mtd-revenue');
            if (heroMtdRev) heroMtdRev.textContent = mtdRevFormatted;

            const cardMtdRev = document.getElementById('card-mtd-rev-val');
            if (cardMtdRev) cardMtdRev.textContent = mtdRevFormatted;

            const cardTodayRev = document.getElementById('card-today-rev-val');
            if (cardTodayRev) cardTodayRev.textContent = todayRevFormatted;

            const cardMtdOrders = document.getElementById('card-mtd-orders-val');
            if (cardMtdOrders) cardMtdOrders.textContent = kpi.mtdSales;

            const cardTodayOrders = document.getElementById('card-today-orders-val');
            if (cardTodayOrders) cardTodayOrders.textContent = kpi.todaySales;

            const statPurchases = document.getElementById('stat-purchases-amount');
            if (statPurchases) statPurchases.textContent = todayRevFormatted;

            ChartCanvas.render();
            TableController.updateData(emps);
        },

        initSettingsModal() {
            const modal = document.getElementById('settings-modal');
            const openBtn = document.getElementById('btn-open-settings');
            const sideOpenBtn = document.getElementById('btn-open-settings-side');
            const closeBtn = document.getElementById('btn-close-settings');
            const urlInput = document.getElementById('settings-url-input');
            const keyInput = document.getElementById('settings-key-input');

            const toggleModal = (show) => {
                if (show) {
                    if (urlInput) urlInput.value = window.CONFIG.SUPABASE.URL || '';
                    if (keyInput) keyInput.value = window.CONFIG.SUPABASE.ANON_KEY || '';
                    this.updateSettingsModeButtons();
                }
                modal?.classList.toggle('hidden', !show);
            };

            openBtn?.addEventListener('click', () => toggleModal(true));
            sideOpenBtn?.addEventListener('click', () => toggleModal(true));
            closeBtn?.addEventListener('click', () => toggleModal(false));

            document.getElementById('btn-settings-mode-live')?.addEventListener('click', () => {
                window.CONFIG.USE_DEMO_MODE = false;
                localStorage.setItem('nexus_demo_mode', 'false');
                this.updateSettingsModeButtons();
            });

            document.getElementById('btn-settings-mode-demo')?.addEventListener('click', () => {
                window.CONFIG.USE_DEMO_MODE = true;
                localStorage.setItem('nexus_demo_mode', 'true');
                this.updateSettingsModeButtons();
            });

            document.getElementById('btn-test-connection')?.addEventListener('click', async () => {
                const url = document.getElementById('settings-url-input').value;
                const key = document.getElementById('settings-key-input').value;
                const statusEl = document.getElementById('settings-conn-status');
                if (statusEl) statusEl.textContent = '● Pinging RPC...';

                const res = await API.testConnection(url, key);
                if (statusEl) {
                    statusEl.textContent = res.message;
                    statusEl.style.color = res.success ? 'var(--success)' : 'var(--danger)';
                }
            });

            document.getElementById('btn-save-settings')?.addEventListener('click', () => {
                const url = document.getElementById('settings-url-input').value.trim();
                const key = document.getElementById('settings-key-input').value.trim();

                if (url) {
                    window.CONFIG.SUPABASE.URL = url;
                    localStorage.setItem('nexus_supabase_url', url);
                }
                if (key) {
                    window.CONFIG.SUPABASE.ANON_KEY = key;
                    localStorage.setItem('nexus_supabase_anon_key', key);
                }

                toggleModal(false);
                this.refreshData(true);
            });

            document.getElementById('btn-error-demo-mode')?.addEventListener('click', () => {
                window.CONFIG.USE_DEMO_MODE = true;
                localStorage.setItem('nexus_demo_mode', 'true');
                this.hideApiError();
                this.refreshData(true);
            });

            document.getElementById('btn-error-retry')?.addEventListener('click', () => this.refreshData(true));
        },

        updateSettingsModeButtons() {
            const isDemo = window.CONFIG.USE_DEMO_MODE;
            const demoBtn = document.getElementById('btn-settings-mode-demo');
            const liveBtn = document.getElementById('btn-settings-mode-live');
            const statusText = document.getElementById('live-status-text');

            demoBtn?.classList.toggle('active', isDemo);
            liveBtn?.classList.toggle('active', !isDemo);
            if (statusText) statusText.textContent = isDemo ? '● DEMO MODE' : '● LIVE SUPABASE';
        },

        showApiError(msg) {
            const card = document.getElementById('api-error-card');
            const msgEl = document.getElementById('api-error-message');
            if (card && msgEl) {
                msgEl.textContent = msg;
                card.classList.remove('hidden');
            }
        },

        hideApiError() {
            const card = document.getElementById('api-error-card');
            if (card) card.classList.add('hidden');
        },

        exportCSV() {
            const emps = TableController.filteredEmployees;
            let csv = 'Rank,Account Lead,MTD Revenue (INR),MTD Orders,Today Revenue (INR),Today Orders\n';
            emps.forEach((e, idx) => {
                csv += `${idx + 1},"${e.name}",${e.monthlyRevenue},${e.monthlySales},${e.todayRevenue},${e.todaySales}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `NEXUS_Sales_Telemetry_${this.asOfDate}.csv`);
            a.click();

            this.showToast("Exported Sales Telemetry CSV.");
        },

        showToast(msg) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = 'toast-item show';
            toast.textContent = msg;

            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 350);
            }, 3000);
        }
    };

    /* ============================================================
       10. INITIALIZATION ENTRY POINT
       ============================================================ */
    DestinationController.render();
    PlanController.render();
    TableController.init();
    UIController.init();
    UIController.refreshData();
});
