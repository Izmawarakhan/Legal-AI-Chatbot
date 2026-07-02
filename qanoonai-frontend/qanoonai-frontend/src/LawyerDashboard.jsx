import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { deriveKeyFromChatId, encryptMessage, decryptMessage } from "./utils/encryption";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || "https://chatbot.creoation.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg-main: #08141e; --bg-dark: #0d1f2d; --bg-card: #0f2336; --bg-card2: #132840;
    --accent: #00c4b4; --accent2: #00e5d3; --text-primary: #e8f4f8; --text-secondary: #7ca3b8;
    --text-muted: #4a6b7d; --border: rgba(0,196,180,0.15); --danger: #e05555; --warning: #f0a500;
    --font-display: 'Syne', sans-serif; --font-body: 'Inter', sans-serif;
  }
  body { background: var(--bg-main); color: var(--text-primary); font-family: var(--font-body); }
  .l-layout { display: flex; min-height: 100vh; }
  .l-sidebar { width: 240px; background: var(--bg-dark); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 50; }
  .l-logo { display: flex; align-items: center; gap: 10px; padding: 1.5rem 1.2rem; border-bottom: 1px solid var(--border); font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; }
  .l-logo-icon { width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .l-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 1rem 1.2rem 0.4rem; }
  .l-nav { display: flex; align-items: center; gap: 10px; padding: 0.7rem 1.2rem; cursor: pointer; color: var(--text-secondary); font-size: 0.88rem; font-weight: 500; transition: all 0.2s; border-left: 3px solid transparent; margin: 1px 0; position: relative; }
  .l-nav:hover { color: var(--text-primary); background: rgba(0,196,180,0.06); }
  .l-nav.active { color: var(--accent); background: rgba(0,196,180,0.08); border-left-color: var(--accent); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .nav-badge { position: absolute; right: 12px; background: var(--danger); color: white; font-size: 0.6rem; padding: 1px 6px; border-radius: 100px; font-weight: 700; }
  .l-bottom { margin-top: auto; padding: 1rem; border-top: 1px solid var(--border); }
  .l-profile { display: flex; align-items: center; gap: 10px; }
  .l-avatar { width: 36px; height: 36px; background: rgba(0,196,180,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--accent); }
  .l-profile p { font-size: 0.82rem; font-weight: 500; }
  .l-profile span { font-size: 0.7rem; color: var(--accent); }
  .logout-btn { width: 100%; padding: 0.5rem; margin-top: 0.8rem; background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.3); color: var(--danger); border-radius: 8px; font-size: 0.8rem; cursor: pointer; font-family: var(--font-body); }
  .l-main { margin-left: 240px; flex: 1; }
  .l-topbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: var(--bg-dark); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 40; }
  .l-title { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; }
  .l-topright { display: flex; align-items: center; gap: 1rem; }
  .availability { display: flex; align-items: center; gap: 8px; padding: 0.4rem 0.9rem; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.3); border-radius: 100px; color: var(--accent); font-size: 0.78rem; font-weight: 600; }
  .avail-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
  .notif { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
  .l-page { padding: 1.5rem 2rem; }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.2rem; }
  .stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
  .stat-ico { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .stat-ico.teal { background: rgba(0,196,180,0.15); } .stat-ico.blue { background: rgba(59,130,246,0.15); } .stat-ico.green { background: rgba(34,197,94,0.15); } .stat-ico.orange { background: rgba(249,115,22,0.15); }
  .stat-num { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.2rem; }
  .stat-label { font-size: 0.78rem; color: var(--text-muted); }
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.2rem; margin-bottom: 1.5rem; }
  .verify-banner { background: rgba(240,165,0,0.1); border: 1px solid rgba(240,165,0,0.3); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
  .verify-banner.verified { background: rgba(0,196,180,0.08); border-color: rgba(0,196,180,0.3); }
  .verify-icon { font-size: 32px; } .verify-text h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 600; margin-bottom: 4px; } .verify-text p { font-size: 0.85rem; color: var(--text-secondary); }
  .research-hero { background: linear-gradient(135deg, rgba(0,196,180,0.12), rgba(59,130,246,0.08)); border: 1px solid rgba(0,196,180,0.3); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; text-align: center; }
  .research-hero h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; margin-bottom: 0.4rem; }
  .research-hero p { color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 1.2rem; }
  .search-big { max-width: 600px; margin: 0 auto; display: flex; gap: 8px; }
  .search-big input { flex: 1; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 10px; padding: 0.8rem 1rem; color: var(--text-primary); font-size: 0.9rem; font-family: var(--font-body); outline: none; }
  .search-big input:focus { border-color: var(--accent); }
  .search-big button { padding: 0.8rem 1.5rem; background: var(--accent); color: #08141e; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
  .chip-row { display: flex; gap: 8px; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
  .chip { padding: 0.35rem 0.8rem; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.2); color: var(--accent); font-size: 0.75rem; border-radius: 100px; cursor: pointer; font-family: var(--font-body); }
  .chip.active { background: var(--accent); color: #08141e; border-color: var(--accent); }
  .past-case-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.2rem; margin-bottom: 0.8rem; transition: all 0.2s; cursor: pointer; }
  .past-case-card:hover { border-color: rgba(0,196,180,0.3); transform: translateY(-1px); }
  .past-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; gap: 1rem; }
  .past-title { font-family: var(--font-display); font-size: 1rem; font-weight: 600; margin-bottom: 4px; }
  .past-citation { font-size: 0.72rem; color: var(--accent); font-family: monospace; }
  .past-category { padding: 0.25rem 0.7rem; background: rgba(0,196,180,0.1); color: var(--accent); border-radius: 100px; font-size: 0.7rem; font-weight: 600; flex-shrink: 0; }
  .past-summary { font-size: 0.83rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.8rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .past-meta { display: flex; gap: 1.2rem; flex-wrap: wrap; }
  .past-meta span { font-size: 0.72rem; color: var(--text-muted); } .past-meta strong { color: var(--text-secondary); font-weight: 500; }
  .loading { text-align: center; padding: 3rem; color: var(--text-secondary); }
  .empty { text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; }
  .case-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .case-modal { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
  .case-modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-shrink: 0; }
  .case-modal-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; }
  .case-modal-meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .case-modal-meta span { font-size: 0.78rem; color: var(--text-secondary); background: var(--bg-card); padding: 0.25rem 0.6rem; border-radius: 6px; }
  .case-modal-close { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; flex-shrink: 0; }
  .case-modal-close:hover { color: var(--danger); }
  .case-modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
  .case-modal-section { margin-bottom: 1.5rem; }
  .case-modal-section h3 { font-family: var(--font-display); font-size: 0.95rem; font-weight: 600; color: var(--accent); margin-bottom: 0.5rem; }
  .case-modal-text { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.8; white-space: pre-wrap; word-wrap: break-word; }
  .case-modal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
  .info-item { background: var(--bg-card); border-radius: 10px; padding: 0.8rem; }
  .info-label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
  .info-value { font-size: 0.9rem; font-weight: 500; }
  .profile-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .profile-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; display: block; }
  .profile-input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem 0.9rem; color: var(--text-primary); font-family: var(--font-body); font-size: 0.88rem; outline: none; }
  .profile-input:focus { border-color: var(--accent); }
  .profile-full { grid-column: 1 / -1; }
  .save-btn { padding: 0.7rem 2rem; background: var(--accent); color: #08141e; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: var(--font-body); margin-top: 1rem; font-size: 0.9rem; }
  /* CHAT */
  .chats-layout { display: flex; height: calc(100vh - 120px); }
  .chats-list { width: 320px; background: var(--bg-dark); border-right: 1px solid var(--border); overflow-y: auto; border-radius: 14px 0 0 14px; }
  .chats-list-header { padding: 1rem; border-bottom: 1px solid var(--border); font-family: var(--font-display); font-weight: 600; }
  .chat-item { padding: 0.8rem 1rem; border-bottom: 1px solid rgba(0,196,180,0.05); cursor: pointer; }
  .chat-item:hover { background: rgba(0,196,180,0.05); }
  .chat-item.active { background: rgba(0,196,180,0.1); border-left: 3px solid var(--accent); }
  .chat-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .chat-item-name { font-weight: 600; font-size: 0.88rem; }
  .chat-item-unread { background: var(--accent); color: #08141e; font-size: 0.6rem; padding: 2px 6px; border-radius: 100px; font-weight: 700; }
  .chat-item-last { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chat-item-time { font-size: 0.68rem; color: var(--text-muted); }
  .chat-area { flex: 1; display: flex; flex-direction: column; border-radius: 0 14px 14px 0; overflow: hidden; }
  .chat-area-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; background: var(--bg-dark); }
  .chat-area-avatar { width: 40px; height: 40px; background: rgba(0,196,180,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--accent); font-size: 14px; }
  .chat-area-name { font-family: var(--font-display); font-weight: 600; }
  .chat-area-status { font-size: 0.72rem; color: var(--accent); }
  .chat-area-msgs { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .chat-msg { max-width: 70%; padding: 0.7rem 1rem; border-radius: 14px; font-size: 0.85rem; line-height: 1.5; }
  .chat-msg.sent { background: rgba(0,196,180,0.15); border: 1px solid rgba(0,196,180,0.25); align-self: flex-end; border-radius: 14px 14px 4px 14px; }
  .chat-msg.received { background: var(--bg-card); border: 1px solid var(--border); align-self: flex-start; border-radius: 14px 14px 14px 4px; color: var(--text-secondary); }
  .chat-msg-time { font-size: 0.65rem; color: var(--text-muted); margin-top: 4px; }
  .chat-area-input { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 8px; }
  .chat-area-input input { flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem 1rem; color: var(--text-primary); font-size: 0.88rem; font-family: var(--font-body); outline: none; }
  .chat-area-input input:focus { border-color: var(--accent); }
  .chat-area-input button { padding: 0.7rem 1.2rem; background: var(--accent); color: #08141e; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
  .no-chat-selected { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
`;

function OverviewPage({ lawyerData }) {
  const v = lawyerData?.verified || false;
  return (<>
    <div className={`verify-banner ${v ? "verified" : ""}`}><div className="verify-icon">{v ? "✅" : "⏳"}</div><div className="verify-text"><h3>{v ? "Profile Verified" : "Verification Pending"}</h3><p>{v ? "Your profile is verified and visible to customers." : "Under review by admin."}</p></div></div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-top"><div className="stat-ico teal">💰</div></div><div className="stat-num">Rs. {lawyerData?.consultation_fee || 0}</div><div className="stat-label">Fee</div></div>
      <div className="stat-card"><div className="stat-top"><div className="stat-ico blue">📁</div></div><div className="stat-num">{lawyerData?.total_cases || 0}</div><div className="stat-label">Cases</div></div>
      <div className="stat-card"><div className="stat-top"><div className="stat-ico green">⭐</div></div><div className="stat-num">{lawyerData?.rating || 0}</div><div className="stat-label">Rating</div></div>
      <div className="stat-card"><div className="stat-top"><div className="stat-ico orange">📋</div></div><div className="stat-num">{lawyerData?.experience_years || 0}</div><div className="stat-label">Years Exp</div></div>
    </div>
  </>);
}

function PastCasesPage() {
  const [allCases, setAllCases] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [cats, setCats] = useState(["All"]);

  useEffect(() => { loadCases(); }, []);

  // Re-filter whenever search text or category changes
  useEffect(() => {
    if (allCases.length === 0) return;
    runFilter(search, category, allCases);
  }, [search, category, allCases]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/cases/`);
      const d = await r.json();
      if (d.cases) {
        setAllCases(d.cases);
        // Build category list from actual data in DB
        const uniqueCats = ["All", ...Array.from(new Set(d.cases.map(c => c.category).filter(Boolean))).sort()];
        setCats(uniqueCats);
      }
    }
    catch {} finally { setLoading(false); }
  };

  const runFilter = (q, cat, data) => {
    let filtered = [...data];
    if (cat && cat !== "All") filtered = filtered.filter(c => c.category === cat);
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.title || "").toLowerCase().includes(term) ||
        (c.citation || "").toLowerCase().includes(term) ||
        (c.summary || "").toLowerCase().includes(term) ||
        (c.court || "").toLowerCase().includes(term) ||
        (c.judge || "").toLowerCase().includes(term) ||
        (c.category || "").toLowerCase().includes(term) ||
        String(c.year || "").includes(term)
      );
    }
    setCases(filtered);
  };

  const handleSearchChange = (e) => { setSearch(e.target.value); };
  const handleCategoryChange = (cat) => { setCategory(cat); };

  const keywordSearch = async () => {
    if (!search.trim()) { runFilter("", category, allCases); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/cases/search?q=${encodeURIComponent(search)}`);
      const d = await r.json();
      if (d.cases && d.cases.length > 0) {
        const filtered = category !== "All" ? d.cases.filter(c => c.category === category) : d.cases;
        setCases(filtered);
      } else {
        runFilter(search, category, allCases);
      }
    } catch { runFilter(search, category, allCases); }
    finally { setLoading(false); }
  };

  const openCase = async (c) => { setSelectedCase(c); try { const r = await fetch(`${API_URL}/api/cases/${c.id}`); const d = await r.json(); setCaseDetail(d); } catch { setCaseDetail(c); } };

  return (<>
    <div className="research-hero"><h2>📚 Legal Research Database</h2><p>Access Pakistani case laws and precedents</p>
      <div className="search-big"><input placeholder="Search cases by keyword..." value={search} onChange={handleSearchChange} onKeyDown={e => e.key === "Enter" && keywordSearch()} /><button onClick={keywordSearch}>🔍 Search</button></div>
      <div className="chip-row">{cats.map(c => (<button key={c} className={`chip ${category === c ? "active" : ""}`} onClick={() => handleCategoryChange(c)}>{c}</button>))}</div>
    </div>
    {loading ? <div className="loading">⏳ Loading...</div> : cases.length === 0 ? <div className="empty">📚 No cases found</div> : <>
      <div style={{color:"var(--text-secondary)", fontSize:"0.88rem", marginBottom:"1rem"}}>Showing {cases.length} results</div>
      {cases.map(c => (<div key={c.id} className="past-case-card" onClick={() => openCase(c)}><div className="past-top"><div style={{flex:1}}><div className="past-title">{c.title}</div><div className="past-citation">{c.citation}</div></div><div className="past-category">{c.category}</div></div><div className="past-summary">{c.summary}</div><div className="past-meta"><span><strong>Court:</strong> {c.court}</span>{c.year > 0 && <span><strong>Year:</strong> {c.year}</span>}{c.judge && <span><strong>Judge:</strong> {c.judge}</span>}</div></div>))}
    </>}
    {selectedCase && <div className="case-modal-overlay" onClick={e => e.target.classList.contains('case-modal-overlay') && setSelectedCase(null)}><div className="case-modal"><div className="case-modal-header"><div><div className="case-modal-title">{selectedCase.title}</div><div style={{fontFamily:"monospace", fontSize:"0.82rem", color:"var(--accent)"}}>{selectedCase.citation}</div><div className="case-modal-meta"><span>📂 {selectedCase.category}</span><span>🏛 {selectedCase.court}</span>{selectedCase.year > 0 && <span>📅 {selectedCase.year}</span>}{selectedCase.judge && <span>👨‍⚖️ {selectedCase.judge}</span>}</div></div><button className="case-modal-close" onClick={() => setSelectedCase(null)}>✕</button></div><div className="case-modal-body"><div className="case-modal-section"><h3>📋 Summary</h3><div className="case-modal-text">{caseDetail?.summary || selectedCase.summary}</div></div>{caseDetail?.full_judgment && <div className="case-modal-section"><h3>📜 Full Judgment</h3><div className="case-modal-text">{caseDetail.full_judgment}</div></div>}</div></div></div>}
  </>);
}

function LawyerChatsPage() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const chatKeyRef = useRef(null); // E2EE key in memory only
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { loadChats(); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => {
    if (!activeChat) return;
    const i = setInterval(() => loadMessages(activeChat.id), 5000);
    return () => clearInterval(i);
  }, [activeChat]);

  const loadChats = async () => {
    setLoading(true);
    try { const r = await fetch(`${API_URL}/api/chats/user/${user.id}?role=lawyer`); const d = await r.json(); if (d.chats) setChats(d.chats); }
    catch {} finally { setLoading(false); }
  };

  const loadMessages = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/chats/${id}`);
      const d = await r.json();
      if (d.messages && chatKeyRef.current) {
        const decrypted = d.messages.map(m => ({ ...m, message: decryptMessage(m.message, chatKeyRef.current) }));
        setMessages(decrypted);
      } else if (d.messages) {
        setMessages(d.messages);
      }
    } catch {}
  };

  const openChat = async (c) => {
    chatKeyRef.current = await deriveKeyFromChatId(c.id);
    setActiveChat(c);
    loadMessages(c.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    setSending(true);
    try {
      const key = chatKeyRef.current;
      const payload = key ? encryptMessage(input.trim(), key) : input.trim();
      await fetch(`${API_URL}/api/chats/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: activeChat.id, sender_id: user.id, sender_role: "lawyer", receiver_id: activeChat.customer_id, message: payload, message_type: "text" }),
      });
      setInput(""); loadMessages(activeChat.id); loadChats();
    } catch {} finally { setSending(false); }
  };

  const formatTime = (ts) => { if (!ts) return ""; try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
  const getInitials = (n) => { if (!n) return "?"; const p = n.split(" "); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n[0].toUpperCase(); };

  return (
    <div className="chats-layout">
      <div className="chats-list">
        <div className="chats-list-header">👥 Client Messages ({chats.length})</div>
        {loading ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          : chats.length === 0 ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No client messages yet.</div>
          : chats.map(c => (
            <div key={c.id} className={`chat-item ${activeChat?.id === c.id ? "active" : ""}`} onClick={() => openChat(c)}>
              <div className="chat-item-top">
                <div className="chat-item-name">👤 {c.customer_name}</div>
                {c.unread > 0 && <span className="chat-item-unread">{c.unread}</span>}
              </div>
              <div className="chat-item-last">🔒 {c.last_message ? "Encrypted message" : "No messages yet"}</div>
              <div className="chat-item-time">{formatTime(c.last_time)}</div>
            </div>
          ))}
      </div>

      {!activeChat
        ? <div className="no-chat-selected">👈 Select a client to view messages</div>
        : <div className="chat-area">
            <div className="chat-area-header">
              <div className="chat-area-avatar">{getInitials(activeChat.customer_name)}</div>
              <div>
                <div className="chat-area-name">👤 {activeChat.customer_name}</div>
                <div className="chat-area-status" style={{ color: "#6ee7b7", fontSize: 11 }}>🔒 End-to-end encrypted</div>
              </div>
            </div>

            {/* E2EE notice */}
            <div style={{ background: "rgba(16,60,50,0.7)", borderBottom: "1px solid rgba(45,212,168,0.12)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontSize: 11, color: "#6ee7b7" }}>This chat is end-to-end encrypted. Messages can only be read by you and the recipient.</span>
            </div>

            <div className="chat-area-msgs" ref={scrollRef}>
              {messages.length === 0
                ? <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}><div style={{ fontSize: 48, marginBottom: "0.5rem" }}>💬</div><p>No messages yet.</p></div>
                : messages.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.sender_role === "lawyer" ? "sent" : "received"}`}>
                    {m.message}
                    <div className="chat-msg-time">{formatTime(m.timestamp)} 🔒</div>
                  </div>
                ))}
            </div>
            <div className="chat-area-input">
              <input placeholder="Reply to client... (end-to-end encrypted)" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
              <button onClick={sendMessage} disabled={sending || !input.trim()}>{sending ? "..." : "Send 🔒"}</button>
            </div>
          </div>
      }
    </div>
  );
}

// ============================================
// VERSION 2 CHATBOT — Full implementation
// ============================================

const CB_CATEGORIES = [
  { name: "Family Law", icon: "👨‍👩‍👧‍👦", desc: "Marriage, Divorce, Custody, Meher" },
  { name: "Criminal Law", icon: "⚖️", desc: "FIR, Bail, Murder, Theft, Fraud" },
  { name: "Labour Laws", icon: "👷", desc: "Employment, Wages, Termination" },
  { name: "Land & Property Laws", icon: "🏠", desc: "Property Disputes, Transfer, Fraud" },
  { name: "Islamic Religious Laws", icon: "☪️", desc: "Hudood, Waqf, Blasphemy" },
  { name: "Excise Taxation Laws", icon: "💰", desc: "Income Tax, Sales Tax, FBR" },
  { name: "Health & Medical Laws", icon: "🏥", desc: "Negligence, Hospital, Drug Cases" },
];

const CB_SUGGESTIONS = [
  "I want to file for divorce. What are my legal rights?",
  "Someone snatched my phone. How do I register an FIR?",
  "My employer terminated me without notice. What can I do?",
  "A hospital refused emergency treatment. Is this legal?",
];

const STT_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "ur-PK", label: "Urdu (اردو)" },
  { code: "en-PK", label: "English (PK)" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
];

function useCBVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [sttLang, setSttLang] = useState("en-US");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const onResultCallbackRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const speakQueueRef = useRef([]);
  const speakingIdxRef = useRef(0);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSttSupported(true);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sttLang;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setIsRecording(true); setIsListening(true); setTranscript("🎤 Listening..."); finalTranscriptRef.current = ""; };
    recognition.onresult = (e) => {
      let interim = "", finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      if (finalText) finalTranscriptRef.current += finalText;
      setTranscript(finalTranscriptRef.current || interim || "🎤 Listening...");
      clearTimeout(silenceTimerRef.current);
      if (finalTranscriptRef.current.trim()) {
        silenceTimerRef.current = setTimeout(() => {
          const text = finalTranscriptRef.current.trim();
          if (text && shouldRestartRef.current) {
            shouldRestartRef.current = false;
            try { recognition.stop(); } catch (_) {}
            if (onResultCallbackRef.current) onResultCallbackRef.current(text);
          }
        }, 2500);
      }
    };
    recognition.onend = () => {
      setIsRecording(false); setIsListening(false); clearTimeout(silenceTimerRef.current);
      if (shouldRestartRef.current) {
        const text = finalTranscriptRef.current.trim();
        if (text) { if (onResultCallbackRef.current) onResultCallbackRef.current(text); shouldRestartRef.current = false; }
        else { try { setTimeout(() => { if (shouldRestartRef.current) recognition.start(); }, 100); } catch (_) {} }
      }
    };
    recognition.onerror = (e) => {
      clearTimeout(silenceTimerRef.current);
      if (e.error === "no-speech") { if (shouldRestartRef.current) { try { setTimeout(() => { if (shouldRestartRef.current) recognition.start(); }, 100); } catch (_) {} } return; }
      if (e.error === "aborted") return;
      setTranscript(`Error: ${e.error}`); setIsRecording(false); setIsListening(false); shouldRestartRef.current = false;
    };
    recognitionRef.current = recognition;
    return () => { shouldRestartRef.current = false; clearTimeout(silenceTimerRef.current); try { recognition.stop(); } catch (_) {} };
  }, [sttLang]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    setTtsSupported(true);
    const loadVoices = () => {
      const av = window.speechSynthesis.getVoices(); setVoices(av);
      const isFemale = (v) => { const n = v.name.toLowerCase(); return n.includes("female")||n.includes("zira")||n.includes("heera")||n.includes("samantha")||n.includes("victoria")||n.includes("karen")||n.includes("veena")||n.includes("raveena"); };
      const urduF = av.findIndex(v => (v.lang.startsWith("ur")||v.lang==="ur-PK") && isFemale(v));
      if (urduF !== -1) { setSelectedVoiceIndex(urduF); return; }
      const urdu = av.findIndex(v => v.lang.startsWith("ur")||v.lang==="ur-PK");
      if (urdu !== -1) { setSelectedVoiceIndex(urdu); return; }
      const enF = av.findIndex(v => v.lang.startsWith("en") && isFemale(v));
      if (enF !== -1) setSelectedVoiceIndex(enF);
    };
    loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const splitIntoChunks = (text) => {
    const raw = text.match(/[^.!?۔؟\n]+[.!?۔؟\n]?/g) || [text];
    const chunks = []; let current = "";
    for (const piece of raw) { if ((current+piece).length > 180) { if (current.trim()) chunks.push(current.trim()); current = piece; } else current += piece; }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  const speakNextChunk = useCallback(() => {
    const queue = speakQueueRef.current; const idx = speakingIdxRef.current;
    if (idx >= queue.length) { setIsSpeaking(false); speakQueueRef.current = []; speakingIdxRef.current = 0; return; }
    const utterance = new SpeechSynthesisUtterance(queue[idx]);
    if (voices[selectedVoiceIndex]) utterance.voice = voices[selectedVoiceIndex];
    utterance.rate = /[؀-ۿ]/.test(queue[idx]) ? 0.9 : 1.0;
    utterance.onend = () => { speakingIdxRef.current += 1; setTimeout(() => speakNextChunk(), 50); };
    utterance.onerror = () => { speakingIdxRef.current += 1; setTimeout(() => speakNextChunk(), 50); };
    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoiceIndex]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const chunks = splitIntoChunks(text);
    speakQueueRef.current = chunks; speakingIdxRef.current = 0; setIsSpeaking(true);
    const keepAlive = setInterval(() => { if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); window.speechSynthesis.resume(); } else clearInterval(keepAlive); }, 10000);
    speakNextChunk();
  }, [speakNextChunk]);

  const stopSpeaking = useCallback(() => { if (window.speechSynthesis) { window.speechSynthesis.cancel(); speakQueueRef.current = []; speakingIdxRef.current = 0; setIsSpeaking(false); } }, []);

  const toggleMic = useCallback((onResult) => {
    if (!recognitionRef.current) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); speakQueueRef.current = []; setIsSpeaking(false); }
    if (!isRecording) {
      onResultCallbackRef.current = onResult; finalTranscriptRef.current = ""; shouldRestartRef.current = true; setTranscript("🎤 Listening...");
      try { recognitionRef.current.start(); } catch (e) { try { recognitionRef.current.stop(); } catch (_) {} setTimeout(() => { try { recognitionRef.current.start(); } catch (_) {} }, 150); }
    } else {
      shouldRestartRef.current = false; clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current.stop(); } catch (_) {}
      const text = finalTranscriptRef.current.trim();
      if (text && onResultCallbackRef.current) onResultCallbackRef.current(text);
      setIsRecording(false); setIsListening(false);
    }
  }, [isRecording, isSpeaking]);

  return { isRecording, isSpeaking, transcript, isListening, voices, selectedVoiceIndex, setSelectedVoiceIndex, sttSupported, ttsSupported, sttLang, setSttLang, toggleMic, speak, stopSpeaking };
}

function CBVoicePanel({ voice, onMicToggle }) {
  const c = { accent:"#2dd4a8", border:"rgba(45,212,168,0.12)", text:"#e2e8f0", textMuted:"#64748b", danger:"#ef4444", bgInput:"rgba(20,50,50,0.6)" };
  return (
    <div style={{padding:"0 0 8px 0"}}>
      <div style={{background:c.bgInput, border:`1px solid ${c.border}`, borderRadius:12, padding:"12px 16px", display:"flex", flexDirection:"column", gap:10, backdropFilter:"blur(16px)"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, background: voice.isListening ? "rgba(45,212,168,0.08)" : "rgba(255,255,255,0.03)", border:`1px solid ${voice.isListening ? "rgba(45,212,168,0.3)" : "rgba(255,255,255,0.06)"}`, minHeight:44}}>
          <span style={{fontSize:14}}>{voice.isRecording ? "🔴" : voice.isSpeaking ? "🔊" : "🎤"}</span>
          <span style={{flex:1, fontSize:13, color: voice.isListening ? c.text : c.textMuted}}>
            {voice.isRecording ? voice.transcript || "🎤 Listening..." : voice.isSpeaking ? "🔊 Speaking response..." : "Tap mic and speak — auto-sends after pause"}
          </span>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <span style={{fontSize:11, color:c.textMuted, textTransform:"uppercase", letterSpacing:"0.1em"}}>🎤 STT</span>
            <select value={voice.sttLang} onChange={e => voice.setSttLang(e.target.value)} style={{background:"rgba(20,50,50,0.8)", border:`1px solid ${c.border}`, borderRadius:8, padding:"6px 8px", color:c.text, fontSize:11, outline:"none", cursor:"pointer"}}>
              {STT_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6, flex:1, minWidth:150}}>
            <span style={{fontSize:11, color:c.textMuted, textTransform:"uppercase", letterSpacing:"0.1em"}}>🔊 TTS</span>
            <select value={voice.selectedVoiceIndex} onChange={e => voice.setSelectedVoiceIndex(Number(e.target.value))} style={{flex:1, minWidth:120, background:"rgba(20,50,50,0.8)", border:`1px solid ${c.border}`, borderRadius:8, padding:"6px 8px", color:c.text, fontSize:11, outline:"none", cursor:"pointer"}}>
              {voice.voices.map((v,i) => <option key={i} value={i}>{v.name} ({v.lang})</option>)}
            </select>
          </div>
          <button onClick={onMicToggle} style={{width:44, height:44, borderRadius:"50%", background: voice.isRecording ? "rgba(239,68,68,0.15)" : "rgba(45,212,168,0.1)", border:`2px solid ${voice.isRecording ? c.danger : "rgba(45,212,168,0.3)"}`, color: voice.isRecording ? c.danger : c.accent, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, animation: voice.isRecording ? "micPulse 1.2s ease-in-out infinite" : "none"}}>
            {voice.isRecording ? "⏹" : "🎙️"}
          </button>
          {voice.isSpeaking && <button onClick={voice.stopSpeaking} style={{padding:"6px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, color:c.danger, fontSize:12, cursor:"pointer"}}>⏹ Stop</button>}
        </div>
      </div>
    </div>
  );
}

function CBWelcomeScreen({ onSuggestion }) {
  const c = { accent:"#2dd4a8", border:"rgba(45,212,168,0.12)", text:"#e2e8f0", textDim:"#94a3b8", textMuted:"#64748b", glass:"rgba(16,42,42,0.55)", bgInput:"rgba(20,50,50,0.6)", accentDim:"rgba(45,212,168,0.15)" };
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:"0 24px", overflowY:"auto"}}>
      <style>{`@keyframes cbPulse { 0%,100%{box-shadow:0 0 40px rgba(45,212,168,0.2);}50%{box-shadow:0 0 60px rgba(45,212,168,0.4);}}`}</style>
      <div style={{width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,rgba(45,212,168,0.2),rgba(56,189,248,0.15))", border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, marginBottom:20, animation:"cbPulse 3s ease-in-out infinite"}}>⚖️</div>
      <h2 style={{fontSize:22, fontWeight:700, marginBottom:8, textAlign:"center", color:c.text}}>Tell Me What's On Your Mind</h2>
      <p style={{fontSize:14, color:c.textDim, marginBottom:24, textAlign:"center"}}>Describe your legal concern or pick a category below.</p>
      <div style={{display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", maxWidth:650, marginBottom:24}}>
        {CB_CATEGORIES.slice(0,4).map(cat => (
          <div key={cat.name} onClick={() => onSuggestion("I need legal help regarding " + cat.name)}
            style={{width:145, padding:"14px 12px", background:c.glass, border:`1px solid ${c.border}`, borderRadius:12, cursor:"pointer", transition:"all 0.2s"}}
            onMouseEnter={e => { e.currentTarget.style.borderColor=c.accent; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=c.border; e.currentTarget.style.transform="translateY(0)"; }}>
            <div style={{fontSize:22, marginBottom:6}}>{cat.icon}</div>
            <div style={{fontSize:12, fontWeight:600, marginBottom:3, color:c.text}}>{cat.name}</div>
            <div style={{fontSize:10, color:c.textMuted, lineHeight:1.4}}>{cat.desc}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:8, maxWidth:560, width:"100%"}}>
        {CB_SUGGESTIONS.map((s,i) => (
          <button key={i} onClick={() => onSuggestion(s)}
            style={{padding:"11px 16px", background:c.bgInput, border:`1px solid ${c.border}`, borderRadius:10, color:c.textDim, cursor:"pointer", textAlign:"left", fontSize:13, transition:"all 0.15s"}}
            onMouseEnter={e => { e.target.style.borderColor=c.accent; e.target.style.color=c.text; e.target.style.background=c.accentDim; }}
            onMouseLeave={e => { e.target.style.borderColor=c.border; e.target.style.color=c.textDim; e.target.style.background=c.bgInput; }}>
            💡 {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function CBMessageBubble({ msg, onSpeak, onStopSpeak, isSpeaking, ttsSupported }) {
  const isUser = msg.role === "user";
  const c = { accent:"#2dd4a8", border:"rgba(45,212,168,0.12)", text:"#e2e8f0", textMuted:"#64748b" };
  return (
    <div style={{display:"flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom:16}}>
      <div style={{maxWidth:"80%", padding:"14px 18px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isUser ? "linear-gradient(135deg,rgba(45,212,168,0.2),rgba(56,189,248,0.15))" : "rgba(20,45,45,0.6)", border:`1px solid ${isUser ? "rgba(45,212,168,0.2)" : c.border}`, fontSize:14, lineHeight:1.7, color:c.text, backdropFilter:"blur(8px)", whiteSpace:"pre-wrap"}}>
        {!isUser && (
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
            <div style={{display:"flex", alignItems:"center", gap:6}}><span style={{fontSize:14}}>⚖️</span><span style={{fontSize:12, fontWeight:600, color:c.accent}}>QanoonAI</span></div>
            {ttsSupported && <button onClick={() => isSpeaking ? onStopSpeak() : onSpeak(msg.content)} style={{background:"none", border:"none", cursor:"pointer", fontSize:14, opacity: isSpeaking ? 1 : 0.5, color: isSpeaking ? "#ef4444" : c.accent, transition:"all 0.2s"}}>{isSpeaking ? "⏹" : "🔊"}</button>}
          </div>
        )}
        {msg.content}
        {msg.images && msg.images.length > 0 && (
          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:10}}>
            {msg.images.map((img,idx) => <img key={idx} src={img.preview} alt={img.name} style={{maxWidth:180, maxHeight:130, borderRadius:8, border:"1px solid rgba(45,212,168,0.2)", objectFit:"cover", cursor:"pointer"}} onClick={() => window.open(img.preview,"_blank")} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CBTypingIndicator() {
  return (
    <div style={{display:"flex", justifyContent:"flex-start", marginBottom:16}}>
      <style>{`@keyframes cbBounce{0%,80%,100%{transform:scale(0.8);opacity:0.4;}40%{transform:scale(1.2);opacity:1;}}`}</style>
      <div style={{padding:"14px 18px", borderRadius:"16px 16px 16px 4px", background:"rgba(20,45,45,0.6)", border:"1px solid rgba(45,212,168,0.12)", display:"flex", alignItems:"center", gap:6}}>
        <span style={{fontSize:14}}>⚖️</span>
        <div style={{display:"flex", gap:4, alignItems:"center"}}>
          {[0,1,2].map(i => <div key={i} style={{width:7, height:7, borderRadius:"50%", background:"#2dd4a8", opacity:0.5, animation:`cbBounce 1.4s ease-in-out ${i*0.2}s infinite`}} />)}
        </div>
      </div>
    </div>
  );
}

function AIChatbotPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const voiceTriggeredRef = useRef(false);
  const lastMessageRef = useRef(null);
  const voice = useCBVoice();

  const cbColors = { bg:"#0a1a1a", bgSidebar:"rgba(8,28,28,0.95)", bgInput:"rgba(20,50,50,0.6)", bgHover:"rgba(30,70,65,0.5)", accent:"#2dd4a8", accentDim:"rgba(45,212,168,0.15)", accentGlow:"rgba(45,212,168,0.3)", blue:"#38bdf8", text:"#e2e8f0", textDim:"#94a3b8", textMuted:"#64748b", border:"rgba(45,212,168,0.12)", borderLight:"rgba(255,255,255,0.06)", glass:"rgba(16,42,42,0.55)", danger:"#ef4444" };

  const lawyerUser = JSON.parse(localStorage.getItem("user") || "{}");
  const lawyerUserId = lawyerUser.id || lawyerUser._id || lawyerUser.email || "lawyer";

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => {
    if (!voice.ttsSupported || !voiceTriggeredRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.content !== lastMessageRef.current) {
      lastMessageRef.current = lastMsg.content; voiceTriggeredRef.current = false;
      setTimeout(() => voice.speak(lastMsg.content), 400);
    }
  }, [messages, voice]);

  const fetchSessions = async () => {
    try {
      const r = await fetch(`${CHATBOT_URL}/api/chat/sessions?user_id=${encodeURIComponent(lawyerUserId)}`);
      if (r.ok) setSessions(await r.json());
    } catch {}
  };

  const loadSession = async (sid) => {
    try { const r = await fetch(`${CHATBOT_URL}/api/chat/history/${sid}`); if (r.ok) { const d = await r.json(); setActiveSession(sid); setMessages(d.messages || []); } } catch {}
  };

  const startNewChat = () => { setActiveSession(null); setMessages([]); setInput(""); setUploadedFiles([]); lastMessageRef.current = null; inputRef.current?.focus(); };

  const deleteSession = async (sid, e) => {
    e.stopPropagation();
    try { await fetch(`${CHATBOT_URL}/api/chat/session/${sid}`, { method:"DELETE" }); if (activeSession === sid) startNewChat(); fetchSessions(); } catch {}
  };

  const buildDocumentContext = () => {
    if (uploadedFiles.length === 0) return "";
    let ctx = "\n\n============================================\nUPLOADED DOCUMENTS\n============================================\n";
    uploadedFiles.forEach((f, i) => {
      if (f.extractedText && f.status === "ready" && f.extractedText.length > 100 && !f.extractedText.startsWith("[")) {
        ctx += `\n--- Document ${i+1}: ${f.name} ---\n${f.extractedText.slice(0,2500)}\n--- End ---\n`;
      } else {
        ctx += `\n[File ${i+1}: ${f.name}] ${f.extractedText || ""}\n`;
      }
    });
    return ctx + "\n============================================\n";
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg && uploadedFiles.length === 0) return;
    if (loading || uploadedFiles.some(f => f.status === "uploading")) return;
    const effectiveMsg = msg || "I have uploaded a document. Please analyze it and tell me what legal matters it covers.";
    const fileNames = uploadedFiles.map(f => f.name);
    const imagePreviews = uploadedFiles.filter(f => f.preview).map(f => ({ name:f.name, preview:f.preview }));
    const displayContent = uploadedFiles.length > 0 ? `${effectiveMsg}\n\n📎 Attached: ${fileNames.join(", ")}` : effectiveMsg;
    setMessages(prev => [...prev, { role:"user", content:displayContent, images: imagePreviews.length > 0 ? imagePreviews : undefined }]);
    setInput(""); setLoading(true); voice.stopSpeaking();
    const messageForAI = buildDocumentContext() ? `${effectiveMsg}${buildDocumentContext()}` : effectiveMsg;
    try {
      const r = await fetch(`${CHATBOT_URL}/api/chat`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message:messageForAI, session_id:activeSession, religion:"Muslim", user_id:lawyerUserId }) });
      if (r.ok) { const d = await r.json(); setActiveSession(d.session_id); setMessages(prev => [...prev, { role:"assistant", content:d.reply }]); fetchSessions(); setUploadedFiles([]); }
      else setMessages(prev => [...prev, { role:"assistant", content:"Sorry, something went wrong. Please try again." }]);
    } catch { setMessages(prev => [...prev, { role:"assistant", content:"Connection error. Please check if the chatbot server is running." }]); }
    finally { setLoading(false); }
  };

  const processFiles = async (files) => {
    for (const file of files) {
      const fObj = { id: Date.now()+"_"+Math.random().toString(36).slice(2,8), file, name:file.name||`file-${Date.now()}`, type:file.type, size:file.size, preview:null, extractedText:null, status:"uploading" };
      if (file.type.startsWith("image/")) fObj.preview = URL.createObjectURL(file);
      setUploadedFiles(prev => [...prev, fObj]);
      const isDoc = file.type==="application/pdf"||file.type==="text/plain"||/\.(pdf|txt|doc|docx)$/i.test(file.name||"");
      const isImg = file.type.startsWith("image/")||/\.(png|jpg|jpeg|webp)$/i.test(file.name||"");
      if (isDoc || isImg) {
        try {
          setUploading(true);
          const formData = new FormData(); formData.append("file", file);
          const endpoint = isImg ? `${CHATBOT_URL}/api/chat/analyze-image` : `${CHATBOT_URL}/api/chat/upload`;
          const r = await fetch(endpoint, { method:"POST", body:formData });
          if (r.ok) {
            const d = await r.json();
            setUploadedFiles(prev => prev.map(f => f.id===fObj.id ? { ...f, extractedText: isImg ? `[IMAGE ANALYSIS of ${fObj.name}]:\n${d.description||d.extracted_text||""}` : d.extracted_text, status:"ready" } : f));
          } else setUploadedFiles(prev => prev.map(f => f.id===fObj.id ? { ...f, status:"error", extractedText:"Upload failed" } : f));
        } catch { setUploadedFiles(prev => prev.map(f => f.id===fObj.id ? { ...f, status: isImg ? "ready" : "error", extractedText: isImg ? `[Image: ${fObj.name}]` : "Error" } : f)); }
        finally { setUploading(false); }
      } else setUploadedFiles(prev => prev.map(f => f.id===fObj.id ? { ...f, status:"ready" } : f));
    }
  };

  const handleFileSelect = async (e) => { await processFiles(Array.from(e.target.files)); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items; if (!items) return;
    const imgs = []; for (let i = 0; i < items.length; i++) { if (items[i].type.startsWith("image/")) { e.preventDefault(); const f = items[i].getAsFile(); if (f) imgs.push(new File([f], `screenshot-${Date.now()}.png`, { type:f.type })); } }
    if (imgs.length > 0) await processFiles(imgs);
  };
  const handleDrop = async (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); const files = Array.from(e.dataTransfer.files); if (files.length > 0) await processFiles(files); };
  const removeFile = (id) => setUploadedFiles(prev => { const r = prev.find(f => f.id===id); if (r?.preview) URL.revokeObjectURL(r.preview); return prev.filter(f => f.id!==id); });
  const handleMicToggle = () => { voice.toggleMic((t) => { if (t) { voiceTriggeredRef.current = true; sendMessage(t); } }); };

  return (
    <div style={{display:"flex", height:"calc(100vh - 120px)", background:"radial-gradient(ellipse at 20% 50%,rgba(16,80,70,0.4) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(20,60,90,0.3) 0%,transparent 50%),#0a1a1a", borderRadius:14, overflow:"hidden", fontFamily:"'Outfit','Inter',system-ui,sans-serif", color:cbColors.text}}
      onPaste={handlePaste} onDragOver={e=>{e.preventDefault();setIsDragOver(true);}} onDragLeave={e=>{e.preventDefault();setIsDragOver(false);}} onDrop={handleDrop}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes micPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,0.4);}50%{transform:scale(1.08);box-shadow:0 0 20px 4px rgba(239,68,68,0.25);}}`}</style>

      {/* Drag overlay */}
      {isDragOver && <div style={{position:"absolute",inset:0,zIndex:50,background:"rgba(45,212,168,0.08)",border:"3px dashed rgba(45,212,168,0.5)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
        <div style={{textAlign:"center",padding:"32px",background:"rgba(10,26,26,0.9)",borderRadius:16,border:"1px solid rgba(45,212,168,0.3)"}}><div style={{fontSize:40,marginBottom:10}}>📎</div><div style={{fontSize:15,fontWeight:600,color:cbColors.accent}}>Drop files here</div><div style={{fontSize:12,color:cbColors.textMuted,marginTop:4}}>PDF, DOCX, Images</div></div>
      </div>}

      {/* Sidebar */}
      <div style={{width:sidebarOpen?260:0,minWidth:sidebarOpen?260:0,background:cbColors.bgSidebar,borderRight:`1px solid ${cbColors.border}`,display:"flex",flexDirection:"column",transition:"all 0.3s ease",overflow:"hidden",backdropFilter:"blur(20px)"}}>
        <div style={{padding:"20px 16px 14px",borderBottom:`1px solid ${cbColors.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${cbColors.accent},${cbColors.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚖️</div>
            <span style={{fontSize:17,fontWeight:700}}>Qanoon<span style={{color:cbColors.accent}}>AI</span></span>
          </div>
          <button onClick={startNewChat} style={{width:"100%",padding:"10px 14px",background:`linear-gradient(135deg,${cbColors.accent},${cbColors.blue})`,color:"#0a1a1a",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>+ New Session</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
          <div style={{fontSize:10,fontWeight:600,color:cbColors.textMuted,padding:"6px 10px",textTransform:"uppercase",letterSpacing:"1px"}}>Recent Chats</div>
          {sessions.map(s => (
            <div key={s.session_id} onClick={() => loadSession(s.session_id)}
              style={{padding:"9px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,background:activeSession===s.session_id?cbColors.accentDim:"transparent",border:`1px solid ${activeSession===s.session_id?cbColors.border:"transparent"}`,display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(activeSession!==s.session_id)e.currentTarget.style.background=cbColors.bgHover;}}
              onMouseLeave={e=>{if(activeSession!==s.session_id)e.currentTarget.style.background="transparent";}}>
              <div style={{overflow:"hidden"}}><div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",textOverflow:"ellipsis",overflow:"hidden",maxWidth:160}}>{s.title||"New Chat"}</div><div style={{fontSize:10,color:cbColors.textMuted,marginTop:1}}>{s.message_count||0} messages</div></div>
              <button onClick={e=>deleteSession(s.session_id,e)} style={{background:"none",border:"none",color:cbColors.textMuted,cursor:"pointer",fontSize:12,padding:"2px 5px",opacity:0.5,transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.opacity="1";e.target.style.color="#ef4444";}} onMouseLeave={e=>{e.target.style.opacity="0.5";e.target.style.color=cbColors.textMuted;}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${cbColors.border}`,fontSize:11,color:cbColors.textMuted}}>⚠️ For guidance only. Consult a licensed lawyer.</div>
      </div>

      {/* Main area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,position:"relative"}}>
        {/* E2EE Banner */}
        <div style={{background:"rgba(16,60,50,0.85)",borderBottom:"1px solid rgba(45,212,168,0.15)",padding:"5px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexShrink:0}}>
          <span style={{fontSize:12}}>🔒</span>
          <span style={{fontSize:11,color:"#6ee7b7",fontWeight:500}}>This chat is end-to-end encrypted. Messages can only be read by you and the recipient.</span>
        </div>
        {/* Top bar */}
        <div style={{height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",borderBottom:`1px solid ${cbColors.border}`,background:"rgba(10,26,26,0.8)",backdropFilter:"blur(12px)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"none",border:"none",color:cbColors.textDim,cursor:"pointer",fontSize:18,padding:"3px 6px"}}>☰</button>
            <span style={{fontSize:13,color:cbColors.textDim,fontWeight:500}}>{activeSession?"Legal Consultation":"New Consultation"}</span>
          </div>
          {voice.sttSupported && <button onClick={()=>setShowVoicePanel(!showVoicePanel)} style={{padding:"5px 12px",display:"flex",alignItems:"center",gap:5,background:showVoicePanel?cbColors.accentDim:"transparent",color:showVoicePanel?cbColors.accent:cbColors.textDim,border:`1px solid ${showVoicePanel?cbColors.accent:cbColors.border}`,borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.2s"}}>🎙️ Voice</button>}
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 0"}}>
          {messages.length === 0 ? <CBWelcomeScreen onSuggestion={sendMessage} /> : (
            <div style={{maxWidth:760,margin:"0 auto",padding:"0 20px"}}>
              {messages.map((msg,i) => <CBMessageBubble key={i} msg={msg} onSpeak={voice.speak} onStopSpeak={voice.stopSpeaking} isSpeaking={voice.isSpeaking} ttsSupported={voice.ttsSupported} />)}
              {loading && <CBTypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Voice panel */}
        {showVoicePanel && <div style={{maxWidth:760,margin:"0 auto",width:"100%",padding:"0 20px"}}><CBVoicePanel voice={voice} onMicToggle={handleMicToggle} /></div>}

        {/* Input bar */}
        <div style={{padding:"12px 20px 16px",background:"transparent",flexShrink:0}}>
          <div style={{maxWidth:760,margin:"0 auto"}}>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.doc,.docx" style={{display:"none"}} onChange={handleFileSelect} />
            {uploadedFiles.length > 0 && (
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8,padding:"8px 12px",background:"rgba(20,50,50,0.4)",border:`1px solid ${cbColors.border}`,borderRadius:10}}>
                {uploadedFiles.map(f => (
                  <div key={f.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:"rgba(45,212,168,0.08)",border:`1px solid ${f.status==="error"?"rgba(239,68,68,0.4)":f.status==="ready"?"rgba(45,212,168,0.25)":"rgba(255,255,255,0.1)"}`,borderRadius:7,maxWidth:200}}>
                    {f.preview ? <img src={f.preview} alt={f.name} style={{width:28,height:28,borderRadius:4,objectFit:"cover"}} /> : <span style={{fontSize:16}}>{f.type==="application/pdf"?"📄":"📁"}</span>}
                    <div style={{overflow:"hidden",flex:1}}><div style={{fontSize:10,fontWeight:500,whiteSpace:"nowrap",textOverflow:"ellipsis",overflow:"hidden"}}>{f.name}</div><div style={{fontSize:9,color:cbColors.textMuted}}>{f.status==="uploading"?"⏳ Processing...":f.status==="error"?"❌ Error":f.status==="ready"?"✅ Ready":""}</div></div>
                    <button onClick={()=>removeFile(f.id)} style={{background:"none",border:"none",color:cbColors.textMuted,cursor:"pointer",fontSize:11,padding:"1px 3px",opacity:0.6}} onMouseEnter={e=>{e.target.style.opacity="1";e.target.style.color="#ef4444";}} onMouseLeave={e=>{e.target.style.opacity="0.6";e.target.style.color=cbColors.textMuted;}}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:10,background:cbColors.bgInput,border:`1px solid ${cbColors.border}`,borderRadius:13,padding:"3px 6px 3px 10px",backdropFilter:"blur(16px)",boxShadow:`0 4px 24px rgba(0,0,0,0.2),inset 0 1px 0 ${cbColors.borderLight}`}}>
              <button onClick={()=>fileInputRef.current?.click()} disabled={uploading} style={{background:uploadedFiles.length>0?"rgba(45,212,168,0.12)":"none",border:uploadedFiles.length>0?"1px solid rgba(45,212,168,0.25)":"none",color:uploadedFiles.length>0?cbColors.accent:cbColors.textMuted,cursor:"pointer",fontSize:17,padding:"3px 5px",borderRadius:6,transition:"all 0.2s",position:"relative"}} title="Upload documents or images">
                📎{uploadedFiles.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:cbColors.accent,color:"#0a1a1a",fontSize:8,fontWeight:700,width:14,height:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{uploadedFiles.length}</span>}
              </button>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} onPaste={handlePaste} placeholder={uploadedFiles.length>0?"Ask about your uploaded documents...":"Describe your legal concern..."} rows={1} style={{flex:1,background:"transparent",border:"none",outline:"none",color:cbColors.text,fontSize:13,fontFamily:"'Outfit','Inter',system-ui,sans-serif",resize:"none",padding:"11px 0",lineHeight:1.5}} />
              {voice.sttSupported && <button onClick={handleMicToggle} style={{width:38,height:38,borderRadius:9,background:voice.isRecording?"rgba(239,68,68,0.15)":cbColors.bgHover,border:`1px solid ${voice.isRecording?cbColors.danger:cbColors.border}`,color:voice.isRecording?cbColors.danger:cbColors.textMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,animation:voice.isRecording?"micPulse 1.2s ease-in-out infinite":"none"}}>{voice.isRecording?"🔴":"🎙️"}</button>}
              {(() => { const canSend = !loading && !uploadedFiles.some(f=>f.status==="uploading") && (input.trim()||uploadedFiles.length>0); return <button onClick={()=>sendMessage()} disabled={!canSend} style={{width:38,height:38,borderRadius:9,background:canSend?`linear-gradient(135deg,${cbColors.accent},${cbColors.blue})`:cbColors.bgHover,border:"none",color:canSend?"#0a1a1a":cbColors.textMuted,cursor:canSend?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,transition:"all 0.2s"}}>{loading?"⏳":"➤"}</button>; })()}
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:8,fontSize:10,color:cbColors.textMuted}}>QanoonAI provides legal guidance only. Always verify with a licensed lawyer.</div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ lawyerData, user, onUpdate }) {
  const [form, setForm] = useState({ specialization: lawyerData?.specialization || "", experience_years: lawyerData?.experience_years || 0, consultation_fee: lawyerData?.consultation_fee || 0, about: lawyerData?.about || "", is_free: lawyerData?.is_free || false });
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  const handleSave = async () => { if (!lawyerData?.id) return; setSaving(true); setMessage(""); try { const r = await fetch(`${API_URL}/api/lawyers/${lawyerData.id}/profile`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(form) }); if (r.ok) { setMessage("Profile updated!"); if (onUpdate) onUpdate(); } else setMessage("Failed"); } catch { setMessage("Error"); } finally { setSaving(false); } };
  return (<div className="card" style={{maxWidth:"800px"}}>
    <div style={{display:"flex", alignItems:"center", gap:"1.2rem", marginBottom:"2rem"}}><div style={{width:"80px", height:"80px", borderRadius:"50%", background:"rgba(0,196,180,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", fontWeight:700, color:"var(--accent)"}}>{user?.name ? user.name.split(" ").map(w=>w[0]).join("").toUpperCase().substring(0,2) : "??"}</div><div><div style={{fontFamily:"var(--font-display)", fontSize:"1.4rem", fontWeight:700}}>{user?.name}</div><div style={{color:"var(--text-secondary)", fontSize:"0.88rem"}}>{lawyerData?.specialization}</div></div></div>
    {message && <div style={{background: message.includes("updated") ? "rgba(0,196,180,0.1)" : "rgba(224,85,85,0.1)", color: message.includes("updated") ? "var(--accent)" : "var(--danger)", padding:"0.7rem", borderRadius:8, fontSize:"0.82rem", marginBottom:"1rem"}}>{message}</div>}
    <div className="profile-form">
      <div><label className="profile-label">Name</label><input className="profile-input" value={user?.name || ""} disabled style={{opacity:0.6}} /></div>
      <div><label className="profile-label">Email</label><input className="profile-input" value={user?.email || ""} disabled style={{opacity:0.6}} /></div>
      <div><label className="profile-label">Specialization</label><select className="profile-input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})}><option>Family Law</option><option>Criminal Law</option><option>Civil Law</option><option>Banking Law</option><option>Corporate Law</option><option>Property Law</option></select></div>
      <div><label className="profile-label">Experience</label><input className="profile-input" type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: parseInt(e.target.value)||0})} /></div>
      <div><label className="profile-label">Fee (Rs.)</label><input className="profile-input" type="number" value={form.consultation_fee} onChange={e => setForm({...form, consultation_fee: parseInt(e.target.value)||0})} /></div>
      <div className="profile-full"><label className="profile-label">About</label><textarea className="profile-input" rows={3} value={form.about} onChange={e => setForm({...form, about: e.target.value})} placeholder="About you..." style={{resize:"vertical"}} /></div>
    </div><button className="save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
  </div>);
}

export default function LawyerDashboard() {
  const [activePage, setActivePage] = useState("overview"); const [lawyerData, setLawyerData] = useState(null); const [loading, setLoading] = useState(true); const [unreadChats, setUnreadChats] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || '{"name":"Lawyer","role":"lawyer"}');
  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => { setLoading(true); try { const r = await fetch(`${API_URL}/api/lawyers/all`); const d = await r.json(); if (d.lawyers) { const me = d.lawyers.find(l => l.email === user.email); if (me) setLawyerData(me); } } catch {} finally { setLoading(false); } };
  
  useEffect(() => {
    const check = async () => { try { const r = await fetch(`${API_URL}/api/chats/user/${user.id}?role=lawyer`); const d = await r.json(); if (d.chats) setUnreadChats(d.chats.reduce((s,c) => s + (c.unread||0), 0)); } catch {} };
    check(); const i = setInterval(check, 10000); return () => clearInterval(i);
  }, []);

  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/"); };
  const getInitials = (n) => { if (!n) return "L"; const p = n.split(" "); return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : n[0].toUpperCase(); };
  const navItems = [ { id: "overview", icon: "📊", label: "Overview" }, { id: "cases", icon: "📚", label: "Past Cases" }, { id: "chatbot", icon: "🤖", label: "AI Assistant" }, { id: "chats", icon: "💬", label: "Chats", badge: unreadChats }, { id: "profile", icon: "👤", label: "Profile" } ];
  const pageTitles = { overview: "Dashboard", cases: "Past Cases", chatbot: "AI Legal Assistant", chats: "Client Chats", profile: "My Profile" };

  if (loading) return <><style>{styles}</style><div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-main)", color:"var(--text-secondary)"}}>⏳ Loading...</div></>;

  return (<><style>{styles}</style>
    <div className="l-layout">
      <div className="l-sidebar">
        <div className="l-logo"><div className="l-logo-icon">⚖</div>QanoonAI</div><div className="l-label">Main Menu</div>
        {navItems.map(item => (<div key={item.id} className={`l-nav ${activePage === item.id ? "active" : ""}`} onClick={() => setActivePage(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.badge > 0 && <span className="nav-badge">{item.badge}</span>}</div>))}
        <div className="l-bottom"><div className="l-profile"><div className="l-avatar">{getInitials(user.name)}</div><div><p>{user.name} {lawyerData?.verified && "✓"}</p><span>{lawyerData?.specialization || "Lawyer"}</span></div></div><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></div>
      </div>
      <div className="l-main">
        <div className="l-topbar"><div className="l-title">{pageTitles[activePage]}</div><div className="l-topright"><div className="availability"><div className="avail-dot"></div>{lawyerData?.verified ? "Available" : "Pending"}</div><div className="notif">🔔</div></div></div>
        <div className="l-page">
          {activePage === "overview" && <OverviewPage lawyerData={lawyerData} />}
          {activePage === "cases" && <PastCasesPage />}
          {activePage === "chatbot" && <AIChatbotPage />}
          {activePage === "chats" && <LawyerChatsPage />}
          {activePage === "profile" && <ProfilePage lawyerData={lawyerData} user={user} onUpdate={loadProfile} />}
        </div>
      </div>
    </div>
  </>);
}
