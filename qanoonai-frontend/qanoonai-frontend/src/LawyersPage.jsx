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
    --warning: #f0a500;
    --font-display: 'Syne', sans-serif;
    --font-body: 'Inter', sans-serif;
  }
  body { background: var(--bg-main); color: var(--text-primary); font-family: var(--font-body); }

  .nav { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 3rem; border-bottom: 1px solid var(--border); background: rgba(8,20,30,0.95); position: sticky; top: 0; z-index: 100; }
  .logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; cursor: pointer; }
  .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-links { display: flex; align-items: center; gap: 2rem; }
  .nav-links a { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: color 0.2s; }
  .nav-links a:hover { color: var(--accent); }
  .nav-links a.active { color: var(--accent); }
  .nav-btns { display: flex; gap: 0.8rem; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--accent); padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.88rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); }
  .btn-primary { background: var(--accent); border: none; color: #08141e; padding: 0.5rem 1.4rem; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }

  .hero { text-align: center; padding: 3rem 2rem 1.5rem; max-width: 800px; margin: 0 auto; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.25); color: var(--accent); padding: 0.35rem 0.9rem; border-radius: 100px; font-size: 0.78rem; font-weight: 500; margin-bottom: 1.5rem; }
  .hero h1 { font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.8rem; }
  .hero h1 span { color: var(--accent); }
  .hero p { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; }

  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

  .filters { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; align-items: center; flex-wrap: wrap; }
  .search-bar { flex: 1; min-width: 240px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem 1rem; color: var(--text-primary); font-size: 0.9rem; font-family: var(--font-body); outline: none; }
  .search-bar:focus { border-color: var(--accent); }
  .search-bar::placeholder { color: var(--text-muted); }
  .chip { padding: 0.55rem 1rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); border-radius: 100px; font-size: 0.82rem; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
  .chip:hover { border-color: var(--accent); color: var(--accent); }
  .chip.active { background: var(--accent); color: #08141e; border-color: var(--accent); font-weight: 600; }

  .lawyers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
  .lawyer-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.3rem; transition: all 0.2s; }
  .lawyer-card:hover { border-color: rgba(0,196,180,0.4); transform: translateY(-2px); }
  .lawyer-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 1rem; }
  .lawyer-avatar { width: 56px; height: 56px; background: rgba(0,196,180,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
  .lawyer-name { font-family: var(--font-display); font-size: 1rem; font-weight: 600; margin-bottom: 2px; }
  .lawyer-spec { font-size: 0.8rem; color: var(--text-secondary); }
  .verified-tick { color: var(--accent); font-size: 14px; margin-left: 4px; }
  .lawyer-rating { font-size: 0.78rem; color: var(--warning); margin-top: 4px; }
  .lawyer-meta { display: flex; gap: 1rem; margin-bottom: 1rem; padding: 0.6rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .meta-item { flex: 1; text-align: center; }
  .meta-val { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
  .meta-label { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
  .lawyer-price { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .price-val { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--accent); }
  .price-val.free { color: var(--text-secondary); }
  .price-label { font-size: 0.72rem; color: var(--text-muted); }
  .hire-btn { width: 100%; padding: 0.65rem; background: var(--accent); color: #08141e; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .hire-btn:hover { background: var(--accent2); }
  .lock-icon { font-size: 12px; }

  .loading-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
  .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; }
  .empty-icon { font-size: 48px; margin-bottom: 1rem; opacity: 0.5; }

  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; align-items: center; justify-content: center; padding: 1rem; }
  .modal-overlay.active { display: flex; }
  .modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 440px; text-align: center; animation: slideUp 0.3s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .modal-icon { width: 72px; height: 72px; background: rgba(0,196,180,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 1.2rem; }
  .modal h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; margin-bottom: 0.6rem; }
  .modal p { color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.5rem; }
  .modal-btns { display: flex; gap: 0.8rem; }
  .modal-btn { flex: 1; padding: 0.8rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
  .modal-btn.primary { background: var(--accent); border: none; color: #08141e; }
  .modal-btn.secondary { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }

  footer { border-top: 1px solid var(--border); padding: 2rem 3rem; text-align: center; color: var(--text-muted); font-size: 0.82rem; margin-top: 3rem; }

  @media (max-width: 768px) {
    .lawyers-grid { grid-template-columns: 1fr; }
    .hero h1 { font-size: 1.8rem; }
  }
`;

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("user");

  // Load lawyers from backend
  useEffect(() => {
    loadLawyers();
  }, []);

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lawyers/`);
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

  const cats = ["All", "Family Law", "Criminal Law", "Civil Law", "Banking Law", "Corporate Law", "Property Law", "Free"];

  const filtered = lawyers.filter(l => {
    const matchFilter = filter === "All" || (filter === "Free" ? l.is_free : l.specialization === filter);
    const matchSearch = (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
                        (l.specialization || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleHire = (lawyer) => {
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user.role === "customer") {
        navigate("/customer");
      } else {
        alert("Only customers can hire lawyers. Please login as a customer.");
      }
    } else {
      setSelectedLawyer(lawyer);
      setShowLoginModal(true);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 3) return (parts[1][0] + parts[2][0]).toUpperCase();
    if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <style>{styles}</style>

      <nav className="nav">
        <div className="logo" onClick={() => navigate("/")}>
          <div className="logo-icon">⚖</div>
          QanoonAI
        </div>
        <div className="nav-links">
          <a onClick={() => navigate("/features")}>Features</a>
          <a className="active" onClick={() => navigate("/lawyers")}>Lawyers</a>
          <a onClick={() => navigate("/#pricing")}>Pricing</a>
          <a onClick={() => navigate("/about")}>About</a>
        </div>
        <div className="nav-btns">
          <button className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-badge">⚖ Verified Lawyers</div>
        <h1>Find the Perfect <span>Lawyer</span> for Your Case</h1>
        <p>Browse verified lawyers across Pakistan. View ratings, experience, and specializations before hiring.</p>
      </div>

      <div className="container">
        <div className="filters">
          <input className="search-bar" placeholder="Search by name or specialization..." value={search} onChange={e => setSearch(e.target.value)} />
          {cats.map(c => (
            <button key={c} className={`chip ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div style={{fontSize: "32px", marginBottom: "1rem"}}>⏳</div>
            Loading lawyers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚖</div>
            <h3 style={{fontFamily: "var(--font-display)", marginBottom: "0.5rem", color: "var(--text-secondary)"}}>No verified lawyers available yet</h3>
            <p style={{fontSize: "0.9rem"}}>Lawyers need to be verified by admin before appearing here. Check back soon!</p>
          </div>
        ) : (
          <>
            <div style={{color:"var(--text-secondary)", fontSize:"0.88rem", marginBottom:"1rem"}}>
              Showing {filtered.length} of {lawyers.length} verified lawyers
            </div>
            <div className="lawyers-grid">
              {filtered.map(l => (
                <div key={l.id} className="lawyer-card">
                  <div className="lawyer-top">
                    <div className="lawyer-avatar">{getInitials(l.name)}</div>
                    <div style={{flex:1}}>
                      <div className="lawyer-name">{l.name} <span className="verified-tick">✓</span></div>
                      <div className="lawyer-spec">{l.specialization} · {l.experience_years || 0} yrs</div>
                      <div className="lawyer-rating">⭐ {l.rating || 0} ({l.total_reviews || 0} reviews)</div>
                    </div>
                  </div>
                  <div className="lawyer-meta">
                    <div className="meta-item">
                      <div className="meta-val">{l.total_cases || 0}</div>
                      <div className="meta-label">Cases</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-val">{l.experience_years || 0} yrs</div>
                      <div className="meta-label">Experience</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-val">{l.rating || 0}⭐</div>
                      <div className="meta-label">Rating</div>
                    </div>
                  </div>
                  <div className="lawyer-price">
                    <div>
                      <div className={`price-val ${l.is_free ? "free" : ""}`}>{l.is_free ? "Free" : `Rs. ${l.consultation_fee}`}</div>
                      <div className="price-label">{l.is_free ? "New lawyer" : "per consultation"}</div>
                    </div>
                  </div>
                  <button className="hire-btn" onClick={() => handleHire(l)}>
                    {!isLoggedIn && <span className="lock-icon">🔒</span>}
                    {l.is_free ? "Chat Free" : "Hire Now"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={`modal-overlay ${showLoginModal ? "active" : ""}`} onClick={(e) => e.target.classList.contains('modal-overlay') && setShowLoginModal(false)}>
        <div className="modal">
          <div className="modal-icon">🔒</div>
          <h2>Login Required</h2>
          <p>To hire <strong style={{color:"var(--accent)"}}>{selectedLawyer?.name}</strong> and start a secure consultation, please login or create a free account.</p>
          <div className="modal-btns">
            <button className="modal-btn secondary" onClick={() => navigate("/login")}>Login</button>
            <button className="modal-btn primary" onClick={() => navigate("/signup")}>Create Free Account</button>
          </div>
        </div>
      </div>

      <footer>© 2026 QanoonAI · Pakistan's AI-Powered Legal Platform · For guidance only. Consult a licensed lawyer.</footer>
    </>
  );
}
