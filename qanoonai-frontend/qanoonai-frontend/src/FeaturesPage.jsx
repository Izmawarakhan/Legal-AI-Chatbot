import { useNavigate } from "react-router-dom";

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
  body { background: var(--bg-main); color: var(--text-primary); font-family: var(--font-body); }

  .nav { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 3rem; border-bottom: 1px solid var(--border); background: rgba(8,20,30,0.95); position: sticky; top: 0; z-index: 100; }
  .logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; cursor: pointer; }
  .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-links { display: flex; align-items: center; gap: 2rem; }
  .nav-links a { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; cursor: pointer; text-decoration: none; transition: color 0.2s; }
  .nav-links a:hover { color: var(--accent); }
  .nav-links a.active { color: var(--accent); }
  .nav-btns { display: flex; gap: 0.8rem; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--accent); padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.88rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); }
  .btn-primary { background: var(--accent); border: none; color: #08141e; padding: 0.5rem 1.4rem; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }

  .page-hero { text-align: center; padding: 4rem 2rem 2rem; max-width: 800px; margin: 0 auto; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.25); color: var(--accent); padding: 0.35rem 0.9rem; border-radius: 100px; font-size: 0.78rem; font-weight: 500; margin-bottom: 1.5rem; }
  .page-hero h1 { font-family: var(--font-display); font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; }
  .page-hero h1 span { color: var(--accent); }
  .page-hero p { font-size: 1.1rem; color: var(--text-secondary); line-height: 1.7; }

  .features-main { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }
  .feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; margin-bottom: 4rem; }
  .feature-row.reverse { direction: rtl; }
  .feature-row.reverse > * { direction: ltr; }
  .feature-visual { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; min-height: 280px; display: flex; align-items: center; justify-content: center; }
  .feature-icon-big { width: 80px; height: 80px; background: rgba(0,196,180,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; margin-bottom: 1rem; }
  .feature-content h2 { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; margin-bottom: 0.8rem; }
  .feature-content p { color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.2rem; }
  .feature-list { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
  .feature-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: var(--text-secondary); }
  .check-icon { width: 20px; height: 20px; background: rgba(0,196,180,0.15); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; margin-top: 2px; }

  .cta-section { background: linear-gradient(135deg, rgba(0,196,180,0.1), rgba(59,130,246,0.05)); border: 1px solid rgba(0,196,180,0.3); border-radius: 20px; padding: 3rem; text-align: center; margin: 4rem auto; max-width: 900px; }
  .cta-section h2 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 0.8rem; }
  .cta-section p { color: var(--text-secondary); margin-bottom: 1.5rem; }
  .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .btn-lg { padding: 0.85rem 2rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
  .btn-lg.primary { background: var(--accent); border: none; color: #08141e; }
  .btn-lg.outline { background: transparent; border: 1px solid rgba(0,196,180,0.3); color: var(--accent); }

  footer { border-top: 1px solid var(--border); padding: 2rem 3rem; text-align: center; color: var(--text-muted); font-size: 0.82rem; }

  /* Visual elements */
  .visual-chat { background: var(--bg-dark); border-radius: 12px; padding: 1rem; width: 100%; }
  .v-msg { padding: 0.5rem 0.8rem; border-radius: 10px; font-size: 0.78rem; margin-bottom: 0.5rem; max-width: 85%; }
  .v-msg.user { background: rgba(0,196,180,0.15); margin-left: auto; text-align: right; }
  .v-msg.ai { background: var(--bg-card2); color: var(--text-secondary); }

  .visual-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
  .v-card { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 10px; padding: 0.8rem; }
  .v-avatar { width: 32px; height: 32px; background: rgba(0,196,180,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--accent); font-weight: 600; margin-bottom: 6px; }
  .v-card-name { font-size: 0.78rem; font-weight: 600; }
  .v-card-spec { font-size: 0.68rem; color: var(--text-muted); }
  .v-verified { color: var(--accent); font-size: 10px; margin-left: 4px; }

  .visual-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
  .v-stat { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 10px; padding: 1rem; text-align: center; }
  .v-stat-num { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--accent); }
  .v-stat-label { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }

  @media (max-width: 768px) {
    .feature-row { grid-template-columns: 1fr; }
    .feature-row.reverse { direction: ltr; }
    .page-hero h1 { font-size: 2rem; }
  }
`;

export default function FeaturesPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🤖",
      title: "AI Legal Chatbot",
      desc: "Our intelligent AI chatbot is trained on 500+ Pakistani legal documents including Family Law, Criminal Law, Banking Law, and more. Get instant, accurate legal guidance 24/7.",
      points: [
        "Trained on Pakistani laws & court judgments",
        "Supports 7 major law categories",
        "Context-aware conversations with chat history",
        "Multi-language support (English, Roman Urdu)",
        "Document upload & analysis"
      ],
      visual: "chat"
    },
    {
      icon: "⚖",
      title: "Verified Lawyers Directory",
      desc: "Browse through a curated list of degree-verified lawyers. Every lawyer on our platform is manually verified by our admin team before being allowed to offer services.",
      points: [
        "Bar Council number verification",
        "Real ratings & reviews from clients",
        "View specialization & experience",
        "Transparent pricing — no hidden fees",
        "New lawyers available for free consultation"
      ],
      visual: "cards"
    },
    {
      icon: "💬",
      title: "Secure Chat with Lawyers",
      desc: "Chat directly with your chosen lawyer in a secure, encrypted interface. Share legal documents, PDFs, and images safely while discussing your case.",
      points: [
        "End-to-end encrypted messaging",
        "Share PDFs and images securely",
        "Real-time online/offline status",
        "Message history preserved",
        "File download & preview"
      ],
      visual: "chat2"
    },
    {
      icon: "📚",
      title: "Past Cases Research Database",
      desc: "Exclusively for registered lawyers — access a comprehensive database of Pakistani case laws, judgments, and legal precedents. Essential research tool for professionals.",
      points: [
        "Thousands of case citations (PLD, PCrLJ, CLD)",
        "Search by case name, citation, or section",
        "Filter by court, year, category",
        "Full case summaries with judge details",
        "Landmark cases from Supreme Court & High Courts"
      ],
      visual: "stats"
    },
    {
      icon: "💳",
      title: "Secure Card Payments",
      desc: "Pay for lawyer consultations and AI chatbot plans through secure card payment integration. All transactions are protected and logged.",
      points: [
        "Stripe-powered secure payments",
        "Multiple payment methods supported",
        "Transaction history & receipts",
        "Free tier for new lawyers",
        "Flexible AI plans (Starter, Pro, Premium)"
      ],
      visual: "payment"
    },
    {
      icon: "🛡",
      title: "Admin Control Panel",
      desc: "Complete administrative control over the entire platform. Verify lawyer credentials, manage users, monitor activities, and ensure quality service.",
      points: [
        "Lawyer verification system",
        "User management (customers & lawyers)",
        "Revenue & analytics dashboard",
        "Case monitoring",
        "Real-time activity logs"
      ],
      visual: "admin"
    }
  ];

  return (
    <>
      <style>{styles}</style>

      <nav className="nav">
        <div className="logo" onClick={() => navigate("/")}>
          <div className="logo-icon">⚖</div>
          QanoonAI
        </div>
        <div className="nav-links">
          <a className="active" onClick={() => navigate("/features")}>Features</a>
          <a onClick={() => navigate("/lawyers")}>Lawyers</a>
          <a onClick={() => navigate("/#pricing")}>Pricing</a>
          <a onClick={() => navigate("/about")}>About</a>
        </div>
        <div className="nav-btns">
          <button className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      <div className="page-hero">
        <div className="hero-badge">✨ Everything you need in one place</div>
        <h1>Powerful <span>Features</span><br />Built for Pakistan</h1>
        <p>From AI-powered legal assistance to verified lawyer connections — discover how QanoonAI revolutionizes legal help in Pakistan.</p>
      </div>

      <div className="features-main">
        {features.map((f, i) => (
          <div key={i} className={`feature-row ${i % 2 === 1 ? "reverse" : ""}`}>
            <div className="feature-content">
              <div className="feature-icon-big">{f.icon}</div>
              <h2>{f.title}</h2>
              <p>{f.desc}</p>
              <ul className="feature-list">
                {f.points.map((p, j) => (
                  <li key={j}><span className="check-icon">✓</span> {p}</li>
                ))}
              </ul>
            </div>
            <div className="feature-visual">
              {f.visual === "chat" && (
                <div className="visual-chat">
                  <div className="v-msg user">What is Section 302 PPC?</div>
                  <div className="v-msg ai">Section 302 of Pakistan Penal Code deals with punishment for Qatl-i-Amd (intentional murder). It prescribes...</div>
                  <div className="v-msg user">Explain with a case example</div>
                </div>
              )}
              {f.visual === "cards" && (
                <div className="visual-cards">
                  <div className="v-card">
                    <div className="v-avatar">SK</div>
                    <div className="v-card-name">Adv. Sara Khan <span className="v-verified">✓</span></div>
                    <div className="v-card-spec">Family Law · ⭐ 4.9</div>
                  </div>
                  <div className="v-card">
                    <div className="v-avatar">AR</div>
                    <div className="v-card-name">Adv. Ahmed <span className="v-verified">✓</span></div>
                    <div className="v-card-spec">Criminal · ⭐ 4.8</div>
                  </div>
                  <div className="v-card">
                    <div className="v-avatar">FA</div>
                    <div className="v-card-name">Adv. Fatima <span className="v-verified">✓</span></div>
                    <div className="v-card-spec">Banking · ⭐ 4.7</div>
                  </div>
                  <div className="v-card">
                    <div className="v-avatar">BS</div>
                    <div className="v-card-name">Adv. Bilal <span className="v-verified">✓</span></div>
                    <div className="v-card-spec">Civil · ⭐ 4.5</div>
                  </div>
                </div>
              )}
              {f.visual === "chat2" && (
                <div className="visual-chat">
                  <div className="v-msg ai">Please share your Nikah Nama</div>
                  <div className="v-msg user">📎 Nikah_Nama.pdf (1.2 MB)</div>
                  <div className="v-msg ai">Received. I'll review it by tomorrow.</div>
                  <div className="v-msg user">Thank you 🙏</div>
                </div>
              )}
              {f.visual === "stats" && (
                <div className="visual-stats">
                  <div className="v-stat">
                    <div className="v-stat-num">5K+</div>
                    <div className="v-stat-label">Case Laws</div>
                  </div>
                  <div className="v-stat">
                    <div className="v-stat-num">100+</div>
                    <div className="v-stat-label">Citations</div>
                  </div>
                  <div className="v-stat">
                    <div className="v-stat-num">All</div>
                    <div className="v-stat-label">Courts</div>
                  </div>
                  <div className="v-stat">
                    <div className="v-stat-num">1947+</div>
                    <div className="v-stat-label">Judgments</div>
                  </div>
                </div>
              )}
              {f.visual === "payment" && (
                <div style={{width:"100%"}}>
                  <div style={{background:"var(--bg-dark)", border:"1px solid var(--border)", borderRadius:12, padding:"1.2rem"}}>
                    <div style={{fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:6}}>Consultation Fee</div>
                    <div style={{fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:800, marginBottom:"1rem"}}>Rs. 2,500</div>
                    <div style={{background:"var(--bg-card2)", padding:"0.7rem", borderRadius:8, fontSize:"0.8rem", marginBottom:"0.6rem"}}>💳 •••• •••• •••• 4242</div>
                    <div style={{background:"rgba(0,196,180,0.15)", color:"var(--accent)", padding:"0.6rem", borderRadius:8, textAlign:"center", fontSize:"0.82rem", fontWeight:600}}>✓ Payment Secure</div>
                  </div>
                </div>
              )}
              {f.visual === "admin" && (
                <div className="visual-stats">
                  <div className="v-stat">
                    <div className="v-stat-num">1,284</div>
                    <div className="v-stat-label">Customers</div>
                  </div>
                  <div className="v-stat">
                    <div className="v-stat-num">86</div>
                    <div className="v-stat-label">Lawyers</div>
                  </div>
                  <div className="v-stat">
                    <div className="v-stat-num">284K</div>
                    <div className="v-stat-label">Revenue</div>
                  </div>
                  <div className="v-stat">
                    <div className="v-stat-num">342</div>
                    <div className="v-stat-label">Cases</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join 1,200+ users who trust QanoonAI for their legal needs</p>
        <div className="cta-btns">
          <button className="btn-lg primary" onClick={() => navigate("/signup")}>Create Free Account</button>
          <button className="btn-lg outline" onClick={() => navigate("/lawyers")}>Browse Lawyers</button>
        </div>
      </div>

      <footer>© 2026 QanoonAI · Pakistan's AI-Powered Legal Platform · For guidance only. Consult a licensed lawyer.</footer>
    </>
  );
}
