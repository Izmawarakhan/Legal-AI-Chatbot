import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
    --font-display: 'Syne', sans-serif;
    --font-body: 'Inter', sans-serif;
  }

  body { background: var(--bg-main); color: var(--text-primary); font-family: var(--font-body); overflow-x: hidden; scroll-behavior: smooth; }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.2rem 3rem;
    border-bottom: 1px solid var(--border);
    background: rgba(8,20,30,0.95);
    position: sticky; top: 0; z-index: 100;
  }
  .logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--text-primary); text-decoration: none; cursor: pointer; }
  .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-links { display: flex; align-items: center; gap: 2rem; }
  .nav-links a { color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; cursor: pointer; }
  .nav-links a:hover { color: var(--accent); }
  .nav-btns { display: flex; gap: 0.8rem; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--accent); padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
  .btn-ghost:hover { border-color: var(--accent); background: rgba(0,196,180,0.08); }
  .btn-primary { background: var(--accent); border: none; color: #08141e; padding: 0.5rem 1.4rem; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
  .btn-primary:hover { background: var(--accent2); }

  .hero { padding: 5rem 3rem 4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; max-width: 1200px; margin: 0 auto; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.25); color: var(--accent); padding: 0.35rem 0.9rem; border-radius: 100px; font-size: 0.78rem; font-weight: 500; margin-bottom: 1.5rem; }
  .badge-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .hero h1 { font-family: var(--font-display); font-size: 3.2rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.2rem; }
  .hero h1 span { color: var(--accent); }
  .hero p { font-size: 1rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 2rem; }
  .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .btn-lg { padding: 0.85rem 2rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
  .btn-lg.primary { background: var(--accent); border: none; color: #08141e; }
  .btn-lg.primary:hover { background: var(--accent2); transform: translateY(-2px); }
  .btn-lg.outline { background: transparent; border: 1px solid rgba(0,196,180,0.3); color: var(--accent); }
  .btn-lg.outline:hover { background: rgba(0,196,180,0.08); }

  .stats { display: flex; gap: 1rem; }
  .stat { text-align: center; }
  .stat-num { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--accent); }
  .stat-label { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
  .stat-divider { padding: 0 1rem; border-left: 1px solid rgba(0,196,180,0.15); border-right: 1px solid rgba(0,196,180,0.15); }

  .chat-preview { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
  .chat-header { background: var(--bg-card2); padding: 0.8rem 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
  .chat-header-info { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); }
  .chat-status { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
  .chat-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .msg-user { background: rgba(0,196,180,0.12); border: 1px solid rgba(0,196,180,0.2); border-radius: 12px 12px 4px 12px; padding: 0.7rem 1rem; font-size: 0.85rem; align-self: flex-end; max-width: 80%; }
  .msg-ai { background: var(--bg-card2); border: 1px solid var(--border); border-radius: 12px 12px 12px 4px; padding: 0.7rem 1rem; font-size: 0.85rem; color: var(--text-secondary); align-self: flex-start; max-width: 85%; }
  .msg-ai-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .ai-name { font-size: 0.75rem; font-weight: 600; color: var(--accent); }
  .chat-input-bar { padding: 0.8rem; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 0.5rem; }
  .fake-input { flex: 1; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 0.8rem; font-size: 0.82rem; color: var(--text-muted); font-family: var(--font-body); }
  .send-btn { width: 32px; height: 32px; background: var(--accent); border: none; border-radius: 8px; cursor: pointer; color: #08141e; font-size: 14px; }

  .section { padding: 4rem 3rem; max-width: 1200px; margin: 0 auto; scroll-margin-top: 80px; }
  .section-tag { text-align: center; margin-bottom: 0.8rem; }
  .section-tag span { background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.2); color: var(--accent); padding: 0.3rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 500; }
  .section-title { font-family: var(--font-display); font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 0.6rem; }
  .section-sub { text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 2.5rem; }
  .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.2rem; }
  .feature-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; transition: all 0.2s; }
  .feature-card:hover { border-color: rgba(0,196,180,0.4); transform: translateY(-3px); background: var(--bg-card2); }
  .feature-icon { width: 44px; height: 44px; background: rgba(0,196,180,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 1rem; }
  .feature-title { font-family: var(--font-display); font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
  .feature-desc { font-size: 0.83rem; color: var(--text-secondary); line-height: 1.6; }

  .plans-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.2rem; }
  .plan-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 1.8rem; position: relative; transition: all 0.2s; }
  .plan-card.popular { border-color: var(--accent); }
  .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #08141e; padding: 0.2rem 0.9rem; border-radius: 100px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
  .plan-name { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.3rem; font-weight: 500; }
  .plan-price { font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin-bottom: 0.2rem; }
  .plan-price span { font-size: 0.85rem; font-weight: 400; color: var(--text-muted); }
  .plan-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.2rem; }
  .plan-features { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
  .plan-features li { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-secondary); }
  .check { color: var(--accent); font-size: 12px; }
  .plan-btn { width: 100%; padding: 0.7rem; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
  .plan-btn.outline-btn { background: transparent; border: 1px solid rgba(0,196,180,0.3); color: var(--accent); }
  .plan-btn.outline-btn:hover { background: rgba(0,196,180,0.08); }
  .plan-btn.filled-btn { background: var(--accent); border: none; color: #08141e; }
  .plan-btn.filled-btn:hover { background: var(--accent2); }

  footer { border-top: 1px solid var(--border); padding: 2rem 3rem; text-align: center; color: var(--text-muted); font-size: 0.82rem; }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll when URL has hash like /#pricing or /#features
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
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
          <a onClick={() => navigate("/lawyers")}>Lawyers</a>
          <a onClick={() => scrollToSection("pricing")}>Pricing</a>
          <a onClick={() => navigate("/about")}>About</a>
        </div>
        <div className="nav-btns">
          <button className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      <div className="hero">
        <div>
          <div className="hero-badge">
            <div className="badge-dot"></div>
            Pakistan's First AI Legal Assistant
          </div>
          <h1>Legal Help,<br />Powered by <span>AI</span> &<br />Real Lawyers</h1>
          <p>Get instant answers on Pakistani law, connect with verified lawyers, and manage your legal matters — all in one platform.</p>
          <div className="hero-actions">
            <button className="btn-lg primary" onClick={() => navigate("/signup")}>Start Free Consultation</button>
            <button className="btn-lg outline" onClick={() => navigate("/lawyers")}>Find a Lawyer</button>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-num">7</div>
              <div className="stat-label">Law Categories</div>
            </div>
            <div className="stat stat-divider">
              <div className="stat-num">500+</div>
              <div className="stat-label">Legal Docs</div>
            </div>
            <div className="stat">
              <div className="stat-num">24/7</div>
              <div className="stat-label">AI Available</div>
            </div>
          </div>
        </div>

        <div className="chat-preview">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-status"></div>
              QanoonAI · Legal Consultation
            </div>
            <span style={{fontSize:"0.72rem", color:"var(--text-muted)"}}>Family Law</span>
          </div>
          <div className="chat-body">
            <div className="msg-user">I want to file for divorce. What are my legal rights?</div>
            <div className="msg-ai">
              <div className="msg-ai-header">
                <span style={{fontSize:"14px"}}>⚖</span>
                <span className="ai-name">QanoonAI</span>
              </div>
              Assalam o Alaikum, I understand this is a difficult time. Under Pakistani Family Law, you have the right to file for Khula in Family Court...
            </div>
            <div className="msg-user">Do I need a lawyer for this?</div>
            <div className="msg-ai">
              <div className="msg-ai-header">
                <span style={{fontSize:"14px"}}>⚖</span>
                <span className="ai-name">QanoonAI</span>
              </div>
              While not mandatory, a lawyer is recommended. We have verified family law specialists available — would you like me to connect you?
            </div>
          </div>
          <div className="chat-input-bar">
            <div className="fake-input">Describe your legal concern here...</div>
            <button className="send-btn">➤</button>
          </div>
        </div>
      </div>

      <div className="section" id="features">
        <div className="section-tag"><span>What We Offer</span></div>
        <div className="section-title">Everything You Need for Legal Help</div>
        <div className="section-sub">From AI guidance to real lawyer consultation — all in one place</div>
        <div className="features-grid">
          {[
            { icon: "🤖", title: "AI Legal Chatbot", desc: "Trained on Pakistani laws and real cases. Get instant answers on Family, Criminal, Civil, Banking & more." },
            { icon: "⚖", title: "Verified Lawyers", desc: "Browse and hire degree-verified lawyers. View ratings, specializations, and past case records before hiring." },
            { icon: "💬", title: "Secure Chat & Docs", desc: "Chat directly with your lawyer, share PDF documents and images — all in a secure encrypted interface." },
            { icon: "📁", title: "Past Cases Access", desc: "Registered lawyers can access historical case records — a powerful research tool for legal professionals." },
            { icon: "💳", title: "Secure Payments", desc: "Pay for lawyer consultations and AI plans via secure card payments. New lawyers available for free." },
            { icon: "🛡", title: "Admin Control Panel", desc: "Full admin dashboard to manage lawyers, customers, verify degrees, and monitor all platform activity." },
          ].map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section" id="pricing">
        <div className="section-tag"><span>AI Chatbot Plans</span></div>
        <div className="section-title">Choose Your Plan</div>
        <div className="section-sub">Upgrade anytime as your legal needs grow</div>
        <div className="plans-grid">
          <div className="plan-card">
            <div className="plan-name">Starter</div>
            <div className="plan-price">Free <span>/month</span></div>
            <div className="plan-desc">Basic legal questions answered</div>
            <ul className="plan-features">
              <li><span className="check">✓</span> 20 AI queries/month</li>
              <li><span className="check">✓</span> 3 Law categories</li>
              <li><span className="check">✓</span> Basic chat history</li>
              <li><span className="check">✓</span> Email support</li>
            </ul>
            <button className="plan-btn outline-btn" onClick={() => navigate("/signup")}>Get Started</button>
          </div>
          <div className="plan-card popular">
            <div className="popular-badge">Most Popular</div>
            <div className="plan-name">Professional</div>
            <div className="plan-price">Rs.999 <span>/month</span></div>
            <div className="plan-desc">For individuals with ongoing legal needs</div>
            <ul className="plan-features">
              <li><span className="check">✓</span> Unlimited AI queries</li>
              <li><span className="check">✓</span> All 7 law categories</li>
              <li><span className="check">✓</span> Full chat history</li>
              <li><span className="check">✓</span> Document upload & analysis</li>
              <li><span className="check">✓</span> Priority support</li>
            </ul>
            <button className="plan-btn filled-btn" onClick={() => navigate("/signup")}>Get Started</button>
          </div>
          <div className="plan-card">
            <div className="plan-name">Premium</div>
            <div className="plan-price">Rs.2499 <span>/month</span></div>
            <div className="plan-desc">Full platform access + lawyer priority</div>
            <ul className="plan-features">
              <li><span className="check">✓</span> Everything in Professional</li>
              <li><span className="check">✓</span> Priority lawyer matching</li>
              <li><span className="check">✓</span> Case tracking dashboard</li>
              <li><span className="check">✓</span> 1 Free lawyer consultation</li>
              <li><span className="check">✓</span> Dedicated support</li>
            </ul>
            <button className="plan-btn outline-btn" onClick={() => navigate("/signup")}>Get Started</button>
          </div>
        </div>
      </div>

      <footer>© 2026 QanoonAI · Pakistan's AI-Powered Legal Platform · For guidance only. Consult a licensed lawyer.</footer>
    </>
  );
}
