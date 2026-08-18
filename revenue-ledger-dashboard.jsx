import React, { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, Wallet, Trophy, Search, Download } from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#11151B",
  surface: "#171C24",
  surface2: "#1D232C",
  border: "#2B323C",
  borderLight: "#343C47",
  ink: "#ECE8DF",
  inkMuted: "#8D96A5",
  inkFaint: "#5C6472",
  brass: "#C9A24B",
  brassDim: "#8A7538",
  teal: "#4FA98C",
  rust: "#C1666B",
  slate: "#6E85B7",
  sand: "#D9B872",
};

const CHART_COLORS = [COLORS.teal, COLORS.brass, COLORS.slate, COLORS.rust, COLORS.sand];

const FONTS = {
  display: "'Source Serif 4', Georgia, serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
  body: "'Inter', -apple-system, sans-serif",
};

// ---------------------------------------------------------------------------
// Synthetic data generation (deterministic)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1337);

const MONTHS = [
  "Feb '25","Mar '25","Apr '25","May '25","Jun '25","Jul '25",
  "Aug '25","Sep '25","Oct '25","Nov '25","Dec '25","Jan '26",
  "Feb '26","Mar '26","Apr '26","May '26","Jun '26","Jul '26",
];

const PRODUCTS = [
  { id: "qk", name: "Quiet Keys Board", category: "Office", base: 4900, price: 179,
    region: { North: 0.30, South: 0.25, East: 0.20, West: 0.25 } },
  { id: "ae", name: "Aria Earbuds", category: "Audio", base: 4750, price: 129,
    region: { North: 0.28, South: 0.22, East: 0.27, West: 0.23 } },
  { id: "bs", name: "Brew Station 3", category: "Home", base: 2650, price: 139,
    region: { North: 0.24, South: 0.26, East: 0.25, West: 0.25 } },
  { id: "tp", name: "Trail Pack 30L", category: "Outdoor", base: 2600, price: 149,
    region: { North: 0.20, South: 0.30, East: 0.20, West: 0.30 } },
  { id: "pa", name: "PocketAmp Mini", category: "Audio", base: 2320, price: 109,
    region: { North: 0.25, South: 0.25, East: 0.25, West: 0.25 } },
  { id: "cw", name: "Chrono Watch 5", category: "Wearables", base: 2180, price: 105,
    region: { North: 0.27, South: 0.24, East: 0.26, West: 0.23 } },
  { id: "sf", name: "Summit Flask", category: "Outdoor", base: 1920, price: 139,
    region: { North: 0.22, South: 0.28, East: 0.22, West: 0.28 } },
  { id: "gc", name: "Glide Chair Pro", category: "Office", base: 1540, price: 129,
    region: { North: 0.30, South: 0.20, East: 0.25, West: 0.25 } },
  { id: "bm", name: "Bass Monitor 500", category: "Audio", base: 1510, price: 63,
    region: { North: 0.25, South: 0.25, East: 0.25, West: 0.25 } },
  { id: "sd", name: "Standing Desk 140", category: "Office", base: 1420, price: 173,
    region: { North: 0.28, South: 0.22, East: 0.24, West: 0.26 } },
  { id: "af", name: "Aero Fan Tower", category: "Home", base: 1120, price: 106,
    region: { North: 0.23, South: 0.27, East: 0.25, West: 0.25 } },
  { id: "pb", name: "Pulse Band 2", category: "Wearables", base: 980, price: 77,
    region: { North: 0.26, South: 0.24, East: 0.25, West: 0.25 } },
];

const CATEGORIES = ["All", "Audio", "Office", "Outdoor", "Home", "Wearables"];
const REGIONS = ["All", "North", "South", "East", "West"];
const PERIODS = [
  { key: "90d", label: "90D", months: 3 },
  { key: "180d", label: "180D", months: 6 },
  { key: "365d", label: "365D", months: 12 },
  { key: "all", label: "ALL TIME", months: 18 },
];

const ROWS = PRODUCTS.flatMap((p) =>
  MONTHS.map((m, i) => {
    const seasonal = 1 + 0.22 * Math.sin((i / 18) * Math.PI * 2 + 1.1);
    const growth = 1 + i * 0.012;
    const noise = 0.9 + rand() * 0.22;
    const revenue = Math.round(p.base * seasonal * growth * noise);
    const units = Math.max(1, Math.round(revenue / p.price));
    return {
      productId: p.id, name: p.name, category: p.category,
      month: m, monthIndex: i, revenue, units, regionShare: p.region,
    };
  })
);

const fmtUSD = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n.toFixed(0)}`;
const fmtUSDFull = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function SectionLabel({ index, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{
        fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.08em",
        color: COLORS.brass, whiteSpace: "nowrap",
      }}>§{index}</span>
      <span style={{
        fontFamily: FONTS.body, fontSize: 12, letterSpacing: "0.14em",
        textTransform: "uppercase", color: COLORS.inkMuted, whiteSpace: "nowrap",
      }}>{title}</span>
      <span style={{ flex: 1, height: 1, background: COLORS.border }} />
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONTS.body, fontSize: 12.5, fontWeight: 500,
        padding: "6px 13px", borderRadius: 999,
        border: `1px solid ${active ? COLORS.brass : COLORS.border}`,
        background: active ? "rgba(201,162,75,0.14)" : "transparent",
        color: active ? COLORS.brass : COLORS.inkMuted,
        cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: FONTS.body, fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", color: COLORS.inkFaint,
        }}>{label}</span>
        <Icon size={15} color={accent} strokeWidth={1.75} />
      </div>
      <div style={{
        fontFamily: FONTS.mono, fontSize: 26, color: COLORS.ink, fontWeight: 600,
        letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{value}</div>
      {sub && (
        <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.inkMuted }}>{sub}</div>
      )}
    </div>
  );
}

function CardShell({ children, style }) {
  return (
    <div style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      borderRadius: 6, padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: COLORS.surface2, border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 4, padding: "8px 12px", fontFamily: FONTS.mono, fontSize: 12,
    }}>
      {label && <div style={{ color: COLORS.inkMuted, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || COLORS.ink }}>
          {p.name}: {fmtUSDFull(p.value)}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export default function RevenueLedger() {
  const [period, setPeriod] = useState("all");
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("All");
  const [search, setSearch] = useState("");

  const periodMonths = PERIODS.find((p) => p.key === period).months;
  const minMonthIndex = 18 - periodMonths;

  const filtered = useMemo(() => {
    return ROWS.filter((r) => r.monthIndex >= minMonthIndex)
      .filter((r) => category === "All" || r.category === category)
      .map((r) => {
        const share = region === "All" ? 1 : r.regionShare[region] || 0;
        return { ...r, effRevenue: r.revenue * share, effUnits: r.units * share };
      });
  }, [minMonthIndex, category, region]);

  const totalRevenue = filtered.reduce((s, r) => s + r.effRevenue, 0);
  const totalUnits = filtered.reduce((s, r) => s + r.effUnits, 0);
  const avgOrderValue = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  const byProductAll = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      map.set(r.name, (map.get(r.name) || 0) + r.effRevenue);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const topProduct = byProductAll[0] || ["—", 0];

  const trendData = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      map.set(r.month, (map.get(r.month) || 0) + r.effRevenue);
    });
    return MONTHS.filter((m) => map.has(m)).map((m) => ({ month: m, revenue: map.get(m) }));
  }, [filtered]);

  const topProductsData = byProductAll.slice(0, 7).map(([name, revenue]) => ({ name, revenue }));

  const categoryData = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      map.set(r.category, (map.get(r.category) || 0) + r.effRevenue);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const regionData = useMemo(() => {
    const map = new Map(REGIONS.slice(1).map((r) => [r, 0]));
    ROWS.filter((r) => r.monthIndex >= minMonthIndex)
      .filter((r) => category === "All" || r.category === category)
      .forEach((r) => {
        Object.entries(r.regionShare).forEach(([reg, share]) => {
          map.set(reg, map.get(reg) + r.revenue * share);
        });
      });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [minMonthIndex, category]);

  const tableRows = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      if (!map.has(r.productId)) {
        map.set(r.productId, { name: r.name, category: r.category, units: 0, revenue: 0 });
      }
      const e = map.get(r.productId);
      e.units += r.effUnits;
      e.revenue += r.effRevenue;
    });
    let rows = [...map.values()].sort((a, b) => b.revenue - a.revenue);
    if (search.trim()) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    const total = rows.reduce((s, r) => s + r.revenue, 0) || 1;
    return rows.map((r) => ({ ...r, share: r.revenue / total }));
  }, [filtered, search]);

  return (
    <div style={{
      background: COLORS.bg, minHeight: "100vh", color: COLORS.ink,
      fontFamily: FONTS.body, padding: "28px 20px 60px",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: ${COLORS.inkFaint}; }
        input:focus, button:focus-visible { outline: 2px solid ${COLORS.brass}; outline-offset: 2px; }
        @media (max-width: 900px) {
          .rl-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rl-chart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* Masthead */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: 12, borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: 18, marginBottom: 26,
        }}>
          <div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.18em",
              color: COLORS.brass, marginBottom: 6,
            }}>LEDGER · SALES &amp; REVENUE</div>
            <h1 style={{
              fontFamily: FONTS.display, fontSize: 30, fontWeight: 600,
              margin: 0, letterSpacing: "-0.01em",
            }}>Revenue Analysis Desk</h1>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.inkMuted, marginTop: 4 }}>
              Synthetic dataset · 18-month ledger
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: "0.1em",
              color: COLORS.teal, border: `1px solid ${COLORS.teal}`,
              borderRadius: 999, padding: "4px 10px",
            }}>● SAMPLE DATA</span>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: FONTS.body, fontSize: 12.5, fontWeight: 500,
              color: COLORS.bg, background: COLORS.brass, border: "none",
              borderRadius: 5, padding: "8px 14px", cursor: "pointer",
            }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <SectionLabel index="01" title="Filters" />
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center",
          marginBottom: 30, paddingBottom: 22, borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {PERIODS.map((p) => (
              <Chip key={p.key} active={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</Chip>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: COLORS.border }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: COLORS.border }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REGIONS.map((r) => (
              <Chip key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Chip>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <SectionLabel index="02" title="Overview" />
        <div className="rl-kpi-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 34,
        }}>
          <KpiCard icon={Wallet} label="Total Revenue" value={fmtUSDFull(totalRevenue)} accent={COLORS.brass}
            sub={`${period === "all" ? "All time" : PERIODS.find(p=>p.key===period).label}`} />
          <KpiCard icon={Package} label="Units Sold" value={Math.round(totalUnits).toLocaleString()} accent={COLORS.teal}
            sub={`${filtered.length ? tableRows.length : 0} SKUs in view`} />
          <KpiCard icon={TrendingUp} label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} accent={COLORS.slate}
            sub="Revenue ÷ units" />
          <KpiCard icon={Trophy} label="Top Product" value={topProduct[0]} accent={COLORS.rust}
            sub={fmtUSDFull(topProduct[1]) + " revenue"} />
        </div>

        {/* Trend + Top products */}
        <SectionLabel index="03" title="Revenue Trend & Leaders" />
        <div className="rl-chart-grid" style={{
          display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 34,
        }}>
          <CardShell>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Revenue Trend</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: COLORS.inkFaint, marginBottom: 14 }}>
              Monthly revenue across the filtered period
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.brass} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.brass} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: COLORS.inkFaint, fontSize: 10.5, fontFamily: FONTS.mono }}
                  axisLine={{ stroke: COLORS.border }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmtUSD} tick={{ fill: COLORS.inkFaint, fontSize: 10.5, fontFamily: FONTS.mono }}
                  axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.brass}
                  strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardShell>

          <CardShell>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Top Products by Revenue</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11.5, color: COLORS.inkFaint, marginBottom: 14 }}>
              Ranked, current filters
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.border} horizontal={false} />
                <XAxis type="number" tickFormatter={fmtUSD} tick={{ fill: COLORS.inkFaint, fontSize: 10, fontFamily: FONTS.mono }}
                  axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: COLORS.inkMuted, fontSize: 10.5, fontFamily: FONTS.body }}
                  axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.teal} radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </CardShell>
        </div>

        {/* Category + Region */}
        <SectionLabel index="04" title="Breakdown by Category & Region" />
        <div className="rl-chart-grid" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 34,
        }}>
          <CardShell>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>By Category</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={COLORS.surface} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {categoryData.map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: COLORS.inkMuted, flex: 1 }}>{c.name}</span>
                    <span style={{ fontFamily: FONTS.mono, color: COLORS.ink }}>{fmtUSD(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardShell>

          <CardShell>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>By Region</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: COLORS.inkMuted, fontSize: 11, fontFamily: FONTS.body }}
                  axisLine={{ stroke: COLORS.border }} tickLine={false} />
                <YAxis tickFormatter={fmtUSD} tick={{ fill: COLORS.inkFaint, fontSize: 10.5, fontFamily: FONTS.mono }}
                  axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" name="Revenue" radius={[3, 3, 0, 0]} barSize={40}>
                  {regionData.map((_, i) => (
                    <Cell key={i} fill={region === "All" || region === regionData[i].name ? COLORS.slate : COLORS.borderLight} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardShell>
        </div>

        {/* Table */}
        <SectionLabel index="05" title="Product Performance" />
        <CardShell style={{ padding: 0 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600 }}>Ledger · {tableRows.length} SKUs</span>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, background: COLORS.surface2,
              border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "6px 10px",
            }}>
              <Search size={13} color={COLORS.inkFaint} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by product name…"
                style={{
                  background: "transparent", border: "none", color: COLORS.ink,
                  fontFamily: FONTS.body, fontSize: 12.5, width: 180,
                }}
              />
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {["#", "Product", "Category", "Units", "Revenue", "Share"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i >= 3 ? "right" : "left", padding: "10px 20px",
                      fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: COLORS.inkFaint, fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={r.name} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "11px 20px", color: COLORS.inkFaint, fontFamily: FONTS.mono, fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: "11px 20px", color: COLORS.ink }}>{r.name}</td>
                    <td style={{ padding: "11px 20px" }}>
                      <span style={{
                        fontSize: 11, color: COLORS.inkMuted, border: `1px solid ${COLORS.border}`,
                        borderRadius: 999, padding: "2px 9px",
                      }}>{r.category}</span>
                    </td>
                    <td style={{ padding: "11px 20px", textAlign: "right", fontFamily: FONTS.mono, color: COLORS.inkMuted }}>
                      {Math.round(r.units).toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 20px", textAlign: "right", fontFamily: FONTS.mono, color: COLORS.brass, fontWeight: 600 }}>
                      {fmtUSDFull(r.revenue)}
                    </td>
                    <td style={{ padding: "11px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <div style={{ width: 60, height: 4, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${(r.share * 100).toFixed(1)}%`, height: "100%", background: COLORS.teal }} />
                        </div>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: COLORS.inkMuted, width: 34 }}>
                          {(r.share * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: COLORS.inkFaint }}>
                    No products match the current filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardShell>

        <div style={{
          marginTop: 30, textAlign: "center", fontFamily: FONTS.mono,
          fontSize: 10.5, color: COLORS.inkFaint, letterSpacing: "0.06em",
        }}>
          REVENUE LEDGER · SYNTHETIC DATASET FOR DEMONSTRATION PURPOSES
        </div>
      </div>
    </div>
  );
}
