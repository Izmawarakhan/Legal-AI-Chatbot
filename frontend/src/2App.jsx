// import { useState, useRef, useEffect } from "react";

// const API_BASE = "http://localhost:8000";

// // ============================================
// // QanoonAI — Pakistan AI Legal Assistant
// // Dark Green/Blue Glassmorphism Theme
// // ============================================

// const CATEGORIES = [
//   { name: "Family Law", icon: "👨‍👩‍👧‍👦", desc: "Marriage, Divorce, Custody, Meher" },
//   { name: "Criminal Law", icon: "⚖️", desc: "FIR, Bail, Murder, Theft, Fraud" },
//   { name: "Labour Laws", icon: "👷", desc: "Employment, Wages, Termination" },
//   { name: "Land & Property Laws", icon: "🏠", desc: "Property Disputes, Transfer, Fraud" },
//   { name: "Islamic Religious Laws", icon: "☪️", desc: "Hudood, Waqf, Blasphemy" },
//   { name: "Excise Taxation Laws", icon: "💰", desc: "Income Tax, Sales Tax, FBR" },
//   { name: "Health & Medical Laws", icon: "🏥", desc: "Negligence, Hospital, Drug Cases" },
// ];

// const SUGGESTIONS = [
//   "I want to file for divorce. What are my legal rights?",
//   "Someone snatched my phone. How do I register an FIR?",
//   "My employer terminated me without notice. What can I do?",
//   "A hospital refused emergency treatment. Is this legal?",
// ];

// export default function QanoonAI() {
//   const [sessions, setSessions] = useState([]);
//   const [activeSession, setActiveSession] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const messagesEndRef = useRef(null);
//   const inputRef = useRef(null);

//   useEffect(() => {
//     fetchSessions();
//   }, []);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const fetchSessions = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/api/chat/sessions`);
//       if (res.ok) {
//         const data = await res.json();
//         setSessions(data);
//       }
//     } catch (e) {
//       console.error("Failed to fetch sessions:", e);
//     }
//   };

//   const loadSession = async (sessionId) => {
//     try {
//       const res = await fetch(`${API_BASE}/api/chat/history/${sessionId}`);
//       if (res.ok) {
//         const data = await res.json();
//         setActiveSession(sessionId);
//         setMessages(data.messages || []);
//       }
//     } catch (e) {
//       console.error("Failed to load session:", e);
//     }
//   };

//   const startNewChat = () => {
//     setActiveSession(null);
//     setMessages([]);
//     setInput("");
//     inputRef.current?.focus();
//   };

//   const sendMessage = async (text) => {
//     const msg = text || input.trim();
//     if (!msg || loading) return;

//     const userMsg = { role: "user", content: msg };
//     setMessages((prev) => [...prev, userMsg]);
//     setInput("");
//     setLoading(true);

//     try {
//       const res = await fetch(`${API_BASE}/api/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: msg,
//           session_id: activeSession,
//           religion: "Muslim",
//         }),
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setActiveSession(data.session_id);
//         setMessages((prev) => [
//           ...prev,
//           { role: "assistant", content: data.reply },
//         ]);
//         fetchSessions();
//       } else {
//         setMessages((prev) => [
//           ...prev,
//           { role: "assistant", content: "Sorry, something went wrong. Please try again." },
//         ]);
//       }
//     } catch (e) {
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: "Connection error. Please check if the API server is running." },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteSession = async (sessionId, e) => {
//     e.stopPropagation();
//     try {
//       await fetch(`${API_BASE}/api/chat/session/${sessionId}`, { method: "DELETE" });
//       if (activeSession === sessionId) startNewChat();
//       fetchSessions();
//     } catch (e) {
//       console.error("Failed to delete:", e);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   // ============================================
//   // STYLES
//   // ============================================
//   const colors = {
//     bg: "#0a1a1a",
//     bgCard: "rgba(16, 42, 42, 0.7)",
//     bgSidebar: "rgba(8, 28, 28, 0.95)",
//     bgInput: "rgba(20, 50, 50, 0.6)",
//     bgHover: "rgba(30, 70, 65, 0.5)",
//     accent: "#2dd4a8",
//     accentDim: "rgba(45, 212, 168, 0.15)",
//     accentGlow: "rgba(45, 212, 168, 0.3)",
//     blue: "#38bdf8",
//     blueDim: "rgba(56, 189, 248, 0.15)",
//     text: "#e2e8f0",
//     textDim: "#94a3b8",
//     textMuted: "#64748b",
//     border: "rgba(45, 212, 168, 0.12)",
//     borderLight: "rgba(255,255,255,0.06)",
//     glass: "rgba(16, 42, 42, 0.55)",
//     shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
//     userBubble: "linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))",
//     aiBubble: "rgba(20, 45, 45, 0.6)",
//   };

//   const fontStack = "'Outfit', 'Poppins', system-ui, sans-serif";

//   return (
//     <div
//       style={{
//         display: "flex",
//         height: "100vh",
//         width: "100vw",
//         background: `radial-gradient(ellipse at 20% 50%, rgba(16, 80, 70, 0.4) 0%, transparent 60%),
//                      radial-gradient(ellipse at 80% 20%, rgba(20, 60, 90, 0.3) 0%, transparent 50%),
//                      radial-gradient(ellipse at 50% 100%, rgba(10, 50, 50, 0.5) 0%, transparent 50%),
//                      ${colors.bg}`,
//         fontFamily: fontStack,
//         color: colors.text,
//         overflow: "hidden",
//       }}
//     >
//       <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

//       {/* ============ SIDEBAR ============ */}
//       <div
//         style={{
//           width: sidebarOpen ? 280 : 0,
//           minWidth: sidebarOpen ? 280 : 0,
//           background: colors.bgSidebar,
//           borderRight: `1px solid ${colors.border}`,
//           display: "flex",
//           flexDirection: "column",
//           transition: "all 0.3s ease",
//           overflow: "hidden",
//           backdropFilter: "blur(20px)",
//         }}
//       >
//         {/* Logo */}
//         <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${colors.border}` }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
//             <div
//               style={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: 10,
//                 background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 18,
//               }}
//             >
//               ⚖️
//             </div>
//             <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
//               Qanoon<span style={{ color: colors.accent }}>AI</span>
//             </span>
//           </div>

//           {/* New Session Button */}
//           <button
//             onClick={startNewChat}
//             style={{
//               width: "100%",
//               padding: "12px 16px",
//               background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
//               color: "#0a1a1a",
//               border: "none",
//               borderRadius: 10,
//               fontSize: 14,
//               fontWeight: 600,
//               cursor: "pointer",
//               fontFamily: fontStack,
//               transition: "all 0.2s",
//               letterSpacing: "0.3px",
//             }}
//             onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
//             onMouseLeave={(e) => (e.target.style.opacity = "1")}
//           >
//             + New Session
//           </button>
//         </div>

//         {/* Session List */}
//         <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
//           <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, padding: "8px 10px", textTransform: "uppercase", letterSpacing: "1px" }}>
//             Recent Chats
//           </div>
//           {sessions.map((s) => (
//             <div
//               key={s.session_id}
//               onClick={() => loadSession(s.session_id)}
//               style={{
//                 padding: "10px 12px",
//                 borderRadius: 8,
//                 cursor: "pointer",
//                 marginBottom: 2,
//                 background: activeSession === s.session_id ? colors.accentDim : "transparent",
//                 border: activeSession === s.session_id ? `1px solid ${colors.border}` : "1px solid transparent",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 transition: "all 0.15s",
//               }}
//               onMouseEnter={(e) => {
//                 if (activeSession !== s.session_id) e.currentTarget.style.background = colors.bgHover;
//               }}
//               onMouseLeave={(e) => {
//                 if (activeSession !== s.session_id) e.currentTarget.style.background = "transparent";
//               }}
//             >
//               <div style={{ overflow: "hidden" }}>
//                 <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", maxWidth: 180 }}>
//                   {s.title || "New Chat"}
//                 </div>
//                 <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
//                   {s.message_count || 0} messages
//                 </div>
//               </div>
//               <button
//                 onClick={(e) => deleteSession(s.session_id, e)}
//                 style={{
//                   background: "none",
//                   border: "none",
//                   color: colors.textMuted,
//                   cursor: "pointer",
//                   fontSize: 14,
//                   padding: "2px 6px",
//                   borderRadius: 4,
//                   opacity: 0.5,
//                   transition: "all 0.15s",
//                 }}
//                 onMouseEnter={(e) => { e.target.style.opacity = "1"; e.target.style.color = "#ef4444"; }}
//                 onMouseLeave={(e) => { e.target.style.opacity = "0.5"; e.target.style.color = colors.textMuted; }}
//               >
//                 ✕
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* Sidebar Footer */}
//         <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textMuted }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//             <span style={{ fontSize: 14 }}>⚠️</span>
//             <span>For guidance only. Consult a licensed lawyer.</span>
//           </div>
//         </div>
//       </div>

//       {/* ============ MAIN AREA ============ */}
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
//         {/* Top Navbar */}
//         <div
//           style={{
//             height: 56,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "0 24px",
//             borderBottom: `1px solid ${colors.border}`,
//             background: "rgba(10, 26, 26, 0.8)",
//             backdropFilter: "blur(12px)",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             <button
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               style={{
//                 background: "none",
//                 border: "none",
//                 color: colors.textDim,
//                 cursor: "pointer",
//                 fontSize: 20,
//                 padding: "4px 8px",
//               }}
//             >
//               ☰
//             </button>
//             <span style={{ fontSize: 14, color: colors.textDim, fontWeight: 500 }}>
//               {activeSession ? "Legal Consultation" : "New Consultation"}
//             </span>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//             <NavItem label="Categories" />
//             <NavItem label="Past Cases" />
//             <NavItem label="Find Lawyer" />
//             <button
//               style={{
//                 padding: "6px 16px",
//                 background: colors.accentDim,
//                 color: colors.accent,
//                 border: `1px solid ${colors.border}`,
//                 borderRadius: 8,
//                 fontSize: 13,
//                 fontWeight: 500,
//                 cursor: "pointer",
//                 fontFamily: fontStack,
//               }}
//             >
//               Login
//             </button>
//           </div>
//         </div>

//         {/* Chat Area */}
//         <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
//           {messages.length === 0 ? (
//             <WelcomeScreen onSuggestion={sendMessage} colors={colors} fontStack={fontStack} />
//           ) : (
//             <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
//               {messages.map((msg, i) => (
//                 <MessageBubble key={i} msg={msg} colors={colors} />
//               ))}
//               {loading && <TypingIndicator colors={colors} />}
//               <div ref={messagesEndRef} />
//             </div>
//           )}
//         </div>

//         {/* Input Bar */}
//         <div style={{ padding: "16px 24px 24px", background: "transparent" }}>
//           <div
//             style={{
//               maxWidth: 800,
//               margin: "0 auto",
//               display: "flex",
//               alignItems: "center",
//               gap: 12,
//               background: colors.bgInput,
//               border: `1px solid ${colors.border}`,
//               borderRadius: 14,
//               padding: "4px 8px 4px 20px",
//               backdropFilter: "blur(16px)",
//               boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 ${colors.borderLight}`,
//             }}
//           >
//             <button
//               style={{
//                 background: "none",
//                 border: "none",
//                 color: colors.textMuted,
//                 cursor: "pointer",
//                 fontSize: 18,
//                 padding: 4,
//               }}
//               title="Upload Document"
//             >
//               📎
//             </button>
//             <textarea
//               ref={inputRef}
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder="Describe your legal concern here..."
//               rows={1}
//               style={{
//                 flex: 1,
//                 background: "transparent",
//                 border: "none",
//                 outline: "none",
//                 color: colors.text,
//                 fontSize: 14,
//                 fontFamily: fontStack,
//                 resize: "none",
//                 padding: "12px 0",
//                 lineHeight: 1.5,
//               }}
//             />
//             <button
//               onClick={() => sendMessage()}
//               disabled={loading || !input.trim()}
//               style={{
//                 width: 40,
//                 height: 40,
//                 borderRadius: 10,
//                 background: input.trim()
//                   ? `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`
//                   : colors.bgHover,
//                 border: "none",
//                 color: input.trim() ? "#0a1a1a" : colors.textMuted,
//                 cursor: input.trim() ? "pointer" : "default",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 16,
//                 transition: "all 0.2s",
//               }}
//             >
//               {loading ? "⏳" : "➤"}
//             </button>
//           </div>
//           <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: colors.textMuted }}>
//             QanoonAI provides legal guidance only. Always verify with official statutes and licensed lawyers.
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ============================================
// // SUB-COMPONENTS
// // ============================================

// function NavItem({ label }) {
//   return (
//     <span
//       style={{
//         fontSize: 13,
//         color: "#94a3b8",
//         cursor: "pointer",
//         padding: "4px 8px",
//         borderRadius: 6,
//         transition: "all 0.15s",
//       }}
//       onMouseEnter={(e) => { e.target.style.color = "#e2e8f0"; e.target.style.background = "rgba(30,70,65,0.3)"; }}
//       onMouseLeave={(e) => { e.target.style.color = "#94a3b8"; e.target.style.background = "transparent"; }}
//     >
//       {label}
//     </span>
//   );
// }

// function WelcomeScreen({ onSuggestion, colors, fontStack }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 24px" }}>
//       {/* Animated Logo */}
//       <div
//         style={{
//           width: 80,
//           height: 80,
//           borderRadius: 20,
//           background: `linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))`,
//           border: `1px solid ${colors.border}`,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           fontSize: 40,
//           marginBottom: 24,
//           boxShadow: `0 0 40px ${colors.accentGlow}`,
//           animation: "pulse 3s ease-in-out infinite",
//         }}
//       >
//         ⚖️
//       </div>
//       <style>{`@keyframes pulse { 0%, 100% { box-shadow: 0 0 40px rgba(45,212,168,0.2); } 50% { box-shadow: 0 0 60px rgba(45,212,168,0.4); } }`}</style>

//       <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, textAlign: "center", letterSpacing: "-0.5px" }}>
//         Tell Me What's On Your Mind
//       </h1>
//       <p style={{ fontSize: 15, color: colors.textDim, marginBottom: 36, textAlign: "center" }}>
//         Describe your legal concern or pick a suggestion below.
//       </p>

//       {/* Category Cards */}
//       <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 700, marginBottom: 32 }}>
//         {CATEGORIES.slice(0, 4).map((cat) => (
//           <div
//             key={cat.name}
//             onClick={() => onSuggestion("I need legal help regarding " + cat.name)}
//             style={{
//               width: 155,
//               padding: "16px 14px",
//               background: colors.glass,
//               border: `1px solid ${colors.border}`,
//               borderRadius: 12,
//               cursor: "pointer",
//               backdropFilter: "blur(12px)",
//               transition: "all 0.2s",
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.borderColor = colors.accent;
//               e.currentTarget.style.transform = "translateY(-2px)";
//               e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.borderColor = colors.border;
//               e.currentTarget.style.transform = "translateY(0)";
//               e.currentTarget.style.boxShadow = "none";
//             }}
//           >
//             <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
//             <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{cat.name}</div>
//             <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{cat.desc}</div>
//           </div>
//         ))}
//       </div>

//       {/* Suggestion Pills */}
//       <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600, width: "100%" }}>
//         {SUGGESTIONS.map((s, i) => (
//           <button
//             key={i}
//             onClick={() => onSuggestion(s)}
//             style={{
//               padding: "12px 16px",
//               background: colors.bgInput,
//               border: `1px solid ${colors.border}`,
//               borderRadius: 10,
//               color: colors.textDim,
//               cursor: "pointer",
//               textAlign: "left",
//               fontSize: 13,
//               fontFamily: fontStack,
//               transition: "all 0.15s",
//             }}
//             onMouseEnter={(e) => {
//               e.target.style.borderColor = colors.accent;
//               e.target.style.color = colors.text;
//               e.target.style.background = colors.accentDim;
//             }}
//             onMouseLeave={(e) => {
//               e.target.style.borderColor = colors.border;
//               e.target.style.color = colors.textDim;
//               e.target.style.background = colors.bgInput;
//             }}
//           >
//             💡 {s}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// function MessageBubble({ msg, colors }) {
//   const isUser = msg.role === "user";
//   return (
//     <div
//       style={{
//         display: "flex",
//         justifyContent: isUser ? "flex-end" : "flex-start",
//         marginBottom: 16,
//       }}
//     >
//       <div
//         style={{
//           maxWidth: "80%",
//           padding: "14px 18px",
//           borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
//           background: isUser ? colors.userBubble : colors.aiBubble,
//           border: `1px solid ${isUser ? "rgba(45,212,168,0.2)" : colors.border}`,
//           fontSize: 14,
//           lineHeight: 1.7,
//           color: colors.text,
//           backdropFilter: "blur(8px)",
//           whiteSpace: "pre-wrap",
//         }}
//       >
//         {!isUser && (
//           <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
//             <span style={{ fontSize: 14 }}>⚖️</span>
//             <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>QanoonAI</span>
//           </div>
//         )}
//         {msg.content}
//       </div>
//     </div>
//   );
// }

// function TypingIndicator({ colors }) {
//   return (
//     <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
//       <div
//         style={{
//           padding: "14px 18px",
//           borderRadius: "16px 16px 16px 4px",
//           background: colors.aiBubble,
//           border: `1px solid ${colors.border}`,
//           display: "flex",
//           alignItems: "center",
//           gap: 6,
//         }}
//       >
//         <span style={{ fontSize: 14 }}>⚖️</span>
//         <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
//           {[0, 1, 2].map((i) => (
//             <div
//               key={i}
//               style={{
//                 width: 7,
//                 height: 7,
//                 borderRadius: "50%",
//                 background: colors.accent,
//                 opacity: 0.5,
//                 animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
//               }}
//             />
//           ))}
//         </div>
//         <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; } 40% { transform: scale(1.2); opacity: 1; } }`}</style>
//       </div>
//     </div>
//   );
// }

// // Add these state vars inside QanoonAI()
// const [isRecording, setIsRecording] = useState(false);
// const [isSpeaking, setIsSpeaking] = useState(false);
// const mediaRecorderRef = useRef(null);
// const audioChunksRef = useRef([]);

// // --- Voice Recording Handler ---
// const startRecording = async () => {
//   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//   const mediaRecorder = new MediaRecorder(stream);
//   mediaRecorderRef.current = mediaRecorder;
//   audioChunksRef.current = [];

//   mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
//   mediaRecorder.onstop = async () => {
//     const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
//     const formData = new FormData();
//     formData.append("file", audioBlob, "recording.wav");

//     const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
//       method: "POST", body: formData,
//     });
//     const data = await res.json();
//     if (data.text) sendMessage(data.text); // Auto-send transcribed text
//   };

//   mediaRecorder.start();
//   setIsRecording(true);
// };

// const stopRecording = () => {
//   mediaRecorderRef.current?.stop();
//   setIsRecording(false);
// };

// // --- Text-to-Speech for AI replies ---
// const speakMessage = async (text) => {
//   setIsSpeaking(true);
//   const res = await fetch(`${API_BASE}/api/voice/synthesize`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ text }),
//   });
//   const audioBlob = await res.blob();
//   const audioUrl = URL.createObjectURL(audioBlob);
//   const audio = new Audio(audioUrl);
//   audio.onended = () => setIsSpeaking(false);
//   audio.play();
// };

// {/* Mic Button */}
// <button
//   onMouseDown={startRecording}
//   onMouseUp={stopRecording}
//   style={{
//     width: 40, height: 40, borderRadius: 10,
//     background: isRecording ? "rgba(255,80,80,0.3)" : colors.bgHover,
//     border: `1px solid ${isRecording ? "red" : colors.border}`,
//     color: isRecording ? "red" : colors.textMuted,
//     cursor: "pointer", fontSize: 16,
//     display: "flex", alignItems: "center", justifyContent: "center",
//   }}
// >
//   {isRecording ? "🔴" : "🎙️"}
// </button>

import { useState, useRef, useEffect } from "react";

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

export default function QanoonAI() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ✅ Voice state — properly inside the component
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
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
    inputRef.current?.focus();
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        fetchSessions();
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please check if the API server is running." },
      ]);
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

  // ✅ Voice handlers — properly inside the component
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");
        try {
          const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.text) sendMessage(data.text);
        } catch (err) {
          console.error("Transcription failed:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow mic permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const speakMessage = async (text) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const res = await fetch(`${API_BASE}/api/voice/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (err) {
      console.error("TTS failed:", err);
      setIsSpeaking(false);
    }
  };

  // ============================================
  // STYLES
  // ============================================
  const colors = {
    bg: "#0a1a1a",
    bgCard: "rgba(16, 42, 42, 0.7)",
    bgSidebar: "rgba(8, 28, 28, 0.95)",
    bgInput: "rgba(20, 50, 50, 0.6)",
    bgHover: "rgba(30, 70, 65, 0.5)",
    accent: "#2dd4a8",
    accentDim: "rgba(45, 212, 168, 0.15)",
    accentGlow: "rgba(45, 212, 168, 0.3)",
    blue: "#38bdf8",
    blueDim: "rgba(56, 189, 248, 0.15)",
    text: "#e2e8f0",
    textDim: "#94a3b8",
    textMuted: "#64748b",
    border: "rgba(45, 212, 168, 0.12)",
    borderLight: "rgba(255,255,255,0.06)",
    glass: "rgba(16, 42, 42, 0.55)",
    shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
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
                     radial-gradient(ellipse at 50% 100%, rgba(10, 50, 50, 0.5) 0%, transparent 50%),
                     ${colors.bg}`,
        fontFamily: fontStack,
        color: colors.text,
        overflow: "hidden",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ============ SIDEBAR ============ */}
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
        {/* Logo */}
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
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Qanoon<span style={{ color: colors.accent }}>AI</span>
            </span>
          </div>

          {/* New Session Button */}
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
              fontFamily: fontStack,
              transition: "all 0.2s",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            + New Session
          </button>
        </div>

        {/* Session List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, padding: "8px 10px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Recent Chats
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
                border: activeSession === s.session_id ? `1px solid ${colors.border}` : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (activeSession !== s.session_id) e.currentTarget.style.background = colors.bgHover;
              }}
              onMouseLeave={(e) => {
                if (activeSession !== s.session_id) e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", maxWidth: 180 }}>
                  {s.title || "New Chat"}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
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
                  padding: "2px 6px",
                  borderRadius: 4,
                  opacity: 0.5,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.target.style.opacity = "1"; e.target.style.color = "#ef4444"; }}
                onMouseLeave={(e) => { e.target.style.opacity = "0.5"; e.target.style.color = colors.textMuted; }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textMuted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span>For guidance only. Consult a licensed lawyer.</span>
          </div>
        </div>
      </div>

      {/* ============ MAIN AREA ============ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Navbar */}
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: `1px solid ${colors.border}`,
            background: "rgba(10, 26, 26, 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                color: colors.textDim,
                cursor: "pointer",
                fontSize: 20,
                padding: "4px 8px",
              }}
            >
              ☰
            </button>
            <span style={{ fontSize: 14, color: colors.textDim, fontWeight: 500 }}>
              {activeSession ? "Legal Consultation" : "New Consultation"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NavItem label="Categories" />
            <NavItem label="Past Cases" />
            <NavItem label="Find Lawyer" />
            <button
              style={{
                padding: "6px 16px",
                background: colors.accentDim,
                color: colors.accent,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: fontStack,
              }}
            >
              Login
            </button>
          </div>
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

        {/* Input Bar */}
        <div style={{ padding: "16px 24px 24px", background: "transparent" }}>
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
              boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 ${colors.borderLight}`,
            }}
          >
            <button
              style={{
                background: "none",
                border: "none",
                color: colors.textMuted,
                cursor: "pointer",
                fontSize: 18,
                padding: 4,
              }}
              title="Upload Document"
            >
              📎
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your legal concern here..."
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
                lineHeight: 1.5,
              }}
            />

            {/* ✅ Mic Button — hold to record */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to speak"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isRecording ? "rgba(255,80,80,0.25)" : colors.bgHover,
                border: `1px solid ${isRecording ? "#ef4444" : colors.border}`,
                color: isRecording ? "#ef4444" : colors.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 0.2s",
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
                background: input.trim()
                  ? `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`
                  : colors.bgHover,
                border: "none",
                color: input.trim() ? "#0a1a1a" : colors.textMuted,
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: colors.textMuted }}>
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
    <span
      style={{
        fontSize: 13,
        color: "#94a3b8",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: 6,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.target.style.color = "#e2e8f0"; e.target.style.background = "rgba(30,70,65,0.3)"; }}
      onMouseLeave={(e) => { e.target.style.color = "#94a3b8"; e.target.style.background = "transparent"; }}
    >
      {label}
    </span>
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
          boxShadow: `0 0 40px rgba(45, 212, 168, 0.3)`,
          animation: "pulse 3s ease-in-out infinite",
        }}
      >
        ⚖️
      </div>
      <style>{`@keyframes pulse { 0%, 100% { box-shadow: 0 0 40px rgba(45,212,168,0.2); } 50% { box-shadow: 0 0 60px rgba(45,212,168,0.4); } }`}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, textAlign: "center", letterSpacing: "-0.5px" }}>
        Tell Me What's On Your Mind
      </h1>
      <p style={{ fontSize: 15, color: colors.textDim, marginBottom: 36, textAlign: "center" }}>
        Describe your legal concern or pick a suggestion below.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 700, marginBottom: 32 }}>
        {[
          { name: "Family Law", icon: "👨‍👩‍👧‍👦", desc: "Marriage, Divorce, Custody, Meher" },
          { name: "Criminal Law", icon: "⚖️", desc: "FIR, Bail, Murder, Theft, Fraud" },
          { name: "Labour Laws", icon: "👷", desc: "Employment, Wages, Termination" },
          { name: "Land & Property Laws", icon: "🏠", desc: "Property Disputes, Transfer, Fraud" },
        ].map((cat) => (
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
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600, width: "100%" }}>
        {[
          "I want to file for divorce. What are my legal rights?",
          "Someone snatched my phone. How do I register an FIR?",
          "My employer terminated me without notice. What can I do?",
          "A hospital refused emergency treatment. Is this legal?",
        ].map((s, i) => (
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
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = colors.accent;
              e.target.style.color = colors.text;
              e.target.style.background = colors.accentDim;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.color = colors.textDim;
              e.target.style.background = colors.bgInput;
            }}
          >
            💡 {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ✅ MessageBubble now accepts onSpeak and isSpeaking props
function MessageBubble({ msg, colors, onSpeak, isSpeaking }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
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
          whiteSpace: "pre-wrap",
        }}
      >
        {!isUser && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>⚖️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>QanoonAI</span>
            </div>
            {/* ✅ Speak button on AI messages */}
            <button
              onClick={() => onSpeak(msg.content)}
              title="Read aloud"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                opacity: isSpeaking ? 1 : 0.5,
                color: colors.accent,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "1")}
              onMouseLeave={(e) => (e.target.style.opacity = isSpeaking ? "1" : "0.5")}
            >
              {isSpeaking ? "🔊" : "🔈"}
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
        <span style={{ fontSize: 14 }}>⚖️</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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