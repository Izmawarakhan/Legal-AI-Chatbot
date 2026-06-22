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
  .nav-links a { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: color 0.2s; }
  .nav-links a:hover { color: var(--accent); }
  .nav-links a.active { color: var(--accent); }
  .nav-btns { display: flex; gap: 0.8rem; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--accent); padding: 0.5rem 1.2rem; border-radius: 8px; font-size: 0.88rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); }
  .btn-primary { background: var(--accent); border: none; color: #08141e; padding: 0.5rem 1.4rem; border-radius: 8px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }

  .hero { text-align: center; padding: 4rem 2rem 2rem; max-width: 900px; margin: 0 auto; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.25); color: var(--accent); padding: 0.35rem 0.9rem; border-radius: 100px; font-size: 0.78rem; font-weight: 500; margin-bottom: 1.5rem; }
  .hero h1 { font-family: var(--font-display); font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; }
  .hero h1 span { color: var(--accent); }
  .hero p { font-size: 1.1rem; color: var(--text-secondary); line-height: 1.7; max-width: 700px; margin: 0 auto; }

  .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }

  /* STATS */
  .stats-section { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; padding: 2rem 0 3rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; text-align: center; }
  .stat-num { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--accent); margin-bottom: 0.3rem; }
  .stat-label { font-size: 0.85rem; color: var(--text-secondary); }

  /* MISSION */
  .mission { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 3rem; margin-bottom: 3rem; }
  .section-tag { display: inline-block; background: rgba(0,196,180,0.1); border: 1px solid rgba(0,196,180,0.2); color: var(--accent); padding: 0.3rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 500; margin-bottom: 1rem; }
  .mission h2 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
  .mission p { color: var(--text-secondary); line-height: 1.8; font-size: 1rem; margin-bottom: 1rem; }

  /* VALUES */
  .values-title { text-align: center; margin-bottom: 2rem; }
  .values-title h2 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
  .values-title p { color: var(--text-secondary); }
  .values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; margin-bottom: 3rem; }
  .value-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.8rem; transition: all 0.2s; }
  .value-card:hover { border-color: rgba(0,196,180,0.4); transform: translateY(-3px); }
  .value-icon { width: 48px; height: 48px; background: rgba(0,196,180,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 1rem; }
  .value-card h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
  .value-card p { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; }

  /* HOW IT WORKS */
  .steps-container { margin-bottom: 3rem; }
  .steps-title { text-align: center; margin-bottom: 2rem; }
  .steps-title h2 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
  .steps-title p { color: var(--text-secondary); }
  .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .step-card { position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; }
  .step-num { position: absolute; top: -14px; left: 1.5rem; width: 32px; height: 32px; background: var(--accent); color: #08141e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-display); }
  .step-card h4 { font-family: var(--font-display); font-size: 1rem; font-weight: 600; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .step-card p { color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; }

  /* TEAM */
  .team-title { text-align: center; margin-bottom: 2rem; }
  .team-title h2 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
  .team-title p { color: var(--text-secondary); }
  .team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; margin-bottom: 3rem; }
  .team-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 1.8rem; text-align: center; transition: all 0.2s; }
  .team-card:hover { border-color: rgba(0,196,180,0.4); transform: translateY(-2px); }
  .team-avatar { width: 80px; height: 80px; background: rgba(0,196,180,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--accent); margin: 0 auto 1rem; }
  .team-name { font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; margin-bottom: 0.3rem; }
  .team-role { color: var(--accent); font-size: 0.85rem; margin-bottom: 0.5rem; }
  .team-bio { color: var(--text-secondary); font-size: 0.82rem; line-height: 1.6; }

  /* CONTACT */
  .contact-card { background: linear-gradient(135deg, rgba(0,196,180,0.1), rgba(59,130,246,0.05)); border: 1px solid rgba(0,196,180,0.3); border-radius: 20px; padding: 3rem; text-align: center; margin-bottom: 3rem; }
  .contact-card h2 { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; }
  .contact-card p { color: var(--text-secondary); margin-bottom: 1.5rem; }
  .contact-info { display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .contact-item { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.9rem; }
  .contact-icon { color: var(--accent); font-size: 16px; }
  .btn-lg { padding: 0.85rem 2rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); background: var(--accent); border: none; color: #08141e; }

  footer { border-top: 1px solid var(--border); padding: 2rem 3rem; text-align: center; color: var(--text-muted); font-size: 0.82rem; }

  @media (max-width: 768px) {
    .stats-section, .values-grid, .steps-grid, .team-grid { grid-template-columns: 1fr; }
    .hero h1 { font-size: 2rem; }
  }
`;

export default function AboutPage() {
  const navigate = useNavigate();

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
          <a onClick={() => navigate("/#pricing")}>Pricing</a>
          <a className="active" onClick={() => navigate("/about")}>About</a>
        </div>
        <div className="nav-btns">
          <button className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-primary" onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-badge">💙 About Us</div>
        <h1>Making Legal Help<br /><span>Accessible</span> for Everyone</h1>
        <p>QanoonAI is Pakistan's first AI-powered legal platform, built to bridge the gap between citizens and qualified legal professionals.</p>
      </div>

      <div className="container">
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-num">1,200+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">86</div>
            <div className="stat-label">Verified Lawyers</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">500+</div>
            <div className="stat-label">Legal Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">24/7</div>
            <div className="stat-label">AI Support</div>
          </div>
        </div>

        <div className="mission">
          <div className="section-tag">🎯 Our Mission</div>
          <h2>Democratizing Legal Access in Pakistan</h2>
          <p>In Pakistan, legal help is often expensive, confusing, and hard to access. Many citizens don't know their rights, and finding a trustworthy lawyer can be challenging. QanoonAI was created to solve these problems.</p>
          <p>We combine the power of Artificial Intelligence with a network of verified lawyers to provide instant legal guidance and easy professional consultation — all in one platform. Our AI is trained on hundreds of Pakistani legal documents, ensuring relevant and accurate information.</p>
          <p>Whether you're facing a family issue, criminal matter, or need business legal advice, QanoonAI is your first step toward justice.</p>
        </div>

        <div className="values-title">
          <div className="section-tag">💎 Our Values</div>
          <h2>What Drives Us</h2>
          <p>The principles that guide everything we build</p>
        </div>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">🔒</div>
            <h3>Privacy First</h3>
            <p>Your legal conversations and documents are encrypted and confidential. We never share your data with third parties.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">✓</div>
            <h3>Verified Quality</h3>
            <p>Every lawyer on our platform is manually verified for authentic credentials. No fake profiles, only qualified professionals.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">💡</div>
            <h3>Accessible to All</h3>
            <p>Free AI consultations, free new lawyers, flexible plans — making legal help affordable for every Pakistani.</p>
          </div>
        </div>

        <div className="steps-container">
          <div className="steps-title">
            <div className="section-tag">🚀 How It Works</div>
            <h2>Get Legal Help in 4 Simple Steps</h2>
            <p>From question to resolution — we guide you all the way</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <h4>Sign Up Free</h4>
              <p>Create your account in under 2 minutes. No credit card required.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h4>Ask AI</h4>
              <p>Chat with QanoonAI for instant answers on Pakistani law.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h4>Find Lawyer</h4>
              <p>Browse verified lawyers by specialization, ratings, and fees.</p>
            </div>
            <div className="step-card">
              <div className="step-num">4</div>
              <h4>Get Help</h4>
              <p>Chat, share documents, and pay securely — all in one place.</p>
            </div>
          </div>
        </div>

        <div className="team-title">
          <div className="section-tag">👥 Our Team</div>
          <h2>Meet the Creators</h2>
          <p>FYP Project by Computer Science Students</p>
        </div>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">BI</div>
            <div className="team-name">Bilal Iqbal</div>
            <div className="team-role">Full Stack Developer</div>
            <div className="team-bio">Lead developer responsible for frontend, backend integration, and AI chatbot implementation.</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">TM</div>
            <div className="team-name">Team Member 2</div>
            <div className="team-role">Backend & Database</div>
            <div className="team-bio">MongoDB architecture, API design, and payment integration specialist.</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">TM</div>
            <div className="team-name">Team Member 3</div>
            <div className="team-role">AI & Research</div>
            <div className="team-bio">FAISS vector database, legal document training, and AI model fine-tuning.</div>
          </div>
        </div>

        <div className="contact-card">
          <h2>Get in Touch</h2>
          <p>Have questions or feedback? We'd love to hear from you!</p>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <span>contact@qanoonai.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span>+92 300 1234567</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span>Karachi, Pakistan</span>
            </div>
          </div>
          <button className="btn-lg" onClick={() => navigate("/signup")}>Join QanoonAI Today</button>
        </div>
      </div>

      <footer>© 2026 QanoonAI · Pakistan's AI-Powered Legal Platform · For guidance only. Consult a licensed lawyer.</footer>
    </>
  );
}
