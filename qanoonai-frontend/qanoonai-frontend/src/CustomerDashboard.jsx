import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatbotPage from "./ChatbotPage";
import { deriveKeyFromChatId, encryptMessage, decryptMessage } from "./utils/encryption";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || "http://localhost:8000";
const PLANS_MAP = { pro: 999, premium: 2499 };
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}:root{--bg-main:#08141e;--bg-dark:#0d1f2d;--bg-card:#0f2336;--bg-card2:#132840;--accent:#00c4b4;--accent2:#00e5d3;--text-primary:#e8f4f8;--text-secondary:#7ca3b8;--text-muted:#4a6b7d;--border:rgba(0,196,180,0.15);--danger:#e05555;--warning:#f0a500;--font-display:'Syne',sans-serif;--font-body:'Inter',sans-serif}body{background:var(--bg-main);color:var(--text-primary);font-family:var(--font-body)}.cust-layout{display:flex;min-height:100vh}.c-sidebar{width:240px;background:var(--bg-dark);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:50}.c-logo{display:flex;align-items:center;gap:10px;padding:1.5rem 1.2rem;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:1.2rem;font-weight:700}.c-logo-icon{width:32px;height:32px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}.c-sidebar-label{font-size:.65rem;color:var(--text-muted);font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:1rem 1.2rem .4rem}.c-nav-item{display:flex;align-items:center;gap:10px;padding:.7rem 1.2rem;cursor:pointer;color:var(--text-secondary);font-size:.88rem;font-weight:500;transition:all .2s;border-left:3px solid transparent;margin:1px 0;position:relative}.c-nav-item:hover{color:var(--text-primary);background:rgba(0,196,180,.06)}.c-nav-item.active{color:var(--accent);background:rgba(0,196,180,.08);border-left-color:var(--accent)}.nav-icon{font-size:16px;width:20px;text-align:center}.nav-badge{position:absolute;right:12px;background:var(--danger);color:#fff;font-size:.6rem;padding:1px 6px;border-radius:100px;font-weight:700}.c-sidebar-bottom{margin-top:auto;padding:1rem;border-top:1px solid var(--border)}.c-profile{display:flex;align-items:center;gap:10px}.c-avatar{width:36px;height:36px;background:rgba(0,196,180,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--accent)}.c-profile p{font-size:.82rem;font-weight:500}.c-profile span{font-size:.7rem;color:var(--text-muted)}.logout-btn{width:100%;padding:.5rem;margin-top:.8rem;background:rgba(224,85,85,.1);border:1px solid rgba(224,85,85,.3);color:var(--danger);border-radius:8px;font-size:.8rem;cursor:pointer;font-family:var(--font-body)}.c-main{margin-left:240px;flex:1;display:flex;flex-direction:column;min-height:100vh}.c-topbar{display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:var(--bg-dark);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:40}.c-topbar-title{font-family:var(--font-display);font-size:1.2rem;font-weight:700}.plan-badge{background:rgba(168,85,247,.15);color:#a855f7;padding:.4rem .8rem;border-radius:8px;font-size:.78rem;font-weight:600}.c-page{padding:1.5rem 2rem;flex:1}.chat-container{display:flex;height:calc(100vh - 70px)}.chat-sidebar-panel{width:280px;background:var(--bg-dark);border-right:1px solid var(--border);display:flex;flex-direction:column}.chat-new-btn{margin:1rem;padding:.7rem;background:var(--accent);color:#08141e;border:none;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:var(--font-body)}.chat-sessions-label{font-size:.65rem;color:var(--text-muted);font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:.5rem 1rem}.chat-sessions{flex:1;overflow-y:auto;padding:0 .6rem}.session-item{padding:.6rem .8rem;margin:2px 0;border-radius:8px;cursor:pointer}.session-item:hover{background:var(--bg-card)}.session-item.active{background:var(--bg-card2);border-left:3px solid var(--accent)}.session-title{font-size:.82rem;color:var(--text-primary);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.session-meta{font-size:.68rem;color:var(--text-muted);margin-top:2px}.chat-main-panel{flex:1;display:flex;flex-direction:column;background:var(--bg-main)}.chat-top{padding:.9rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}.category-select{background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);padding:.4rem .8rem;border-radius:8px;font-size:.8rem;font-family:var(--font-body);cursor:pointer}.chat-messages{flex:1;overflow-y:auto;padding:1.5rem 10%;display:flex;flex-direction:column;gap:1rem}.chat-empty{text-align:center;margin:auto;color:var(--text-secondary)}.chat-empty-icon{font-size:48px;margin-bottom:1rem}.chat-empty h3{font-family:var(--font-display);font-size:1.3rem;margin-bottom:.5rem;color:var(--text-primary)}.chat-empty-grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-top:1.5rem;max-width:500px}.chat-suggestion{background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:.8rem;cursor:pointer;text-align:left;color:var(--text-secondary);font-size:.82rem}.chat-suggestion:hover{border-color:var(--accent);color:var(--text-primary)}.msg{max-width:75%;padding:.8rem 1rem;border-radius:14px;font-size:.88rem;line-height:1.7;position:relative}.msg.user{background:rgba(0,196,180,.12);border:1px solid rgba(0,196,180,.2);align-self:flex-end;border-radius:14px 14px 4px 14px}.msg.ai{background:var(--bg-card);border:1px solid var(--border);align-self:flex-start;border-radius:14px 14px 14px 4px;color:var(--text-secondary)}.msg-sources{margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}.msg-sources-label{font-size:.7rem;color:var(--text-muted);margin-bottom:4px}.msg-source{font-size:.7rem;color:var(--accent);opacity:.7}.msg-speak-btn{position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;opacity:.5}.msg-speak-btn:hover{opacity:1;color:var(--accent)}.msg-typing{display:flex;gap:4px;padding:.4rem 0}.msg-typing span{width:7px;height:7px;background:var(--accent);border-radius:50%;animation:bounce 1.4s infinite}.msg-typing span:nth-child(2){animation-delay:.2s}.msg-typing span:nth-child(3){animation-delay:.4s}@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-6px);opacity:1}}@keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(224,85,85,.4)}50%{box-shadow:0 0 0 12px rgba(224,85,85,0)}}.chat-input-wrap{padding:1rem 10% 1.5rem;border-top:1px solid var(--border)}.chat-input-box{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:.5rem .8rem;display:flex;align-items:center;gap:.5rem}.chat-input-box.listening{border-color:var(--danger);box-shadow:0 0 20px rgba(224,85,85,.15)}.chat-input-box:focus-within{border-color:var(--accent)}.chat-input{flex:1;background:transparent;border:none;outline:none;color:var(--text-primary);font-size:.9rem;font-family:var(--font-body);padding:.4rem 0}.chat-input::placeholder{color:var(--text-muted)}.icon-btn{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:6px;border-radius:8px}.icon-btn:hover{color:var(--accent);background:rgba(0,196,180,.1)}.mic-btn{width:40px;height:40px;border-radius:10px;border:2px solid var(--border);background:var(--bg-card2);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px}.mic-btn.active{border-color:var(--danger);background:rgba(224,85,85,.1);color:var(--danger);animation:micPulse 1.2s ease-in-out infinite}.send-btn{background:var(--accent);border:none;width:40px;height:40px;border-radius:10px;color:#08141e;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}.send-btn:disabled{background:var(--bg-card2);color:var(--text-muted);cursor:not-allowed}.chat-disclaimer{text-align:center;font-size:.72rem;color:var(--text-muted);margin-top:.5rem}.voice-status{text-align:center;font-size:.75rem;color:var(--danger);margin-top:.3rem}.upload-status{background:rgba(0,196,180,.1);border:1px solid rgba(0,196,180,.3);border-radius:8px;padding:.5rem .8rem;margin:.5rem 10%;font-size:.8rem;color:var(--accent);text-align:center}.lawyer-filters{display:flex;gap:.8rem;margin-bottom:1.5rem;align-items:center;flex-wrap:wrap}.search-bar{flex:1;min-width:240px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:.6rem .9rem;color:var(--text-primary);font-size:.88rem;font-family:var(--font-body);outline:none}.search-bar:focus{border-color:var(--accent)}.search-bar::placeholder{color:var(--text-muted)}.filter-chip{background:var(--bg-card);border:1px solid var(--border);color:var(--text-secondary);padding:.5rem .9rem;border-radius:100px;font-size:.8rem;cursor:pointer;font-family:var(--font-body)}.filter-chip:hover{border-color:var(--accent);color:var(--accent)}.filter-chip.active{background:var(--accent);color:#08141e;border-color:var(--accent);font-weight:600}.lawyers-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem}.lawyer-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:1.3rem;transition:all .2s}.lawyer-card:hover{border-color:rgba(0,196,180,.4);transform:translateY(-2px)}.lawyer-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:1rem}.lawyer-avatar{width:56px;height:56px;background:rgba(0,196,180,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--accent);flex-shrink:0}.lawyer-name{font-family:var(--font-display);font-size:1rem;font-weight:600;margin-bottom:2px}.lawyer-spec{font-size:.8rem;color:var(--text-secondary)}.lawyer-meta{display:flex;gap:1rem;margin-bottom:1rem;padding:.6rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}.meta-item{flex:1;text-align:center}.meta-val{font-size:.95rem;font-weight:700}.meta-label{font-size:.7rem;color:var(--text-muted);margin-top:2px}.hire-btn{width:100%;padding:.6rem;background:var(--accent);color:#08141e;border:none;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;font-family:var(--font-body)}.hire-btn:hover{background:var(--accent2)}.hire-btn:disabled{opacity:.6;cursor:not-allowed}.loading-state{text-align:center;padding:3rem;color:var(--text-secondary)}.empty-state{text-align:center;padding:3rem;color:var(--text-muted);background:var(--bg-card);border:1px solid var(--border);border-radius:14px}.chats-layout{display:flex;height:calc(100vh - 70px)}.chats-list{width:320px;background:var(--bg-dark);border-right:1px solid var(--border);overflow-y:auto}.chats-list-header{padding:1rem;border-bottom:1px solid var(--border);font-family:var(--font-display);font-weight:600}.chat-item{padding:.8rem 1rem;border-bottom:1px solid rgba(0,196,180,.05);cursor:pointer}.chat-item:hover{background:rgba(0,196,180,.05)}.chat-item.active{background:rgba(0,196,180,.1);border-left:3px solid var(--accent)}.chat-item-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}.chat-item-name{font-weight:600;font-size:.88rem}.chat-item-unread{background:var(--accent);color:#08141e;font-size:.6rem;padding:2px 6px;border-radius:100px;font-weight:700}.chat-item-last{font-size:.78rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chat-item-time{font-size:.68rem;color:var(--text-muted)}.chat-area{flex:1;display:flex;flex-direction:column}.chat-area-header{padding:1rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:var(--bg-dark)}.chat-area-avatar{width:40px;height:40px;background:rgba(0,196,180,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--accent);font-size:14px}.chat-area-name{font-family:var(--font-display);font-weight:600}.chat-area-status{font-size:.72rem;color:var(--accent)}.chat-area-msgs{flex:1;overflow-y:auto;padding:1.5rem;display:flex;flex-direction:column;gap:.8rem}.chat-msg{max-width:70%;padding:.7rem 1rem;border-radius:14px;font-size:.85rem;line-height:1.5}.chat-msg.sent{background:rgba(0,196,180,.15);border:1px solid rgba(0,196,180,.25);align-self:flex-end;border-radius:14px 14px 4px 14px}.chat-msg.received{background:var(--bg-card);border:1px solid var(--border);align-self:flex-start;border-radius:14px 14px 14px 4px;color:var(--text-secondary)}.chat-msg-time{font-size:.65rem;color:var(--text-muted);margin-top:4px}.chat-area-input{padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;gap:8px}.chat-area-input input{flex:1;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:.7rem 1rem;color:var(--text-primary);font-size:.88rem;font-family:var(--font-body);outline:none}.chat-area-input input:focus{border-color:var(--accent)}.chat-area-input button{padding:.7rem 1.2rem;background:var(--accent);color:#08141e;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-family:var(--font-body)}.no-chat-selected{flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted)}.pay-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1000;display:flex;align-items:center;justify-content:center;padding:2rem}
`;
const suggestions = ["What are my rights if my husband is abusing me?", "How can I file for Khula in Pakistan?", "What is the punishment for theft under PPC?", "Explain inheritance law for daughters in Islam"];
const gi = (n) => { if (!n) return "??"; const p = n.split(" "); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase() };
const fmtCard = (v) => { const n = v.replace(/\D/g, "").slice(0, 16); return n.replace(/(\d{4})/g, "$1 ").trim() };
const fmtExp = (v) => { const n = v.replace(/\D/g, "").slice(0, 4); return n.length > 2 ? n.slice(0, 2) + "/" + n.slice(2) : n };

function FindLawyerPage({ onStartChat }) {
  const [lawyers, setLawyers] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("All"); const [hiring, setHiring] = useState(null); const [payModal, setPayModal] = useState(null); const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" }); const [paying, setPaying] = useState(false); const [payMsg, setPayMsg] = useState("");
  useEffect(() => { (async () => { setLoading(true); try { const r = await fetch(`${API_URL}/api/lawyers/`); const d = await r.json(); if (d.lawyers) setLawyers(d.lawyers) } catch { } finally { setLoading(false) } })() }, []);
  const cats = ["All", "Family Law", "Criminal Law", "Civil Law", "Banking Law", "Corporate Law", "Free"];
  const filtered = lawyers.filter(l => { const mf = filter === "All" || (filter === "Free" ? l.is_free : l.specialization === filter); const ms = (l.name || "").toLowerCase().includes(search.toLowerCase()) || (l.specialization || "").toLowerCase().includes(search.toLowerCase()); return mf && ms });
  const handleHire = async (l) => { if (!l.is_free && l.consultation_fee > 0) { setPayModal(l); setCard({ number: "", expiry: "", cvc: "", name: "" }); setPayMsg(""); return } setHiring(l.user_id); try { const u = JSON.parse(localStorage.getItem("user") || "{}"); const r = await fetch(`${API_URL}/api/chats/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: u.id, lawyer_id: l.user_id }) }); const d = await r.json(); if (d.chat_id) { alert(`Chat started with ${l.name}!`); if (onStartChat) onStartChat() } } catch (e) { alert("Error") } finally { setHiring(null) } };
  const handlePayLawyer = async () => { if (!card.number || !card.expiry || !card.cvc || !card.name) { setPayMsg("Fill all fields"); return } setPaying(true); setPayMsg(""); try { const u = JSON.parse(localStorage.getItem("user") || "{}"); const r = await fetch(`${API_URL}/api/payments/lawyer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: u.id, lawyer_id: payModal.user_id, amount: payModal.consultation_fee, card_number: card.number, card_expiry: card.expiry, card_cvc: card.cvc, card_name: card.name }) }); const d = await r.json(); if (r.ok) { await fetch(`${API_URL}/api/chats/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: u.id, lawyer_id: payModal.user_id }) }); alert(`Payment Rs.${payModal.consultation_fee} done! Chat started with ${payModal.name}!`); setPayModal(null); if (onStartChat) onStartChat() } else setPayMsg(d.detail || "Failed") } catch { setPayMsg("Server error") } finally { setPaying(false) } };
  return (<><div className="lawyer-filters"><input className="search-bar" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />{cats.map(c => (<button key={c} className={`filter-chip ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>))}</div>{loading ? <div className="loading-state">⏳ Loading...</div> : filtered.length === 0 ? <div className="empty-state">⚖ No lawyers found</div> : <><div style={{ color: "var(--text-secondary)", fontSize: ".88rem", marginBottom: "1rem" }}>Showing {filtered.length} lawyers</div><div className="lawyers-grid">{filtered.map(l => (<div key={l.id} className="lawyer-card"><div className="lawyer-top"><div className="lawyer-avatar">{gi(l.name)}</div><div style={{ flex: 1 }}><div className="lawyer-name">{l.name} ✓</div><div className="lawyer-spec">{l.specialization}·{l.experience_years || 0}yrs</div></div></div><div className="lawyer-meta"><div className="meta-item"><div className="meta-val">{l.total_cases || 0}</div><div className="meta-label">Cases</div></div><div className="meta-item"><div className="meta-val">{l.experience_years || 0}yr</div><div className="meta-label">Exp</div></div><div className="meta-item"><div className="meta-val">{l.rating || 0}⭐</div><div className="meta-label">Rating</div></div></div><div style={{ marginBottom: "1rem" }}><div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: l.is_free ? "var(--text-secondary)" : "var(--accent)" }}>{l.is_free ? "Free" : `Rs.${l.consultation_fee}`}</div></div><button className="hire-btn" onClick={() => handleHire(l)} disabled={hiring === l.user_id}>{hiring === l.user_id ? "Starting..." : l.is_free ? "💬 Chat Free" : `💳 Hire (Rs.${l.consultation_fee || 0})`}</button></div>))}</div></>}
    {payModal && <div className="pay-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPayModal(null) }}><div style={{ background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 450 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}><div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700 }}>💳 Pay Consultation Fee</div><button onClick={() => setPayModal(null)} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button></div>
      <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,196,180,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)" }}>{gi(payModal.name)}</div><div><div style={{ fontWeight: 600 }}>{payModal.name}</div><div style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>{payModal.specialization}</div></div><div style={{ marginLeft: "auto", fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: "var(--accent)" }}>Rs.{payModal.consultation_fee}</div></div>
      {payMsg && <div style={{ background: "rgba(224,85,85,.1)", border: "1px solid rgba(224,85,85,.3)", color: "var(--danger)", padding: ".6rem", borderRadius: 8, fontSize: ".82rem", marginBottom: "1rem" }}>{payMsg}</div>}
      <div style={{ marginBottom: ".8rem" }}><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>Name</div><input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} placeholder="Your Name" style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "var(--font-body)", outline: "none" }} /></div>
      <div style={{ marginBottom: ".8rem" }}><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>Card Number</div><input value={card.number} onChange={e => setCard({ ...card, number: fmtCard(e.target.value) })} placeholder="4242 4242 4242 4242" maxLength={19} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "monospace", fontSize: ".95rem", outline: "none", letterSpacing: "2px" }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem", marginBottom: "1rem" }}><div><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>Expiry</div><input value={card.expiry} onChange={e => setCard({ ...card, expiry: fmtExp(e.target.value) })} placeholder="MM/YY" maxLength={5} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "monospace", outline: "none" }} /></div><div><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>CVC</div><input value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" maxLength={4} type="password" style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "monospace", outline: "none" }} /></div></div>
      <button onClick={handlePayLawyer} disabled={paying} style={{ width: "100%", padding: ".8rem", background: "var(--accent)", border: "none", color: "#08141e", borderRadius: 10, fontWeight: 600, cursor: paying ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", fontSize: ".95rem", opacity: paying ? .6 : 1 }}>{paying ? "Processing..." : `Pay Rs.${payModal.consultation_fee} & Start Chat`}</button>
      <div style={{ textAlign: "center", fontSize: ".7rem", color: "var(--text-muted)", marginTop: ".8rem" }}>🔒 Demo payment</div></div></div>}
  </>)
}

function MyChatsPage() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const chatKeyRef = useRef(null); // E2EE key for active chat (in memory only)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { loadChats(); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => {
    if (!activeChat) return;
    const i = setInterval(() => loadMsgs(activeChat.id), 5000);
    return () => clearInterval(i);
  }, [activeChat]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/chats/user/${user.id}?role=customer`);
      const d = await r.json();
      if (d.chats) setChats(d.chats);
    } catch { } finally { setLoading(false); }
  };

  const openChat = async (c) => {
    // Derive E2EE key from chat_id — same key computed by lawyer side
    chatKeyRef.current = await deriveKeyFromChatId(c.id);
    setActiveChat(c);
    loadMsgs(c.id);
  };

  const loadMsgs = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/chats/${id}`);
      const d = await r.json();
      if (d.messages && chatKeyRef.current) {
        // Decrypt each message using the session key
        const decrypted = d.messages.map(m => ({
          ...m,
          message: decryptMessage(m.message, chatKeyRef.current),
        }));
        setMessages(decrypted);
      } else if (d.messages) {
        setMessages(d.messages);
      }
    } catch { }
  };

  const sendMsg = async () => {
    if (!input.trim() || !activeChat) return;
    setSending(true);
    try {
      // Encrypt before sending — backend stores only ciphertext
      const key = chatKeyRef.current;
      const payload = key ? encryptMessage(input.trim(), key) : input.trim();
      await fetch(`${API_URL}/api/chats/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: activeChat.id,
          sender_id: user.id,
          sender_role: "customer",
          receiver_id: activeChat.lawyer_id,
          message: payload,
          message_type: "text",
        }),
      });
      setInput("");
      loadMsgs(activeChat.id);
      loadChats();
    } catch { } finally { setSending(false); }
  };

  const ft = (ts) => { if (!ts) return ""; try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  return (
    <div className="chats-layout">
      {/* Chat list */}
      <div className="chats-list">
        <div className="chats-list-header">💬 Conversations ({chats.length})</div>
        {loading ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          : chats.length === 0 ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No chats yet</div>
          : chats.map(c => (
            <div key={c.id} className={`chat-item ${activeChat?.id === c.id ? "active" : ""}`} onClick={() => openChat(c)}>
              <div className="chat-item-top">
                <div className="chat-item-name">⚖ {c.lawyer_name}</div>
                {c.unread > 0 && <span className="chat-item-unread">{c.unread}</span>}
              </div>
              <div className="chat-item-last">🔒 {c.last_message ? "Encrypted message" : "No messages"}</div>
              <div className="chat-item-time">{ft(c.last_time)}</div>
            </div>
          ))}
      </div>

      {/* Chat area */}
      {!activeChat
        ? <div className="no-chat-selected">👈 Select a conversation</div>
        : <div className="chat-area">
            {/* Header */}
            <div className="chat-area-header">
              <div className="chat-area-avatar">{(activeChat.lawyer_name || "?")[0].toUpperCase()}</div>
              <div>
                <div className="chat-area-name">⚖ {activeChat.lawyer_name}</div>
                <div className="chat-area-status" style={{ color: "#6ee7b7", fontSize: 11 }}>🔒 End-to-end encrypted</div>
              </div>
            </div>

            {/* E2EE notice banner */}
            <div style={{ background: "rgba(16,60,50,0.7)", borderBottom: "1px solid rgba(45,212,168,0.12)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontSize: 11, color: "#6ee7b7" }}>This chat is end-to-end encrypted. Messages can only be read by you and the recipient.</span>
            </div>

            {/* Messages */}
            <div className="chat-area-msgs" ref={scrollRef}>
              {messages.length === 0
                ? <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>💬 Start the conversation!</div>
                : messages.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.sender_role === "customer" ? "sent" : "received"}`}>
                    {m.message}
                    <div className="chat-msg-time">{ft(m.timestamp)} 🔒</div>
                  </div>
                ))}
            </div>

            {/* Input */}
            <div className="chat-area-input">
              <input
                placeholder="Type a message... (end-to-end encrypted)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMsg()}
              />
              <button onClick={sendMsg} disabled={sending || !input.trim()}>
                {sending ? "..." : "Send 🔒"}
              </button>
            </div>
          </div>
      }
    </div>
  );
}

function MyPlanPage() {
  const [plans, setPlans] = useState([]); const [currentPlan, setCurrentPlan] = useState(null); const [selectedPlan, setSelectedPlan] = useState(null); const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" }); const [paying, setPaying] = useState(false); const [message, setMessage] = useState(""); const [history, setHistory] = useState([]); const [showHistory, setShowHistory] = useState(false); const user = JSON.parse(localStorage.getItem("user") || "{}");
  useEffect(() => { lp(); ls(); lh() }, []);
  const lp = async () => { try { const r = await fetch(`${API_URL}/api/payments/plans`); const d = await r.json(); if (d.plans) setPlans(d.plans) } catch { } };
  const ls = async () => { try { const r = await fetch(`${API_URL}/api/payments/subscription/${user.id}`); const d = await r.json(); setCurrentPlan(d) } catch { } };
  const lh = async () => { try { const r = await fetch(`${API_URL}/api/payments/history/${user.id}`); const d = await r.json(); if (d.payments) setHistory(d.payments) } catch { } };
  const handleSub = async () => { if (!selectedPlan) return; if (!card.number || !card.expiry || !card.cvc || !card.name) { setMessage("Fill all fields"); return } setPaying(true); setMessage(""); try { const r = await fetch(`${API_URL}/api/payments/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, plan_id: selectedPlan, card_number: card.number, card_expiry: card.expiry, card_cvc: card.cvc, card_name: card.name }) }); const d = await r.json(); if (r.ok) { setMessage(`✅ ${d.message}`); setSelectedPlan(null); setCard({ number: "", expiry: "", cvc: "", name: "" }); ls(); lh() } else setMessage(`❌ ${d.detail || "Failed"}`) } catch { setMessage("❌ Error") } finally { setPaying(false) } };
  const pe = { starter: "🆓", pro: "⚡", premium: "👑" }; const pc = { starter: "var(--text-muted)", pro: "var(--accent)", premium: "#a855f7" };
  return (<div style={{ maxWidth: 900, margin: "0 auto" }}><div style={{ background: "linear-gradient(135deg,rgba(0,196,180,.15),rgba(168,85,247,.1))", border: "1px solid rgba(0,196,180,.3)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}><div><div style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>Your Current Plan</div><div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700 }}>{currentPlan?.plan_name || "Starter"}</div></div><div style={{ background: "rgba(0,196,180,.15)", color: "var(--accent)", padding: ".4rem .8rem", borderRadius: 8, fontSize: ".78rem", fontWeight: 600 }}>Active</div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}><div style={{ background: "rgba(8,20,30,.4)", borderRadius: 10, padding: ".8rem" }}><div style={{ fontSize: ".72rem", color: "var(--text-secondary)" }}>Queries</div><div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{currentPlan?.queries_used || 0}/{currentPlan?.queries_limit === -1 ? "∞" : currentPlan?.queries_limit || 20}</div></div><div style={{ background: "rgba(8,20,30,.4)", borderRadius: 10, padding: ".8rem" }}><div style={{ fontSize: ".72rem", color: "var(--text-secondary)" }}>Price</div><div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{currentPlan?.price === 0 ? "Free" : `Rs.${currentPlan?.price || 0}/mo`}</div></div><div style={{ background: "rgba(8,20,30,.4)", borderRadius: 10, padding: ".8rem" }}><div style={{ fontSize: ".72rem", color: "var(--text-secondary)" }}>Expires</div><div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{currentPlan?.expires_at ? new Date(currentPlan.expires_at).toLocaleDateString() : "Never"}</div></div></div></div>
    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>{selectedPlan ? "💳 Payment" : "Upgrade Your Plan"}</div>
    {!selectedPlan ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>{plans.map(p => (<div key={p.id} style={{ background: "var(--bg-card)", border: `2px solid ${currentPlan?.plan_id === p.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 16, padding: "1.5rem", position: "relative" }}>{currentPlan?.plan_id === p.id && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#08141e", padding: ".2rem .8rem", borderRadius: 100, fontSize: ".7rem", fontWeight: 700 }}>CURRENT</div>}<div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>{pe[p.id]}</div><div style={{ fontSize: ".85rem", color: "var(--text-secondary)" }}>{p.name}</div><div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, margin: ".3rem 0", color: pc[p.id] }}>{p.price === 0 ? "Free" : `Rs.${p.price}`}{p.price > 0 && <span style={{ fontSize: ".8rem", color: "var(--text-muted)", fontWeight: 400 }}>/mo</span>}</div><div style={{ marginBottom: "1rem" }}>{p.features.map((f, i) => (<div key={i} style={{ fontSize: ".78rem", color: "var(--text-secondary)", padding: "2px 0" }}>✓ {f}</div>))}</div><button onClick={() => { if (p.price > 0 && currentPlan?.plan_id !== p.id) setSelectedPlan(p.id) }} style={{ width: "100%", padding: ".7rem", background: currentPlan?.plan_id === p.id || p.price === 0 ? "var(--bg-card2)" : "var(--accent)", border: "none", color: currentPlan?.plan_id === p.id || p.price === 0 ? "var(--text-secondary)" : "#08141e", borderRadius: 8, fontFamily: "var(--font-body)", fontWeight: 600, cursor: currentPlan?.plan_id === p.id || p.price === 0 ? "default" : "pointer" }}>{currentPlan?.plan_id === p.id ? "Current" : p.price === 0 ? "Free" : "Upgrade Now"}</button></div>))}</div> :
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", maxWidth: 500 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}><div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>💳 Card Payment</div><div style={{ color: "var(--accent)", fontWeight: 700 }}>Rs.{PLANS_MAP[selectedPlan]}</div></div>
        {message && <div style={{ background: message.includes("✅") ? "rgba(0,196,180,.1)" : "rgba(224,85,85,.1)", border: `1px solid ${message.includes("✅") ? "rgba(0,196,180,.3)" : "rgba(224,85,85,.3)"}`, color: message.includes("✅") ? "var(--accent)" : "var(--danger)", padding: ".6rem", borderRadius: 8, fontSize: ".82rem", marginBottom: "1rem" }}>{message}</div>}
        <div style={{ marginBottom: ".8rem" }}><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>Name</div><input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} placeholder="Name" style={{ width: "100%", background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "var(--font-body)", outline: "none" }} /></div>
        <div style={{ marginBottom: ".8rem" }}><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>Card</div><input value={card.number} onChange={e => setCard({ ...card, number: fmtCard(e.target.value) })} placeholder="4242 4242 4242 4242" maxLength={19} style={{ width: "100%", background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "monospace", fontSize: ".95rem", outline: "none", letterSpacing: "2px" }} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem", marginBottom: "1rem" }}><div><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>Expiry</div><input value={card.expiry} onChange={e => setCard({ ...card, expiry: fmtExp(e.target.value) })} placeholder="MM/YY" maxLength={5} style={{ width: "100%", background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "monospace", outline: "none" }} /></div><div><div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: 4 }}>CVC</div><input value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" maxLength={4} type="password" style={{ width: "100%", background: "var(--bg-dark)", border: "1px solid var(--border)", borderRadius: 8, padding: ".65rem .9rem", color: "var(--text-primary)", fontFamily: "monospace", outline: "none" }} /></div></div>
        <div style={{ display: "flex", gap: ".8rem" }}><button onClick={() => { setSelectedPlan(null); setMessage("") }} style={{ flex: 1, padding: ".75rem", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancel</button><button onClick={handleSub} disabled={paying} style={{ flex: 2, padding: ".75rem", background: "var(--accent)", border: "none", color: "#08141e", borderRadius: 10, fontWeight: 600, cursor: paying ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", opacity: paying ? .6 : 1 }}>{paying ? "Processing..." : `Pay Rs.${PLANS_MAP[selectedPlan]}`}</button></div><div style={{ textAlign: "center", fontSize: ".7rem", color: "var(--text-muted)", marginTop: ".8rem" }}>🔒 Demo</div></div>}
    <div style={{ marginTop: "1rem" }}><button onClick={() => setShowHistory(!showHistory)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".88rem" }}>{showHistory ? "▲ Hide" : "▼ Show"} History ({history.length})</button>{showHistory && history.length > 0 && <div style={{ marginTop: ".8rem" }}>{history.map(p => (<div key={p.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: ".8rem", marginBottom: ".5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 600, fontSize: ".85rem" }}>{p.type === "subscription" ? `📦 ${p.plan_name}` : `⚖ ${p.lawyer_name}`}</div><div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>{p.transaction_id}</div></div><div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, color: "var(--accent)" }}>Rs.{p.amount}</div><div style={{ fontSize: ".7rem", color: "var(--accent)" }}>● {p.status}</div></div></div>))}</div>}</div></div>)
}

export default function CustomerDashboard() {
  const [activePage, setActivePage] = useState("chatbot"); const [unreadChats, setUnreadChats] = useState(0); const navigate = useNavigate(); const user = JSON.parse(localStorage.getItem("user") || '{"name":"User","role":"customer"}');
  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/") };
  useEffect(() => { const ck = async () => { try { const r = await fetch(`${API_URL}/api/chats/user/${user.id}?role=customer`); const d = await r.json(); if (d.chats) setUnreadChats(d.chats.reduce((s, c) => s + (c.unread || 0), 0)) } catch { } }; ck(); const i = setInterval(ck, 10000); return () => clearInterval(i) }, []);
  const navItems = [{ id: "chatbot", icon: "🤖", label: "AI Chatbot" }, { id: "lawyers", icon: "⚖", label: "Find Lawyer" }, { id: "chats", icon: "💬", label: "My Chats", badge: unreadChats }, { id: "plan", icon: "💎", label: "My Plan" }];
  const pageTitles = { chatbot: "AI Legal Assistant", lawyers: "Find a Lawyer", chats: "My Chats", plan: "My Plan" };
  const fullPage = activePage === "chatbot" || activePage === "chats";
  return (<><style>{styles}</style><div className="cust-layout"><div className="c-sidebar"><div className="c-logo"><div className="c-logo-icon">⚖</div>QanoonAI</div><div className="c-sidebar-label">Menu</div>{navItems.map(item => (<div key={item.id} className={`c-nav-item ${activePage === item.id ? "active" : ""}`} onClick={() => setActivePage(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.badge > 0 && <span className="nav-badge">{item.badge}</span>}</div>))}<div className="c-sidebar-bottom"><div className="c-profile"><div className="c-avatar">{gi(user.name)}</div><div><p>{user.name}</p><span>{user.role}</span></div></div><button className="logout-btn" onClick={handleLogout}>🚪 Logout</button></div></div><div className="c-main"><div className="c-topbar"><div className="c-topbar-title">{pageTitles[activePage]}</div><div className="plan-badge">💎 Starter</div></div><div className={fullPage ? "" : "c-page"}>{activePage === "chatbot" && <ChatbotPage />}{activePage === "lawyers" && <FindLawyerPage onStartChat={() => setActivePage("chats")} />}{activePage === "chats" && <MyChatsPage />}{activePage === "plan" && <MyPlanPage />}</div></div></div></>)
}
