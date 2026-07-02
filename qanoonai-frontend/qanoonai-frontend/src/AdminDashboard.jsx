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

// ── Toast ─────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  if (!msg) return null;
  const bg = type === "error" ? "rgba(224,85,85,0.15)" : "rgba(0,196,180,0.15)";
  const border = type === "error" ? "rgba(224,85,85,0.4)" : "rgba(0,196,180,0.4)";
  const color = type === "error" ? "#e05555" : "#00c4b4";
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, padding: "12px 20px", background: bg, border: `1px solid ${border}`, borderRadius: 10, color, fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
      {type === "error" ? "❌" : "✅"} {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

const inp = { background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-body)", outline: "none", width: "100%" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 };
const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

// ── Cases Section ────────────────────────────────────────
function CasesSection() {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [cats, setCats] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  // Case add modal
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const emptyForm = { title: "", summary: "", citation: "", category: "", court: "", year: "", judge: "", full_judgment: "", case_number: "", keywords: "", status: "active" };
  const [form, setForm] = useState(emptyForm);

  // Category management modal
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "", icon: "" });
  const [savingCat, setSavingCat] = useState(false);
  const [managedCats, setManagedCats] = useState([]);

  // Count by category
  const [catStats, setCatStats] = useState({});

  useEffect(() => { loadCats(); loadStats(); }, []);
  useEffect(() => { load(page, catFilter, search); }, [page, catFilter]);

  const loadStats = async () => {
    try { const r = await fetch(`${API_URL}/api/cases/count`); const d = await r.json(); setCatStats(d.by_category || {}); } catch {}
  };

  const loadCats = async () => {
    try {
      const r = await fetch(`${API_URL}/api/cases/categories`);
      const d = await r.json();
      if (d.categories) { setManagedCats(d.categories); setCats(["All", ...d.categories.map(c => c.name)]); }
    } catch {}
  };

  const load = async (pg = 1, cat = catFilter, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (cat && cat !== "All") params.set("category", cat);
      if (q) params.set("search", q);
      const r = await fetch(`${API_URL}/api/cases/?${params}`);
      const d = await r.json();
      if (d.cases) { setCases(d.cases); setTotal(d.total); setTotalPages(d.total_pages || 1); }
    } catch {} finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); load(1, catFilter, search); };

  const handleCatChange = (c) => { setCatFilter(c); setPage(1); };

  const saveCase = async () => {
    if (!form.title.trim() || !form.category.trim()) { setToast({ msg: "Title and Category are required.", type: "error" }); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/cases/`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify({ ...form, year: form.year ? parseInt(form.year) : 0 }) });
      const d = await r.json();
      if (r.ok) { setToast({ msg: "Case added successfully!", type: "success" }); setShowAdd(false); setForm(emptyForm); load(1, catFilter, search); loadStats(); }
      else setToast({ msg: d.detail || "Failed to add case", type: "error" });
    } catch { setToast({ msg: "Network error", type: "error" }); }
    finally { setSaving(false); }
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) { setToast({ msg: "Category name is required.", type: "error" }); return; }
    setSavingCat(true);
    try {
      const r = await fetch(`${API_URL}/api/cases/categories`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify(catForm) });
      const d = await r.json();
      if (r.ok) { setToast({ msg: "Category added!", type: "success" }); setCatForm({ name: "", description: "", icon: "" }); loadCats(); setCats(prev => [...prev, catForm.name]); }
      else setToast({ msg: d.detail || "Failed", type: "error" });
    } catch { setToast({ msg: "Network error", type: "error" }); }
    finally { setSavingCat(false); }
  };

  const deleteCat = async (id, name) => {
    if (!id) { setToast({ msg: "Cannot delete derived category (no separate record)", type: "error" }); return; }
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const r = await fetch(`${API_URL}/api/cases/categories/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
      if (r.ok) { setToast({ msg: "Category deleted", type: "success" }); loadCats(); }
      else setToast({ msg: "Failed to delete", type: "error" });
    } catch { setToast({ msg: "Network error", type: "error" }); }
  };

  const deleteCase = async (id) => {
    if (!confirm("Delete this case?")) return;
    try {
      const r = await fetch(`${API_URL}/api/cases/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
      if (r.ok) { setToast({ msg: "Case deleted", type: "success" }); load(page, catFilter, search); loadStats(); }
      else setToast({ msg: "Failed to delete", type: "error" });
    } catch {}
  };

  const PaginationBar = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 4 }}>
          Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} cases
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          <PBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</PBtn>
          {start > 1 && <><PBtn onClick={() => setPage(1)}>1</PBtn><span style={{ color: "var(--text-muted)" }}>…</span></>}
          {pages.map(n => <PBtn key={n} active={n === page} onClick={() => setPage(n)}>{n}</PBtn>)}
          {end < totalPages && <><span style={{ color: "var(--text-muted)" }}>…</span><PBtn onClick={() => setPage(totalPages)}>{totalPages}</PBtn></>}
          <PBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</PBtn>
        </div>
      </div>
    );
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Category Stats */}
      {Object.keys(catStats).length > 0 && (
        <div className="full-table-card" style={{ marginBottom: "1rem" }}>
          <div className="full-table-header">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>📊 Cases by Category</div>
          </div>
          <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(catStats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} style={{ padding: "6px 12px", background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}>
                <span style={{ color: "var(--text-secondary)" }}>{cat}</span>
                <span style={{ marginLeft: 8, background: "rgba(0,196,180,0.15)", color: "var(--accent)", borderRadius: 100, padding: "1px 8px", fontWeight: 600 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases table */}
      <div className="full-table-card">
        <div className="full-table-header">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            📁 Case Law Database ({total.toLocaleString()} total)
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input className="search-input" placeholder="Search title, citation, court..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
            <select className="filter-select" value={catFilter} onChange={e => handleCatChange(e.target.value)}>
              <option value="All">All Categories</option>
              {cats.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="refresh-btn" onClick={handleSearch}>🔍</button>
            <button className="refresh-btn" onClick={() => { load(page); loadStats(); }}>🔄</button>
            <button onClick={() => setShowCatMgr(true)} style={{ padding: "6px 14px", background: "rgba(0,196,180,0.1)", border: "1px solid rgba(0,196,180,0.3)", borderRadius: 8, color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>🗂 Categories</button>
            <button onClick={() => setShowAdd(true)} style={{ padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#08141e", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>+ Add Case</button>
          </div>
        </div>

        {loading ? <div className="loading">⏳ Loading cases...</div>
          : cases.length === 0 ? <div className="empty">No cases found</div>
          : (
            <>
              <table>
                <thead><tr><th>Title</th><th>Citation</th><th>Category</th><th>Court</th><th>Year</th><th>Action</th></tr></thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id}>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 250 }} title={c.title}>{c.title || "—"}</div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{c.citation || "—"}</td>
                      <td><span className="badge pending" style={{ fontSize: 11 }}>{c.category || "—"}</span></td>
                      <td style={{ fontSize: "0.78rem" }}>{c.court || "—"}</td>
                      <td>{c.year || "—"}</td>
                      <td>
                        <button onClick={() => deleteCase(c.id)} className="act-btn reject" title="Delete case">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationBar />
            </>
          )}
      </div>

      {/* Add Case Modal */}
      {showAdd && (
        <Modal title="📁 Add New Case" onClose={() => setShowAdd(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>Case Title <span style={{ color: "var(--danger)" }}>*</span></label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Full case title" />
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Category <span style={{ color: "var(--danger)" }}>*</span></label>
                <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">— Select —</option>
                  {cats.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>Summary / Description <span style={{ color: "var(--danger)" }}>*</span></label>
              <textarea style={{ ...inp, height: 90, resize: "vertical" }} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief description of the case" />
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Citation</label>
                <input style={inp} value={form.citation} onChange={e => setForm(f => ({ ...f, citation: e.target.value }))} placeholder="e.g. PLD 2021 SC 123" />
              </div>
              <div>
                <label style={lbl}>Case Number</label>
                <input style={inp} value={form.case_number} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))} placeholder="e.g. C.P. 442/2021" />
              </div>
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Court</label>
                <input style={inp} value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} placeholder="e.g. Supreme Court of Pakistan" />
              </div>
              <div>
                <label style={lbl}>Year</label>
                <input style={inp} type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2021" min="1947" max="2030" />
              </div>
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Judge</label>
                <input style={inp} value={form.judge} onChange={e => setForm(f => ({ ...f, judge: e.target.value }))} placeholder="Presiding judge name" />
              </div>
              <div>
                <label style={lbl}>Keywords (comma-separated)</label>
                <input style={inp} value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g. divorce, custody, meher" />
              </div>
            </div>
            <div>
              <label style={lbl}>Full Judgment / Case Content</label>
              <textarea style={{ ...inp, height: 130, resize: "vertical" }} value={form.full_judgment} onChange={e => setForm(f => ({ ...f, full_judgment: e.target.value }))} placeholder="Paste the full judgment text here (optional)" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: "8px 20px", background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>Cancel</button>
              <button onClick={saveCase} disabled={saving} style={{ padding: "8px 24px", background: saving ? "rgba(0,196,180,0.4)" : "var(--accent)", border: "none", borderRadius: 8, color: "#08141e", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>{saving ? "Saving..." : "💾 Save Case"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Management Modal */}
      {showCatMgr && (
        <Modal title="🗂 Category Management" onClose={() => setShowCatMgr(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Add category form */}
            <div style={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>+ Add New Category</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 10, marginBottom: 10 }}>
                <input style={inp} placeholder="Category name (e.g. Tax Law)" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                <input style={inp} placeholder="Icon" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} />
              </div>
              <input style={{ ...inp, marginBottom: 10 }} placeholder="Description (optional)" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
              <button onClick={saveCat} disabled={savingCat} style={{ padding: "7px 18px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#08141e", fontWeight: 700, cursor: savingCat ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>{savingCat ? "Saving..." : "Add Category"}</button>
            </div>

            {/* Existing categories */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Existing Categories ({managedCats.length})</div>
              {managedCats.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No categories yet. Categories are auto-derived from cases.</div>
                : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {managedCats.map(c => (
                      <div key={c.id || c.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                        {c.icon && <span>{c.icon}</span>}
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{c.name}</span>
                        {catStats[c.name] && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({catStats[c.name]})</span>}
                        {c.id && <button onClick={() => deleteCat(c.id, c.name)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 14, lineHeight: 1, opacity: 0.6, padding: "0 2px" }} onMouseEnter={e => e.target.style.opacity = "1"} onMouseLeave={e => e.target.style.opacity = "0.6"}>×</button>}
                      </div>
                    ))}
                  </div>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function PBtn({ children, disabled, active, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "4px 10px", background: active ? "var(--accent)" : "var(--bg-card2)", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, borderRadius: 6, color: active ? "#08141e" : disabled ? "var(--text-muted)" : "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", fontWeight: active ? 700 : 400, transition: "all 0.15s" }}>
      {children}
    </button>
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
