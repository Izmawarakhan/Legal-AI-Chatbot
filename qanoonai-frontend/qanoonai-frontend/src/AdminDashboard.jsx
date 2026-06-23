import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg-main: #08141e;
    --bg-dark: #0d1f2d;
    --bg-card: #0f2336;
    --bg-card2: #132840;
    --accent: #00c4b4;
    --accent2: #00e5d3;
    --text-primary: #e8f4f8;
    --text-secondary: #7ca3b8;
    --text-muted: #4a6b7d;
    --border: rgba(0,196,180,0.15);
    --danger: #e05555;
    --success: #00c4b4;
    --warning: #f0a500;
    --font-display: 'Syne', sans-serif;
    --font-body: 'Inter', sans-serif;
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
  .admin-profile { display: flex; align-items: center; gap: 10px; }
  .admin-avatar { width: 36px; height: 36px; background: rgba(0,196,180,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: var(--accent); }
  .admin-info p { font-size: 0.82rem; font-weight: 500; }
  .admin-info span { font-size: 0.72rem; color: var(--text-muted); }
  .logout-btn { width: 100%; padding: 0.5rem; margin-top: 0.8rem; background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.3); color: var(--danger); border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); }

  .main-content { margin-left: 240px; flex: 1; padding: 0; }
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: var(--bg-dark); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 40; }
  .topbar-title { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; }
  .topbar-right { display: flex; align-items: center; gap: 1rem; }
  .refresh-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--accent); padding: 0.4rem 0.9rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; font-family: var(--font-body); }

  .page-content { padding: 1.5rem 2rem; }

  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.2rem; }
  .stat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
  .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .stat-icon.teal { background: rgba(0,196,180,0.15); }
  .stat-icon.blue { background: rgba(59,130,246,0.15); }
  .stat-icon.green { background: rgba(34,197,94,0.15); }
  .stat-icon.orange { background: rgba(249,115,22,0.15); }
  .stat-num { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.2rem; }
  .stat-label { font-size: 0.78rem; color: var(--text-muted); }

  .full-table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 1.5rem; }
  .full-table-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .search-input { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.9rem; color: var(--text-primary); font-size: 0.85rem; font-family: var(--font-body); outline: none; width: 220px; }
  .filter-select { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.8rem; color: var(--text-secondary); font-size: 0.82rem; font-family: var(--font-body); cursor: pointer; }

  table { width: 100%; border-collapse: collapse; }
  th { padding: 0.6rem 1rem; font-size: 0.72rem; color: var(--text-muted); font-weight: 500; text-align: left; border-bottom: 1px solid var(--border); text-transform: uppercase; }
  td { padding: 0.7rem 1rem; font-size: 0.82rem; color: var(--text-secondary); border-bottom: 1px solid rgba(0,196,180,0.05); }
  tr:hover td { background: rgba(0,196,180,0.03); }
  .user-cell { display: flex; align-items: center; gap: 8px; }
  .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: rgba(0,196,180,0.15); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--accent); flex-shrink: 0; }
  .user-name { font-weight: 500; color: var(--text-primary); font-size: 0.82rem; }
  .user-email { font-size: 0.7rem; color: var(--text-muted); }

  .badge { padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.7rem; font-weight: 600; }
  .badge.verified { background: rgba(0,196,180,0.1); color: var(--accent); }
  .badge.pending { background: rgba(240,165,0,0.1); color: var(--warning); }
  .badge.rejected { background: rgba(224,85,85,0.1); color: var(--danger); }

  .action-btns { display: flex; gap: 4px; }
  .act-btn { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600; cursor: pointer; border: none; font-family: var(--font-body); transition: all 0.2s; }
  .act-btn.approve { background: rgba(0,196,180,0.15); color: var(--accent); }
  .act-btn.approve:hover { background: rgba(0,196,180,0.3); }
  .act-btn.reject { background: rgba(224,85,85,0.1); color: var(--danger); }
  .act-btn.reject:hover { background: rgba(224,85,85,0.25); }
  .act-btn.view { background: rgba(59,130,246,0.1); color: #60a5fa; }

  .loading { text-align: center; padding: 3rem; color: var(--text-secondary); }
  .empty { text-align: center; padding: 3rem; color: var(--text-muted); }
`;

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Load lawyers from backend
  useEffect(() => {
    loadLawyers();
  }, []);

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lawyers/all`);
      const data = await response.json();
      if (data.lawyers) {
        setLawyers(data.lawyers);
      }
    } catch (err) {
      console.error("Failed to load lawyers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (lawyerId) => {
    try {
      const response = await fetch(`${API_URL}/api/lawyers/${lawyerId}/verify`, {
        method: "PUT"
      });
      if (response.ok) {
        alert("Lawyer verified successfully!");
        loadLawyers();  // Refresh
      } else {
        alert("Failed to verify lawyer");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async (lawyerId) => {
    if (!confirm("Are you sure you want to reject this lawyer?")) return;
    try {
      const response = await fetch(`${API_URL}/api/lawyers/${lawyerId}/reject`, {
        method: "PUT"
      });
      if (response.ok) {
        alert("Lawyer rejected");
        loadLawyers();  // Refresh
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 3) return (parts[1][0] + parts[2][0]).toUpperCase();
    if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Stats
  const totalLawyers = lawyers.length;
  const verifiedCount = lawyers.filter(l => l.status === "verified").length;
  const pendingCount = lawyers.filter(l => l.status === "pending").length;
  const rejectedCount = lawyers.filter(l => l.status === "rejected").length;

  // Filtered lawyers
  const filtered = lawyers.filter(l => {
    const matchFilter = filter === "all" || l.status === filter;
    const matchSearch = (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
                        (l.email || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const navItems = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"lawyers", icon:"⚖️", label:"Lawyers", badge: pendingCount > 0 ? pendingCount : null },
    { id:"customers", icon:"👥", label:"Customers" },
    { id:"cases", icon:"📁", label:"Cases" },
    { id:"payments", icon:"💳", label:"Payments" },
  ];

  const pageTitles = {
    overview: "Dashboard Overview",
    lawyers: "Lawyers Management",
    customers: "Customers Management",
    cases: "Cases Management",
    payments: "Payments",
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
              {item.badge && <span style={{marginLeft:"auto", background:"rgba(240,165,0,0.15)", color:"var(--warning)", fontSize:"0.65rem", padding:"0.15rem 0.5rem", borderRadius:"100px"}}>{item.badge}</span>}
            </div>
          ))}
          <div className="sidebar-bottom">
            <div className="admin-profile">
              <div className="admin-avatar">AD</div>
              <div className="admin-info">
                <p>Admin</p>
                <span>admin@qanoonai.com</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        <div className="main-content">
          <div className="topbar">
            <div className="topbar-title">{pageTitles[activePage]}</div>
            <div className="topbar-right">
              <button className="refresh-btn" onClick={loadLawyers}>🔄 Refresh</button>
            </div>
          </div>

          <div className="page-content">
            {activePage === "overview" && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-top">
                      <div className="stat-icon blue">⚖️</div>
                    </div>
                    <div className="stat-num">{totalLawyers}</div>
                    <div className="stat-label">Total Lawyers</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-top">
                      <div className="stat-icon teal">✅</div>
                    </div>
                    <div className="stat-num">{verifiedCount}</div>
                    <div className="stat-label">Verified Lawyers</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-top">
                      <div className="stat-icon orange">⏳</div>
                    </div>
                    <div className="stat-num">{pendingCount}</div>
                    <div className="stat-label">Pending Verification</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-top">
                      <div className="stat-icon green">❌</div>
                    </div>
                    <div className="stat-num">{rejectedCount}</div>
                    <div className="stat-label">Rejected</div>
                  </div>
                </div>

                {pendingCount > 0 && (
                  <div className="full-table-card">
                    <div className="full-table-header">
                      <div style={{fontFamily:"var(--font-display)", fontWeight:600}}>⏳ Pending Verifications ({pendingCount})</div>
                    </div>
                    <table>
                      <thead>
                        <tr><th>Lawyer</th><th>Specialization</th><th>Experience</th><th>Bar #</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {lawyers.filter(l => l.status === "pending").map(l => (
                          <tr key={l.id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">{getInitials(l.name)}</div>
                                <div>
                                  <div className="user-name">{l.name}</div>
                                  <div className="user-email">{l.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{l.specialization}</td>
                            <td>{l.experience_years} years</td>
                            <td style={{fontFamily:"monospace"}}>{l.bar_number}</td>
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
              </>
            )}

            {activePage === "lawyers" && (
              <div className="full-table-card">
                <div className="full-table-header">
                  <div style={{fontFamily:"var(--font-display)", fontWeight:600}}>⚖️ All Lawyers ({totalLawyers})</div>
                  <div style={{display:"flex", gap:"0.6rem", alignItems:"center"}}>
                    <input className="search-input" placeholder="Search lawyer..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="loading">⏳ Loading lawyers...</div>
                ) : filtered.length === 0 ? (
                  <div className="empty">No lawyers found</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Lawyer</th>
                        <th>Specialization</th>
                        <th>Experience</th>
                        <th>Bar Council #</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(l => (
                        <tr key={l.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">{getInitials(l.name)}</div>
                              <div>
                                <div className="user-name">{l.name}</div>
                                <div className="user-email">{l.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{l.specialization}</td>
                          <td>{l.experience_years} years</td>
                          <td style={{fontFamily:"monospace"}}>{l.bar_number}</td>
                          <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                          <td>
                            <div className="action-btns">
                              {l.status === "pending" && <>
                                <button className="act-btn approve" onClick={() => handleVerify(l.id)}>✓ Verify</button>
                                <button className="act-btn reject" onClick={() => handleReject(l.id)}>✕ Reject</button>
                              </>}
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

            {activePage === "customers" && <div className="empty">👥 Customers section — coming soon</div>}
            {activePage === "cases" && <div className="empty">📁 Cases section — coming soon</div>}
            {activePage === "payments" && <div className="empty">💳 Payments section — coming soon</div>}
          </div>
        </div>
      </div>
    </>
  );
}
