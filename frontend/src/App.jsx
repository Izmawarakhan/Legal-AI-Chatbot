import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000";

// Debug logger
const debug = {
  log: (...args) => console.log("[DEBUG]", new Date().toISOString(), ...args),
  error: (...args) => console.error("[ERROR]", new Date().toISOString(), ...args),
  info: (...args) => console.info("[INFO]", new Date().toISOString(), ...args),
  warn: (...args) => console.warn("[WARN]", new Date().toISOString(), ...args),
};

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

export default function QanoonAI() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastRecordingPath, setLastRecordingPath] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  debug.log("🚀 QanoonAI component mounted");

  useEffect(() => {
    debug.log("📞 Fetching sessions on mount");
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    debug.log("💬 Messages updated, scrolling to bottom");
  }, [messages]);

  const fetchSessions = async () => {
    debug.log("🔄 Fetching all chat sessions from API");
    try {
      const res = await fetch(`${API_BASE}/api/chat/sessions`);
      debug.log(`📡 API Response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        debug.log(`✅ Sessions fetched successfully: ${data.length} sessions found`);
        setSessions(data);
      } else {
        debug.error(`❌ Failed to fetch sessions: ${res.status}`);
      }
    } catch (e) {
      debug.error("Failed to fetch sessions:", e);
    }
  };

  const loadSession = async (sessionId) => {
    debug.log(`📂 Loading session: ${sessionId}`);
    try {
      const res = await fetch(`${API_BASE}/api/chat/history/${sessionId}`);
      debug.log(`📡 API Response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        debug.log(`✅ Session loaded: ${data.messages?.length || 0} messages`);
        setActiveSession(sessionId);
        setMessages(data.messages || []);
      } else {
        debug.error(`❌ Failed to load session: ${res.status}`);
      }
    } catch (e) {
      debug.error("Failed to load session:", e);
    }
  };

  const startNewChat = () => {
    debug.log("🆕 Starting new chat session");
    setActiveSession(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
    debug.log("✅ New chat started, input focused");
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    debug.log(`💬 Sending message: "${msg.substring(0, 50)}..."`);
    
    if (!msg || loading) {
      debug.warn("⚠️ Message empty or loading in progress, skipping send");
      return;
    }

    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    debug.log("📝 User message added to UI");

    try {
      const requestBody = {
        message: msg,
        session_id: activeSession,
        religion: "Muslim",
      };
      debug.log("📡 Sending request to /api/chat", requestBody);
      
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      debug.log(`📡 API Response status: ${res.status}`);

      if (res.ok) {
        const data = await res.json();
        debug.log(`✅ Message sent successfully. Session: ${data.session_id}`);
        debug.log(`🤖 AI Response: "${data.reply.substring(0, 100)}..."`);
        setActiveSession(data.session_id);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        fetchSessions();
      } else {
        debug.error(`❌ API Error: ${res.status}`);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      }
    } catch (e) {
      debug.error("Connection error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please check if the API server is running." },
      ]);
    } finally {
      setLoading(false);
      debug.log("🏁 Message sending completed");
    }
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    debug.log(`🗑️ Deleting session: ${sessionId}`);
    try {
      const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}`, { method: "DELETE" });
      debug.log(`📡 Delete response status: ${res.status}`);
      if (activeSession === sessionId) startNewChat();
      fetchSessions();
      debug.log(`✅ Session ${sessionId} deleted successfully`);
    } catch (e) {
      debug.error("Failed to delete:", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      debug.log("⌨️ Enter key pressed, sending message");
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice Recording - Hold to Record
  const startRecording = async () => {
    debug.log("🎤 Starting voice recording...");
    try {
      debug.log("📱 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      debug.log("✅ Microphone access granted!");
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      debug.log("🎙️ MediaRecorder created");

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          debug.log(`📦 Audio chunk received: ${e.data.size} bytes`);
        }
      };
      
      mediaRecorder.onstop = async () => {
        debug.log(`⏹️ Recording stopped. Total chunks: ${audioChunksRef.current.length}`);
        
        if (audioChunksRef.current.length === 0) {
          debug.warn("⚠️ No audio chunks recorded");
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        debug.log(`🎵 Audio blob created: ${audioBlob.size} bytes`);
        
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        debug.log("📤 Sending audio to backend for transcription...");
        
        try {
          const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
            method: "POST",
            body: formData,
          });
          
          debug.log(`📡 Transcription API response: ${res.status}`);
          
          if (res.ok) {
            const data = await res.json();
            debug.log("✅ Transcription successful!");
            debug.log(`🎤 Detected language: ${data.language}`);
            debug.log(`📝 Transcribed text: "${data.text}"`);
            debug.log(`💾 Audio saved at: ${data.audio_path}`);
            
            setLastRecordingPath(data.audio_path);
            
            if (data.text) {
              setInput(data.text);
              debug.log("✍️ Input field populated with transcribed text");
              // Auto-send after short delay
              setTimeout(() => {
                if (data.text.trim()) {
                  debug.log("🚀 Auto-sending transcribed message");
                  sendMessage(data.text);
                }
              }, 500);
            } else {
              debug.warn("⚠️ No text in transcription response");
            }
          } else {
            const errorText = await res.text();
            debug.error(`❌ Transcription failed: ${res.status} - ${errorText}`);
          }
        } catch (err) {
          debug.error("Transcription request failed:", err);
        }
        
        // Clean up tracks
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            track.stop();
            debug.log("🔇 Audio track stopped");
          });
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      debug.log("🔴 Recording started (will collect chunks every 100ms)");
      
    } catch (err) {
      debug.error("Microphone error:", err);
      alert("Microphone access denied. Please allow mic permissions.");
    }
  };

  const stopRecording = () => {
    debug.log("⏹️ Stop recording requested");
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        debug.log("✅ MediaRecorder stopped");
      } else {
        debug.warn(`⚠️ MediaRecorder state is ${mediaRecorderRef.current.state}, not recording`);
      }
      setIsRecording(false);
    } else {
      debug.warn("⚠️ No active recording to stop");
    }
  };

  // Text to Speech
  const speakMessage = async (text) => {
    debug.log(`🔊 Text-to-Speech requested for text length: ${text.length}`);
    if (isSpeaking) {
      debug.warn("⚠️ Already speaking, skipping");
      return;
    }
    
    setIsSpeaking(true);
    debug.log("🔊 Sending TTS request to backend...");
    
    try {
      const res = await fetch(`${API_BASE}/api/voice/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      debug.log(`📡 TTS API response: ${res.status}`);
      
      if (!res.ok) {
        throw new Error(`TTS failed: ${res.status}`);
      }
      
      const audioBlob = await res.blob();
      debug.log(`🎵 Audio received: ${audioBlob.size} bytes`);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        debug.log("🔊 Audio playback finished");
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        debug.error("❌ Audio playback error");
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      debug.log("▶️ Playing audio...");
      audio.play();
      
    } catch (err) {
      debug.error("TTS failed:", err);
      setIsSpeaking(false);
    }
  };

  const colors = {
    bg: "#0a1a1a",
    bgSidebar: "rgba(8, 28, 28, 0.95)",
    bgInput: "rgba(20, 50, 50, 0.6)",
    bgHover: "rgba(30, 70, 65, 0.5)",
    accent: "#2dd4a8",
    accentDim: "rgba(45, 212, 168, 0.15)",
    blue: "#38bdf8",
    text: "#e2e8f0",
    textDim: "#94a3b8",
    textMuted: "#64748b",
    border: "rgba(45, 212, 168, 0.12)",
    glass: "rgba(16, 42, 42, 0.55)",
    userBubble: "linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))",
    aiBubble: "rgba(20, 45, 45, 0.6)",
  };

  const fontStack = "'Outfit', 'Poppins', system-ui, sans-serif";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: `radial-gradient(ellipse at 20% 50%, rgba(16, 80, 70, 0.4) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, rgba(20, 60, 90, 0.3) 0%, transparent 50%),
                     ${colors.bg}`,
        fontFamily: fontStack,
        color: colors.text,
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 280 : 0,
          minWidth: sidebarOpen ? 280 : 0,
          background: colors.bgSidebar,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          overflow: "hidden",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ⚖️
            </div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              Qanoon<span style={{ color: colors.accent }}>AI</span>
            </span>
          </div>
          <button
            onClick={startNewChat}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
              color: "#0a1a1a",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Session
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, padding: "8px 10px" }}>
            RECENT CHATS
          </div>
          {sessions.map((s) => (
            <div
              key={s.session_id}
              onClick={() => loadSession(s.session_id)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 2,
                background: activeSession === s.session_id ? colors.accentDim : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                  {s.title || "New Chat"}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>
                  {s.message_count || 0} messages
                </div>
              </div>
              <button
                onClick={(e) => deleteSession(s.session_id, e)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.textMuted,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textMuted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span>
            <span>For guidance only. Consult a licensed lawyer.</span>
          </div>
          {lastRecordingPath && (
            <div style={{ fontSize: 10, marginTop: 8, color: colors.accent, wordBreak: "break-all" }}>
              📁 Last recording: {lastRecordingPath.split(/[/\\]/).pop()}
            </div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Navbar */}
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            borderBottom: `1px solid ${colors.border}`,
            background: "rgba(10, 26, 26, 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              color: colors.textDim,
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ☰
          </button>
          <span style={{ fontSize: 14, color: colors.textDim, marginLeft: 12 }}>
            {activeSession ? "Legal Consultation" : "New Consultation"}
          </span>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={sendMessage} colors={colors} fontStack={fontStack} />
          ) : (
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} colors={colors} onSpeak={speakMessage} isSpeaking={isSpeaking} />
              ))}
              {loading && <TypingIndicator colors={colors} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar with Voice Button - Hold to Record */}
        <div style={{ padding: "16px 24px 24px" }}>
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: colors.bgInput,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: "4px 8px 4px 20px",
              backdropFilter: "blur(16px)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your legal concern here... (HOLD 🎙️ to speak)"
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: colors.text,
                fontSize: 14,
                fontFamily: fontStack,
                resize: "none",
                padding: "12px 0",
              }}
            />

            {/* 🎤 Voice Input Button - HOLD to Record */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to record voice"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isRecording ? "#ef4444" : colors.bgHover,
                border: `1px solid ${isRecording ? "#ef4444" : colors.border}`,
                color: isRecording ? "white" : colors.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                transition: "all 0.2s",
                animation: isRecording ? "pulse 1s infinite" : "none",
              }}
            >
              {isRecording ? "🔴" : "🎙️"}
            </button>

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: input.trim() ? `linear-gradient(135deg, ${colors.accent}, ${colors.blue})` : colors.bgHover,
                border: "none",
                color: input.trim() ? "#0a1a1a" : colors.textMuted,
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: colors.textMuted }}>
            QanoonAI provides legal guidance only. Always verify with official statutes.
            {isRecording && (
              <span style={{ color: "#ef4444", marginLeft: 10, animation: "blink 1s infinite" }}>
                🔴 Recording... Release to stop
              </span>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function WelcomeScreen({ onSuggestion, colors, fontStack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 24px" }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))`,
          border: `1px solid rgba(45, 212, 168, 0.12)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          marginBottom: 24,
        }}
      >
        ⚖️
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
        Tell Me What's On Your Mind
      </h1>
      <p style={{ fontSize: 15, color: colors.textDim, marginBottom: 36, textAlign: "center" }}>
        Describe your legal concern or pick a suggestion below.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 700, marginBottom: 32 }}>
        {CATEGORIES.slice(0, 4).map((cat) => (
          <div
            key={cat.name}
            onClick={() => onSuggestion("I need legal help regarding " + cat.name)}
            style={{
              width: 155,
              padding: "16px 14px",
              background: colors.glass,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              cursor: "pointer",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600, width: "100%" }}>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s)}
            style={{
              padding: "12px 16px",
              background: colors.bgInput,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              color: colors.textDim,
              cursor: "pointer",
              textAlign: "left",
              fontSize: 13,
              fontFamily: fontStack,
            }}
          >
            💡 {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, colors, onSpeak, isSpeaking }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      <div
        style={{
          maxWidth: "80%",
          padding: "14px 18px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? colors.userBubble : colors.aiBubble,
          border: `1px solid ${isUser ? "rgba(45,212,168,0.2)" : colors.border}`,
          fontSize: 14,
          lineHeight: 1.7,
          color: colors.text,
          backdropFilter: "blur(8px)",
        }}
      >
        {!isUser && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚖️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>QanoonAI</span>
            </div>
            <button
              onClick={() => onSpeak(msg.content)}
              title="Read aloud"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                opacity: isSpeaking ? 1 : 0.6,
                color: colors.accent,
              }}
            >
              🔊
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
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "16px 16px 16px 4px",
          background: colors.aiBubble,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>⚖️</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: colors.accent,
                opacity: 0.5,
                animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; } 40% { transform: scale(1.2); opacity: 1; } }`}</style>
      </div>
    </div>
  );
}