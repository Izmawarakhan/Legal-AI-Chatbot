import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8001";

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
  const [cases, setCases] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [category, setCategory] = useState("All"); const [selectedCase, setSelectedCase] = useState(null); const [caseDetail, setCaseDetail] = useState(null);
  const cats = ["All", "Family Law", "Criminal Law", "Tax Law", "Banking Law", "Property Law", "Constitutional Law", "Civil Law"];
  useEffect(() => { loadCases(); }, []);
  const loadCases = async () => { setLoading(true); try { const r = await fetch(`${API_URL}/api/cases/`); const d = await r.json(); if (d.cases) setCases(d.cases); } catch {} finally { setLoading(false); } };
  const searchCases = async () => { setLoading(true); try { let u = `${API_URL}/api/cases/?`; if (search) u += `search=${encodeURIComponent(search)}&`; if (category !== "All") u += `category=${encodeURIComponent(category)}`; const r = await fetch(u); const d = await r.json(); if (d.cases) setCases(d.cases); } catch {} finally { setLoading(false); } };
  useEffect(() => { searchCases(); }, [category]);
  const openCase = async (c) => { setSelectedCase(c); try { const r = await fetch(`${API_URL}/api/cases/${c.id}`); const d = await r.json(); setCaseDetail(d); } catch { setCaseDetail(c); } };

  return (<>
    <div className="research-hero"><h2>📚 Legal Research Database</h2><p>Access Pakistani case laws and precedents</p>
      <div className="search-big"><input placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && searchCases()} /><button onClick={searchCases}>🔍 Search</button></div>
      <div className="chip-row">{cats.map(c => (<button key={c} className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>))}</div>
    </div>
    {loading ? <div className="loading">⏳ Loading...</div> : cases.length === 0 ? <div className="empty">📚 No cases found</div> : <>
      <div style={{color:"var(--text-secondary)", fontSize:"0.88rem", marginBottom:"1rem"}}>Showing {cases.length} results</div>
      {cases.map(c => (<div key={c.id} className="past-case-card" onClick={() => openCase(c)}><div className="past-top"><div style={{flex:1}}><div className="past-title">{c.title}</div><div className="past-citation">{c.citation}</div></div><div className="past-category">{c.category}</div></div><div className="past-summary">{c.summary}</div><div className="past-meta"><span><strong>Court:</strong> {c.court}</span>{c.year > 0 && <span><strong>Year:</strong> {c.year}</span>}{c.judge && <span><strong>Judge:</strong> {c.judge}</span>}</div></div>))}
    </>}
    {selectedCase && <div className="case-modal-overlay" onClick={e => e.target.classList.contains('case-modal-overlay') && setSelectedCase(null)}><div className="case-modal"><div className="case-modal-header"><div><div className="case-modal-title">{selectedCase.title}</div><div style={{fontFamily:"monospace", fontSize:"0.82rem", color:"var(--accent)"}}>{selectedCase.citation}</div><div className="case-modal-meta"><span>📂 {selectedCase.category}</span><span>🏛 {selectedCase.court}</span>{selectedCase.year > 0 && <span>📅 {selectedCase.year}</span>}{selectedCase.judge && <span>👨‍⚖️ {selectedCase.judge}</span>}</div></div><button className="case-modal-close" onClick={() => setSelectedCase(null)}>✕</button></div><div className="case-modal-body"><div className="case-modal-section"><h3>📋 Summary</h3><div className="case-modal-text">{caseDetail?.summary || selectedCase.summary}</div></div>{caseDetail?.full_judgment && <div className="case-modal-section"><h3>📜 Full Judgment</h3><div className="case-modal-text">{caseDetail.full_judgment}</div></div>}</div></div></div>}
  </>);
}

function LawyerChatsPage() {
  const [chats, setChats] = useState([]); const [activeChat, setActiveChat] = useState(null); const [messages, setMessages] = useState([]); const [input, setInput] = useState(""); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  useEffect(() => { loadChats(); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (!activeChat) return; const i = setInterval(() => loadMessages(activeChat.id), 5000); return () => clearInterval(i); }, [activeChat]);

  const loadChats = async () => { setLoading(true); try { const r = await fetch(`${API_URL}/api/chats/user/${user.id}?role=lawyer`); const d = await r.json(); if (d.chats) setChats(d.chats); } catch {} finally { setLoading(false); } };
  const loadMessages = async (id) => { try { const r = await fetch(`${API_URL}/api/chats/${id}`); const d = await r.json(); if (d.messages) setMessages(d.messages); } catch {} };
  const openChat = (c) => { setActiveChat(c); loadMessages(c.id); };
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return; setSending(true);
    try { await fetch(`${API_URL}/api/chats/send`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ chat_id: activeChat.id, sender_id: user.id, sender_role: "lawyer", receiver_id: activeChat.customer_id, message: input, message_type: "text" }) }); setInput(""); loadMessages(activeChat.id); loadChats(); } catch {} finally { setSending(false); }
  };
  const formatTime = (ts) => { if (!ts) return ""; try { return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); } catch { return ""; } };
  const getInitials = (n) => { if (!n) return "?"; const p = n.split(" "); return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : n[0].toUpperCase(); };

  return (
    <div className="chats-layout">
      <div className="chats-list">
        <div className="chats-list-header">👥 Client Messages ({chats.length})</div>
        {loading ? <div style={{padding:"2rem", textAlign:"center", color:"var(--text-muted)"}}>Loading...</div> :
         chats.length === 0 ? <div style={{padding:"2rem", textAlign:"center", color:"var(--text-muted)"}}>No client messages yet.</div> :
         chats.map(c => (<div key={c.id} className={`chat-item ${activeChat?.id === c.id ? "active" : ""}`} onClick={() => openChat(c)}><div className="chat-item-top"><div className="chat-item-name">👤 {c.customer_name}</div>{c.unread > 0 && <span className="chat-item-unread">{c.unread}</span>}</div><div className="chat-item-last">{c.last_message || "No messages yet"}</div><div className="chat-item-time">{formatTime(c.last_time)}</div></div>))}
      </div>
      {!activeChat ? <div className="no-chat-selected">👈 Select a client to view messages</div> : (
        <div className="chat-area">
          <div className="chat-area-header"><div className="chat-area-avatar">{getInitials(activeChat.customer_name)}</div><div><div className="chat-area-name">👤 {activeChat.customer_name}</div><div className="chat-area-status">Client</div></div></div>
          <div className="chat-area-msgs" ref={scrollRef}>
            {messages.length === 0 ? <div style={{margin:"auto", textAlign:"center", color:"var(--text-muted)"}}><div style={{fontSize:48, marginBottom:"0.5rem"}}>💬</div><p>No messages yet.</p></div> :
            messages.map((m, i) => (<div key={i} className={`chat-msg ${m.sender_role === "lawyer" ? "sent" : "received"}`}>{m.message}<div className="chat-msg-time">{formatTime(m.timestamp)}</div></div>))}
          </div>
          <div className="chat-area-input"><input placeholder="Reply to client..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} /><button onClick={sendMessage} disabled={sending || !input.trim()}>{sending ? "..." : "Send ➤"}</button></div>
        </div>
      )}
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
  const navItems = [ { id: "overview", icon: "📊", label: "Overview" }, { id: "cases", icon: "📚", label: "Past Cases" }, { id: "chats", icon: "💬", label: "Chats", badge: unreadChats }, { id: "profile", icon: "👤", label: "Profile" } ];
  const pageTitles = { overview: "Dashboard", cases: "Past Cases", chats: "Client Chats", profile: "My Profile" };

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
          {activePage === "chats" && <LawyerChatsPage />}
          {activePage === "profile" && <ProfilePage lawyerData={lawyerData} user={user} onUpdate={loadProfile} />}
        </div>
      </div>
    </div>
  </>);
}
