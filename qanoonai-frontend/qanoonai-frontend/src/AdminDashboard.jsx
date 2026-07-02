import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg-main: #08141e; --bg-dark: #0d1f2d; --bg-card: #0f2336; --bg-card2: #132840;
    --accent: #00c4b4; --accent2: #00e5d3;
    --text-primary: #e8f4f8; --text-secondary: #7ca3b8; --text-muted: #4a6b7d;
    --border: rgba(0,196,180,0.15); --danger: #e05555; --success: #00c4b4;
    --warning: #f0a500; --font-display: 'Syne', sans-serif; --font-body: 'Inter', sans-serif;
  }
  body { background: var(--bg-main); color: var(--text-primary); font-family: var(--font-body); }
  .admin-layout { display: flex; min-height: 100vh; }
  .sidebar { width: 240px; background: var(--bg-dark); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 50; }
  .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 1.5rem 1.2rem; border-bottom: 1px solid var(--border); font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; }
  .logo-icon { width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .sidebar-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 1rem 1.2rem 0.4rem; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 0.7rem 1.2rem; cursor: pointer; color: var(--text-secondary); font-size: 0.88rem; font-weight: 500; transition: all 0.2s; border-left: 3px solid transparent; margin: 1px 0; }
  .nav-item:hover { color: var(--text-primary); background: rgba(0,196,180,0.06); }
  .nav-item.active { color: var(--accent); background: rgba(0,196,180,0.08); border-left-color: var(--accent); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-bottom { margin-top: auto; padding: 1rem; border-top: 1px solid var(--border); }
  .admin-avatar { width: 36px; height: 36px; background: rgba(0,196,180,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: var(--accent); }
  .admin-info p { font-size: 0.82rem; font-weight: 500; }
  .admin-info span { font-size: 0.72rem; color: var(--text-muted); }
  .logout-btn { width: 100%; padding: 0.5rem; margin-top: 0.8rem; background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.3); color: var(--danger); border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); }
  .main-content { margin-left: 240px; flex: 1; padding: 0; }
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: var(--bg-dark); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 40; }
  .topbar-title { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; }
  .refresh-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--accent); padding: 0.4rem 0.9rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; font-family: var(--font-body); }
  .page-content { padding: 1.5rem 2rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.2rem; }
  .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 0.8rem; }
  .stat-icon.teal { background: rgba(0,196,180,0.15); }
  .stat-icon.blue { background: rgba(59,130,246,0.15); }
  .stat-icon.green { background: rgba(34,197,94,0.15); }
  .stat-icon.orange { background: rgba(249,115,22,0.15); }
  .stat-icon.purple { background: rgba(168,85,247,0.15); }
  .stat-num { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.2rem; }
  .stat-label { font-size: 0.78rem; color: var(--text-muted); }
  .full-table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 1.5rem; }
  .full-table-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .search-input { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.9rem; color: var(--text-primary); font-size: 0.85rem; font-family: var(--font-body); outline: none; width: 220px; }
  .filter-select { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.8rem; color: var(--text-secondary); font-size: 0.82rem; font-family: var(--font-body); cursor: pointer; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 0.6rem 1rem; font-size: 0.72rem; color: var(--text-muted); font-weight: 500; text-align: left; border-bottom: 1px solid var(--border); text-transform: uppercase; }
  td { padding: 0.75rem 1rem; font-size: 0.82rem; color: var(--text-secondary); border-bottom: 1px solid rgba(0,196,180,0.05); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(0,196,180,0.03); }
  .user-cell { display: flex; align-items: center; gap: 8px; }
  .u-avatar { width: 30px; height: 30px; border-radius: 50%; background: rgba(0,196,180,0.15); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--accent); flex-shrink: 0; }
  .u-name { font-weight: 500; color: var(--text-primary); font-size: 0.82rem; }
  .u-sub { font-size: 0.7rem; color: var(--text-muted); }
  .badge { padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.7rem; font-weight: 600; }
  .badge.verified, .badge.active, .badge.completed { background: rgba(0,196,180,0.1); color: var(--accent); }
  .badge.pending { background: rgba(240,165,0,0.1); color: var(--warning); }
  .badge.rejected, .badge.failed, .badge.cancelled { background: rgba(224,85,85,0.1); color: var(--danger); }
  .badge.subscription { background: rgba(168,85,247,0.1); color: #c084fc; }
  .badge.consultation { background: rgba(59,130,246,0.1); color: #60a5fa; }
  .action-btns { display: flex; gap: 4px; }
  .act-btn { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600; cursor: pointer; border: none; font-family: var(--font-body); transition: all 0.2s; }
  .act-btn.approve { background: rgba(0,196,180,0.15); color: var(--accent); }
  .act-btn.approve:hover { background: rgba(0,196,180,0.3); }
  .act-btn.reject { background: rgba(224,85,85,0.1); color: var(--danger); }
  .act-btn.reject:hover { background: rgba(224,85,85,0.25); }
  .loading { text-align: center; padding: 3rem; color: var(--text-secondary); }
  .empty { text-align: center; padding: 3rem; color: var(--text-muted); }
`;

function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
}

function fmtCurrency(amount) {
  if (!amount && amount !== 0) return "—";
  return "PKR " + Number(amount).toLocaleString();
}

// ── Customers Section ────────────────────────────────────
function CustomersSection() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/auth/customers`);
      const d = await r.json();
      if (d.customers) setCustomers(d.customers);
    } catch {} finally { setLoading(false); }
  };

  const filtered = customers.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="full-table-card">
      <div className="full-table-header">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          👥 All Customers ({customers.length})
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <input className="search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="refresh-btn" onClick={load}>🔄</button>
        </div>
      </div>
      {loading ? <div className="loading">⏳ Loading customers...</div>
        : filtered.length === 0 ? <div className="empty">No customers found</div>
        : (
          <table>
            <thead>
              <tr><th>#</th><th>Customer</th><th>Phone</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td>
                    <div className="user-cell">
                      <div className="u-avatar">{getInitials(c.name)}</div>
                      <div>
                        <div className="u-name">{c.name || "—"}</div>
                        <div className="u-sub">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
}

// ── Cases Section ────────────────────────────────────────
function CasesSection() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [cats, setCats] = useState(["All"]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/cases/`);
      const d = await r.json();
      if (d.cases) {
        setCases(d.cases);
        const uniqueCats = ["All", ...Array.from(new Set(d.cases.map(c => c.category).filter(Boolean))).sort()];
        setCats(uniqueCats);
      }
    } catch {} finally { setLoading(false); }
  };

  const filtered = cases.filter(c => {
    const matchCat = catFilter === "All" || c.category === catFilter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (c.title || "").toLowerCase().includes(term) ||
      (c.citation || "").toLowerCase().includes(term) ||
      (c.court || "").toLowerCase().includes(term) ||
      (c.judge || "").toLowerCase().includes(term) ||
      String(c.year || "").includes(term);
    return matchCat && matchSearch;
  });

  return (
    <div className="full-table-card">
      <div className="full-table-header">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
          📁 Case Law Database ({cases.length} total)
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <input className="search-input" placeholder="Search title, citation, court..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="refresh-btn" onClick={load}>🔄</button>
        </div>
      </div>
      {loading ? <div className="loading">⏳ Loading cases...</div>
        : filtered.length === 0 ? <div className="empty">No cases found</div>
        : (
          <>
            <div style={{ padding: "0.5rem 1.5rem", fontSize: "0.78rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              Showing {filtered.length} of {cases.length} cases
            </div>
            <table>
              <thead>
                <tr><th>Title</th><th>Citation</th><th>Category</th><th>Court</th><th>Year</th></tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map(c => (
                  <tr key={c.id}>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }} title={c.title}>
                        {c.title || "—"}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{c.citation || "—"}</td>
                    <td><span className="badge pending">{c.category || "—"}</span></td>
                    <td style={{ fontSize: "0.78rem" }}>{c.court || "—"}</td>
                    <td>{c.year || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <div style={{ padding: "0.8rem 1.5rem", fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
                Showing first 200 results. Use search to narrow down.
              </div>
            )}
          </>
        )}
    </div>
  );
}

// ── Payments Section ─────────────────────────────────────
function PaymentsSection() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`${API_URL}/api/payments/stats`),
        fetch(`${API_URL}/api/payments/history/all?role=admin`),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (pRes.ok) { const d = await pRes.json(); if (d.payments) setPayments(d.payments); }
    } catch {} finally { setLoading(false); }
  };

  const filtered = payments.filter(p => {
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (p.plan_name || "").toLowerCase().includes(term) ||
      (p.lawyer_name || "").toLowerCase().includes(term) ||
      (p.transaction_id || "").toLowerCase().includes(term) ||
      (p.status || "").toLowerCase().includes(term);
    return matchType && matchSearch;
  });

  return (
    <>
      {stats && (
        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="stat-icon purple">💳</div>
            <div className="stat-num">{stats.total_payments}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">💰</div>
            <div className="stat-num">{fmtCurrency(stats.total_revenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon teal">🔄</div>
            <div className="stat-num">{stats.active_subscriptions}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">📞</div>
            <div className="stat-num">{stats.consultation_payments}</div>
            <div className="stat-label">Consultations Paid</div>
          </div>
        </div>
      )}
      <div className="full-table-card">
        <div className="full-table-header">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            💳 All Transactions ({payments.length})
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <input className="search-input" placeholder="Search plan, lawyer, txn ID..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="consultation">Consultation</option>
            </select>
            <button className="refresh-btn" onClick={load}>🔄</button>
          </div>
        </div>
        {loading ? <div className="loading">⏳ Loading payments...</div>
          : filtered.length === 0 ? <div className="empty">No payment records found</div>
          : (
            <table>
              <thead>
                <tr><th>Type</th><th>Plan / Details</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><span className={`badge ${p.type}`}>{p.type || "—"}</span></td>
                    <td>
                      <div className="u-name">{p.plan_name || p.lawyer_name || "—"}</div>
                      {p.transaction_id && <div className="u-sub" style={{ fontFamily: "monospace" }}>{p.transaction_id}</div>}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--accent)" }}>{fmtCurrency(p.amount)}</td>
                    <td><span className={`badge ${p.status}`}>{p.status || "—"}</span></td>
                    <td style={{ fontSize: "0.78rem" }}>{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────
export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [lawyers, setLawyers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => { loadLawyers(); loadCustomerCount(); }, []);

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/lawyers/all`);
      const d = await r.json();
      if (d.lawyers) setLawyers(d.lawyers);
    } catch {} finally { setLoading(false); }
  };

  const loadCustomerCount = async () => {
    try {
      const r = await fetch(`${API_URL}/api/auth/customers`);
      const d = await r.json();
      if (d.customers) setCustomers(d.customers);
    } catch {}
  };

  const handleVerify = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/lawyers/${id}/verify`, { method: "PUT" });
      if (r.ok) { alert("Lawyer verified!"); loadLawyers(); }
      else alert("Failed to verify");
    } catch (e) { alert(e.message); }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this lawyer?")) return;
    try {
      const r = await fetch(`${API_URL}/api/lawyers/${id}/reject`, { method: "PUT" });
      if (r.ok) { alert("Lawyer rejected"); loadLawyers(); }
    } catch (e) { alert(e.message); }
  };

  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/"); };

  const totalLawyers = lawyers.length;
  const verifiedCount = lawyers.filter(l => l.status === "verified").length;
  const pendingCount = lawyers.filter(l => l.status === "pending").length;
  const rejectedCount = lawyers.filter(l => l.status === "rejected").length;

  const filtered = lawyers.filter(l => {
    const matchFilter = filter === "all" || l.status === filter;
    const matchSearch = (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
                        (l.email || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const navItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "lawyers", icon: "⚖️", label: "Lawyers", badge: pendingCount > 0 ? pendingCount : null },
    { id: "customers", icon: "👥", label: "Customers", badge: customers.length > 0 ? customers.length : null },
    { id: "cases", icon: "📁", label: "Cases" },
    { id: "payments", icon: "💳", label: "Payments" },
  ];

  const pageTitles = { overview: "Dashboard Overview", lawyers: "Lawyers Management", customers: "Customers Management", cases: "Cases Management", payments: "Payments" };

  const refreshPage = () => {
    loadLawyers(); loadCustomerCount();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="admin-layout">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">⚖</div>
            QanoonAI
          </div>
          <div className="sidebar-label">Main Menu</div>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${activePage === item.id ? "active" : ""}`} onClick={() => setActivePage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span style={{ marginLeft: "auto", background: "rgba(240,165,0,0.15)", color: "var(--warning)", fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "100px" }}>{item.badge}</span>}
            </div>
          ))}
          <div className="sidebar-bottom">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="admin-avatar">AD</div>
              <div className="admin-info"><p>Admin</p><span>admin@qanoonai.com</span></div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        <div className="main-content">
          <div className="topbar">
            <div className="topbar-title">{pageTitles[activePage]}</div>
            <button className="refresh-btn" onClick={refreshPage}>🔄 Refresh</button>
          </div>

          <div className="page-content">

            {/* ── OVERVIEW ── */}
            {activePage === "overview" && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon blue">⚖️</div>
                    <div className="stat-num">{totalLawyers}</div>
                    <div className="stat-label">Total Lawyers</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon teal">✅</div>
                    <div className="stat-num">{verifiedCount}</div>
                    <div className="stat-label">Verified Lawyers</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon orange">⏳</div>
                    <div className="stat-num">{pendingCount}</div>
                    <div className="stat-label">Pending Verification</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green">👥</div>
                    <div className="stat-num">{customers.length}</div>
                    <div className="stat-label">Total Customers</div>
                  </div>
                </div>

                {pendingCount > 0 && (
                  <div className="full-table-card">
                    <div className="full-table-header">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>⏳ Pending Verifications ({pendingCount})</div>
                    </div>
                    <table>
                      <thead><tr><th>Lawyer</th><th>Specialization</th><th>Experience</th><th>Bar #</th><th>Action</th></tr></thead>
                      <tbody>
                        {lawyers.filter(l => l.status === "pending").map(l => (
                          <tr key={l.id}>
                            <td>
                              <div className="user-cell">
                                <div className="u-avatar">{getInitials(l.name)}</div>
                                <div><div className="u-name">{l.name}</div><div className="u-sub">{l.email}</div></div>
                              </div>
                            </td>
                            <td>{l.specialization}</td>
                            <td>{l.experience_years} yrs</td>
                            <td style={{ fontFamily: "monospace" }}>{l.bar_number}</td>
                            <td>
                              <div className="action-btns">
                                <button className="act-btn approve" onClick={() => handleVerify(l.id)}>✓ Verify</button>
                                <button className="act-btn reject" onClick={() => handleReject(l.id)}>✕ Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="full-table-card">
                  <div className="full-table-header">
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>👥 Recent Customers</div>
                  </div>
                  {customers.length === 0 ? <div className="empty">No customers yet</div> : (
                    <table>
                      <thead><tr><th>Customer</th><th>Phone</th><th>Joined</th></tr></thead>
                      <tbody>
                        {customers.slice(0, 5).map(c => (
                          <tr key={c.id}>
                            <td>
                              <div className="user-cell">
                                <div className="u-avatar">{getInitials(c.name)}</div>
                                <div><div className="u-name">{c.name}</div><div className="u-sub">{c.email}</div></div>
                              </div>
                            </td>
                            <td>{c.phone || "—"}</td>
                            <td>{fmtDate(c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ── LAWYERS ── */}
            {activePage === "lawyers" && (
              <div className="full-table-card">
                <div className="full-table-header">
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>⚖️ All Lawyers ({totalLawyers})</div>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <input className="search-input" placeholder="Search lawyer..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                {loading ? <div className="loading">⏳ Loading lawyers...</div>
                  : filtered.length === 0 ? <div className="empty">No lawyers found</div>
                  : (
                    <table>
                      <thead><tr><th>Lawyer</th><th>Specialization</th><th>Experience</th><th>Bar #</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {filtered.map(l => (
                          <tr key={l.id}>
                            <td>
                              <div className="user-cell">
                                <div className="u-avatar">{getInitials(l.name)}</div>
                                <div><div className="u-name">{l.name}</div><div className="u-sub">{l.email}</div></div>
                              </div>
                            </td>
                            <td>{l.specialization}</td>
                            <td>{l.experience_years} yrs</td>
                            <td style={{ fontFamily: "monospace" }}>{l.bar_number}</td>
                            <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                            <td>
                              <div className="action-btns">
                                {l.status === "pending" && <><button className="act-btn approve" onClick={() => handleVerify(l.id)}>✓ Verify</button><button className="act-btn reject" onClick={() => handleReject(l.id)}>✕ Reject</button></>}
                                {l.status === "verified" && <button className="act-btn reject" onClick={() => handleReject(l.id)}>Revoke</button>}
                                {l.status === "rejected" && <button className="act-btn approve" onClick={() => handleVerify(l.id)}>Re-verify</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            )}

            {/* ── CUSTOMERS ── */}
            {activePage === "customers" && <CustomersSection />}

            {/* ── CASES ── */}
            {activePage === "cases" && <CasesSection />}

            {/* ── PAYMENTS ── */}
            {activePage === "payments" && <PaymentsSection />}

          </div>
        </div>
      </div>
    </>
  );
}
