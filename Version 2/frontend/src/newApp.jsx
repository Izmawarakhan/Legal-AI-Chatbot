import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000";

const CATEGORIES = [
  { name: "Family Law", icon: "👨‍👩‍👧‍👦", desc: "Marriage, Divorce, Custody, Meher" },
  { name: "Criminal Law", icon: "⚖️", desc: "FIR, Bail, Murder, Theft, Fraud" },
  { name: "Labour Laws", icon: "👷", desc: "Employment, Wages, Termination" },
  { name: "Land & Property Laws", icon: "🏠", desc: "Property Disputes, Transfer, Fraud" },
  { name: "Islamic Religious Laws", icon: "☪️", desc: "Hudood, Waqf, Blasphemy" },
  { name: "Excise Taxation Laws", icon: "💰", desc: "Income Tax, Sales Tax, FBR" },
  { name: "Health & Medical Laws", icon: "🏥", desc: "Negligence, Hospital, Drug Cases" },
];

const SUGGESTIONS = [
  "I want to file for divorce. What are my legal rights?",
  "Someone snatched my phone. How do I register an FIR?",
  "My employer terminated me without notice. What can I do?",
  "A hospital refused emergency treatment. Is this legal?",
];

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Voice State
  const [voiceState, setVoiceState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [autoSpeak, setAutoSpeak] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  // FIX 1: Track final transcript to prevent double send
  const finalTranscriptRef = useRef("");
  // FIX 2: Track if we already sent this transcript
  const sentRef = useRef(false);

  useEffect(() => {
    fetchSessions();
    initVoices();
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================
  // VOICES INIT
  // ============================================
  const initVoices = () => {
    const loadVoices = () => {
      const available = window.speechSynthesis?.getVoices() || [];
      setVoices(available);
      const enIdx = available.findIndex(v => v.lang.startsWith("en"));
      if (enIdx > -1) setSelectedVoice(enIdx);
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  };

  // ============================================
  // SPEECH RECOGNITION — Fresh instance every time
  // FIX 2: Create new recognition instance each time to avoid stale state
  // FIX 3: Urdu support — set lang properly
  // ============================================
  const createRecognition = (lang) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    // FIX 3: For Urdu, also try hi-IN as fallback since ur-PK has limited browser support
    // Chrome supports: en-US, en-GB, hi-IN (Hindi works for Urdu too), ur-PK (limited)

    finalTranscriptRef.current = "";
    sentRef.current = false;

    recognition.onstart = () => {
      setVoiceState("listening");
      setTranscript("Listening...");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t;
        } else {
          interimText += t;
        }
      }
      // Update display
      setTranscript(finalText || interimText || "Listening...");
      // Store final transcript
      if (finalText) {
        finalTranscriptRef.current = finalText;
      }
    };

    recognition.onend = () => {
      setVoiceState("idle");
      // FIX 1: Only send if we have final text AND haven't sent yet
      const txt = finalTranscriptRef.current.trim();
      if (txt && !sentRef.current) {
        sentRef.current = true; // Prevent double send
        handleVoiceSend(txt);
      } else if (!txt) {
        setTranscript("");
      }
      // Clean up reference so next mic click creates fresh instance
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      setVoiceState("idle");
      setTranscript("");
      recognitionRef.current = null;
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    return recognition;
  };

  // ============================================
  // MIC TOGGLE — Create fresh instance each time
  // ============================================
  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    // Stop any ongoing speech
    if (voiceState === "speaking") {
      window.speechSynthesis?.cancel();
      setVoiceState("idle");
    }

    if (voiceState === "listening" && recognitionRef.current) {
      // Stop listening
      try { recognitionRef.current.stop(); } catch(e) {}
      setVoiceState("idle");
      recognitionRef.current = null;
      return;
    }

    // FIX 2: Create FRESH recognition instance every time
    const recognition = createRecognition(voiceLang);
    if (!recognition) return;

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      recognitionRef.current = null;
    }
  };

  // ============================================
  // HANDLE VOICE SEND — Separate function to avoid closure issues
  // ============================================
  const handleVoiceSend = (text) => {
    if (text && text !== "Listening...") {
      sendMessage(text);
    }
  };

  // ============================================
  // TEXT-TO-SPEECH
  // ============================================
  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voices[selectedVoice] || null;
    utterance.rate = 1.05;
    utterance.pitch = 1;

    utterance.onstart = () => setVoiceState("speaking");
    utterance.onend = () => setVoiceState("idle");
    utterance.onerror = () => setVoiceState("idle");

    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoice]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setVoiceState("idle");
  };

  // ============================================
  // API CALLS
  // ============================================
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/sessions`);
      if (res.ok) setSessions(await res.json());
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/history/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(sessionId);
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  };

  const startNewChat = () => {
    setActiveSession(null);
    setMessages([]);
    setInput("");
    setTranscript("");
    stopSpeaking();
    inputRef.current?.focus();
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    stopSpeaking();
    if (voiceState === "listening" && recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
      recognitionRef.current = null;
    }

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setTranscript("⚡ Thinking...");
    setLoading(true);
    setVoiceState("thinking");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          session_id: activeSession,
          religion: "Muslim",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session_id);
        const reply = data.reply;
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setTranscript("✅ Done — tap mic to speak again");
        fetchSessions();

        if (autoSpeak) {
          speakText(reply);
        } else {
          setVoiceState("idle");
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
        setVoiceState("idle");
        setTranscript("❌ Error occurred");
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Check if API server is running." }]);
      setVoiceState("idle");
      setTranscript("❌ Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/chat/session/${sessionId}`, { method: "DELETE" });
      if (activeSession === sessionId) startNewChat();
      fetchSessions();
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================
  // STYLES
  // ============================================
  const colors = {
    bg: "#0a1a1a",
    bgSidebar: "rgba(8, 28, 28, 0.95)",
    bgInput: "rgba(20, 50, 50, 0.6)",
    bgHover: "rgba(30, 70, 65, 0.5)",
    accent: "#2dd4a8",
    accentDim: "rgba(45, 212, 168, 0.15)",
    accentGlow: "rgba(45, 212, 168, 0.3)",
    blue: "#38bdf8",
    red: "#ef4444",
    amber: "#f59e0b",
    text: "#e2e8f0",
    textDim: "#94a3b8",
    textMuted: "#64748b",
    border: "rgba(45, 212, 168, 0.12)",
    borderLight: "rgba(255,255,255,0.06)",
    glass: "rgba(16, 42, 42, 0.55)",
    userBubble: "linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))",
    aiBubble: "rgba(20, 45, 45, 0.6)",
  };

  const stateColors = { idle: colors.accent, listening: colors.red, thinking: colors.amber, speaking: colors.blue };
  const stateLabels = { idle: "● Idle", listening: "● Listening", thinking: "● Thinking", speaking: "● Speaking" };
  const fontStack = "'Outfit', 'Poppins', system-ui, sans-serif";

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      background: `radial-gradient(ellipse at 20% 50%, rgba(16, 80, 70, 0.4) 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 20%, rgba(20, 60, 90, 0.3) 0%, transparent 50%),
                   radial-gradient(ellipse at 50% 100%, rgba(10, 50, 50, 0.5) 0%, transparent 50%),
                   ${colors.bg}`,
      fontFamily: fontStack, color: colors.text, overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ============ SIDEBAR ============ */}
      <div style={{
        width: sidebarOpen ? 280 : 0, minWidth: sidebarOpen ? 280 : 0,
        background: colors.bgSidebar, borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column", transition: "all 0.3s ease",
        overflow: "hidden", backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>⚖️</div>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Qanoon<span style={{ color: colors.accent }}>AI</span>
            </span>
          </div>
          <button onClick={startNewChat} style={{
            width: "100%", padding: "12px 16px",
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
            color: "#0a1a1a", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: fontStack,
          }}>+ New Session</button>
        </div>

        {/* Voice Settings */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>
            🎤 Voice Settings
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[["en-US", "English"], ["ur-PK", "Urdu"], ["hi-IN", "Hindi/Urdu"]].map(([code, label]) => (
              <button key={code} onClick={() => setVoiceLang(code)} style={{
                flex: 1, padding: "5px 6px",
                background: voiceLang === code ? colors.accentDim : "transparent",
                border: `1px solid ${voiceLang === code ? colors.accent : colors.border}`,
                borderRadius: 6, color: voiceLang === code ? colors.accent : colors.textDim,
                fontSize: 10, cursor: "pointer", fontFamily: fontStack, fontWeight: 500,
              }}>{label}</button>
            ))}
          </div>
          <select value={selectedVoice} onChange={(e) => setSelectedVoice(Number(e.target.value))}
            style={{
              width: "100%", padding: "5px 8px",
              background: "rgba(20, 50, 50, 0.6)", border: `1px solid ${colors.border}`,
              borderRadius: 6, color: colors.text, fontSize: 11, fontFamily: fontStack, outline: "none",
            }}>
            {voices.map((v, i) => (<option key={i} value={i}>{v.name} ({v.lang})</option>))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11, color: colors.textDim, cursor: "pointer" }}>
            <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)}
              style={{ accentColor: colors.accent }} />
            Auto-speak AI replies
          </label>
        </div>

        {/* Session List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, padding: "8px 10px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Recent Chats
          </div>
          {sessions.map((s) => (
            <div key={s.session_id} onClick={() => loadSession(s.session_id)} style={{
              padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
              background: activeSession === s.session_id ? colors.accentDim : "transparent",
              border: activeSession === s.session_id ? `1px solid ${colors.border}` : "1px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { if (activeSession !== s.session_id) e.currentTarget.style.background = colors.bgHover; }}
              onMouseLeave={(e) => { if (activeSession !== s.session_id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", maxWidth: 180 }}>
                  {s.title || "New Chat"}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{s.message_count || 0} messages</div>
              </div>
              <button onClick={(e) => deleteSession(s.session_id, e)} style={{
                background: "none", border: "none", color: colors.textMuted, cursor: "pointer",
                fontSize: 14, padding: "2px 6px", borderRadius: 4, opacity: 0.5,
              }}
                onMouseEnter={(e) => { e.target.style.opacity = "1"; e.target.style.color = "#ef4444"; }}
                onMouseLeave={(e) => { e.target.style.opacity = "0.5"; e.target.style.color = colors.textMuted; }}
              >✕</button>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textMuted }}>
          ⚠️ For guidance only. Consult a licensed lawyer.
        </div>
      </div>

      {/* ============ MAIN AREA ============ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Navbar */}
        <div style={{
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", borderBottom: `1px solid ${colors.border}`,
          background: "rgba(10, 26, 26, 0.8)", backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: "none", border: "none", color: colors.textDim, cursor: "pointer", fontSize: 20, padding: "4px 8px",
            }}>☰</button>
            <span style={{ fontSize: 14, color: colors.textDim, fontWeight: 500 }}>
              {activeSession ? "Legal Consultation" : "New Consultation"}
            </span>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginLeft: 12,
              padding: "3px 10px", borderRadius: 20,
              background: `${stateColors[voiceState]}15`, border: `1px solid ${stateColors[voiceState]}30`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: stateColors[voiceState],
                boxShadow: voiceState !== "idle" ? `0 0 8px ${stateColors[voiceState]}` : "none",
                animation: voiceState === "listening" ? "dpulse 0.8s ease-in-out infinite alternate" : "none",
              }} />
              <span style={{ fontSize: 11, color: stateColors[voiceState], letterSpacing: "0.05em", fontWeight: 500 }}>
                {stateLabels[voiceState]}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NavItem label="Categories" />
            <NavItem label="Past Cases" />
            <NavItem label="Find Lawyer" />
            <button style={{
              padding: "6px 16px", background: colors.accentDim, color: colors.accent,
              border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: fontStack,
            }}>Login</button>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={sendMessage} colors={colors} fontStack={fontStack} />
          ) : (
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} colors={colors}
                  onSpeak={speakText} onStop={stopSpeaking}
                  isSpeaking={voiceState === "speaking"} />
              ))}
              {loading && <TypingIndicator colors={colors} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Transcript Bar */}
        {transcript && (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", width: "100%" }}>
            <div style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12,
              background: "rgba(20, 50, 50, 0.4)",
              border: `1px solid ${voiceState === "listening" ? colors.red + "50" : colors.border}`,
              color: voiceState === "listening" ? colors.text : colors.textDim,
            }}>{transcript}</div>
          </div>
        )}

        {/* Input Bar */}
        <div style={{ padding: "12px 24px 20px", background: "transparent" }}>
          <div style={{
            maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 10,
            background: colors.bgInput,
            border: `1px solid ${voiceState === "listening" ? colors.red + "60" : colors.border}`,
            borderRadius: 14, padding: "4px 8px 4px 20px", backdropFilter: "blur(16px)",
            boxShadow: voiceState === "listening" ? `0 0 20px ${colors.red}20` : `0 4px 24px rgba(0,0,0,0.2)`,
            transition: "all 0.3s",
          }}>
            <button style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 18, padding: 4 }}
              title="Upload Document">📎</button>

            <textarea ref={inputRef} value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={voiceState === "listening" ? "🎤 Listening... speak now" : "Describe your legal concern or tap mic to speak..."}
              rows={1} style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: colors.text, fontSize: 14, fontFamily: fontStack, resize: "none",
                padding: "12px 0", lineHeight: 1.5,
              }} />

            {/* Mic Button */}
            <button onClick={toggleMic}
              title={voiceState === "listening" ? "Tap to Stop" : "Tap to Speak"}
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: voiceState === "listening" ? `${colors.red}20` : colors.bgHover,
                border: `2px solid ${voiceState === "listening" ? colors.red : colors.border}`,
                color: voiceState === "listening" ? colors.red : colors.textDim,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, transition: "all 0.25s",
                animation: voiceState === "listening" ? "micPulse 1.2s ease-in-out infinite" : "none",
                boxShadow: voiceState === "listening" ? `0 0 20px ${colors.red}40` : "none",
              }}>
              {voiceState === "listening" ? "⏹" : "🎤"}
            </button>

            {voiceState === "speaking" && (
              <button onClick={stopSpeaking} title="Stop Speaking" style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${colors.blue}20`, border: `2px solid ${colors.blue}50`,
                color: colors.blue, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>🔇</button>
            )}

            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
              width: 44, height: 44, borderRadius: 12,
              background: input.trim() ? `linear-gradient(135deg, ${colors.accent}, ${colors.blue})` : colors.bgHover,
              border: "none", color: input.trim() ? "#0a1a1a" : colors.textMuted,
              cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              {loading ? "⏳" : "➤"}
            </button>
          </div>

          <style>{`
            @keyframes micPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
            @keyframes dpulse { from { opacity: 1; } to { opacity: 0.4; } }
          `}</style>

          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: colors.textMuted }}>
            QanoonAI provides legal guidance only. Always verify with official statutes and licensed lawyers.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================
function NavItem({ label }) {
  return (
    <span style={{ fontSize: 13, color: "#94a3b8", cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "all 0.15s" }}
      onMouseEnter={(e) => { e.target.style.color = "#e2e8f0"; e.target.style.background = "rgba(30,70,65,0.3)"; }}
      onMouseLeave={(e) => { e.target.style.color = "#94a3b8"; e.target.style.background = "transparent"; }}
    >{label}</span>
  );
}

function WelcomeScreen({ onSuggestion, colors, fontStack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 24px" }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: "linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))",
        border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 24, boxShadow: `0 0 40px ${colors.accentGlow}`,
        animation: "pulse 3s ease-in-out infinite",
      }}>⚖️</div>
      <style>{`@keyframes pulse { 0%, 100% { box-shadow: 0 0 40px rgba(45,212,168,0.2); } 50% { box-shadow: 0 0 60px rgba(45,212,168,0.4); } }`}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Tell Me What's On Your Mind</h1>
      <p style={{ fontSize: 15, color: colors.textDim, marginBottom: 36, textAlign: "center" }}>
        Type, pick a suggestion, or tap 🎤 to speak
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 700, marginBottom: 32 }}>
        {CATEGORIES.slice(0, 4).map((cat) => (
          <div key={cat.name} onClick={() => onSuggestion("I need legal help regarding " + cat.name)}
            style={{
              width: 155, padding: "16px 14px", background: colors.glass,
              border: `1px solid ${colors.border}`, borderRadius: 12, cursor: "pointer",
              backdropFilter: "blur(12px)", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600, width: "100%" }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => onSuggestion(s)} style={{
            padding: "12px 16px", background: colors.bgInput,
            border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.textDim,
            cursor: "pointer", textAlign: "left", fontSize: 13, fontFamily: fontStack, transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.target.style.borderColor = colors.accent; e.target.style.color = colors.text; }}
            onMouseLeave={(e) => { e.target.style.borderColor = colors.border; e.target.style.color = colors.textDim; }}
          >💡 {s}</button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, colors, onSpeak, onStop, isSpeaking }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      <div style={{
        maxWidth: "80%", padding: "14px 18px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? colors.userBubble : colors.aiBubble,
        border: `1px solid ${isUser ? "rgba(45,212,168,0.2)" : colors.border}`,
        fontSize: 14, lineHeight: 1.7, color: colors.text, backdropFilter: "blur(8px)", whiteSpace: "pre-wrap",
      }}>
        {!isUser && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>⚖️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>QanoonAI</span>
            </div>
            <button onClick={() => isSpeaking ? onStop() : onSpeak(msg.content)}
              style={{
                background: "none", border: `1px solid ${colors.border}`, borderRadius: 6,
                color: isSpeaking ? colors.blue : colors.textDim, cursor: "pointer",
                fontSize: 11, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4,
              }}>
              {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
            </button>
          </div>
        )}
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator({ colors }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
      <div style={{
        padding: "14px 18px", borderRadius: "16px 16px 16px 4px",
        background: colors.aiBubble, border: `1px solid ${colors.border}`,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ fontSize: 14 }}>⚖️</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%", background: colors.accent, opacity: 0.5,
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; } 40% { transform: scale(1.2); opacity: 1; } }`}</style>
      </div>
    </div>
  );
}