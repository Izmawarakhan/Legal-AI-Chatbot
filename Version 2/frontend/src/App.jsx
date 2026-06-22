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

// ============================================
// STT LANGUAGE OPTIONS
// ============================================
const STT_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "ur-PK", label: "Urdu (اردو)" },
  { code: "en-PK", label: "English (PK)" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
];

// ============================================
// VOICE HOOK — Fixed STT + TTS
// STT: continuous mode, auto-restart, Urdu support
// TTS: chunked for long text, Urdu voice priority
// ============================================
function useVoice() {
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
  const shouldRestartRef = useRef(false);    // controls auto-restart
  const silenceTimerRef = useRef(null);      // auto-send after silence
  const speakQueueRef = useRef([]);          // TTS chunk queue
  const speakingIdxRef = useRef(0);

  // --- Initialize Speech Recognition (STT) ---
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }
    setSttSupported(true);

    const recognition = new SR();
    recognition.continuous = true;          // ✅ FIX: keep mic open
    recognition.interimResults = true;
    recognition.lang = sttLang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setIsListening(true);
      setTranscript("🎤 Listening...");
      finalTranscriptRef.current = "";
    };

    recognition.onresult = (e) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += t;
        } else {
          interim += t;
        }
      }
      if (finalText) finalTranscriptRef.current += finalText;
      setTranscript(finalTranscriptRef.current || interim || "🎤 Listening...");

      // ✅ FIX: Reset silence timer on every new speech input
      // After 2.5 seconds of silence, auto-send the message
      clearTimeout(silenceTimerRef.current);
      if (finalTranscriptRef.current.trim()) {
        silenceTimerRef.current = setTimeout(() => {
          // User stopped talking for 2.5s — send it
          const text = finalTranscriptRef.current.trim();
          if (text && shouldRestartRef.current) {
            shouldRestartRef.current = false;
            try { recognition.stop(); } catch (_) { }
            if (onResultCallbackRef.current) {
              onResultCallbackRef.current(text);
            }
          }
        }, 2500);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);

      // ✅ FIX: Auto-restart if user hasn't manually stopped
      // Chrome kills continuous recognition after ~60s of silence
      if (shouldRestartRef.current) {
        const text = finalTranscriptRef.current.trim();
        if (text) {
          // There's text — send it
          if (onResultCallbackRef.current) {
            onResultCallbackRef.current(text);
          }
          shouldRestartRef.current = false;
        } else {
          // No text yet — restart mic automatically
          try {
            setTimeout(() => {
              if (shouldRestartRef.current) {
                recognition.start();
              }
            }, 100);
          } catch (_) { }
        }
      }
    };

    recognition.onerror = (e) => {
      clearTimeout(silenceTimerRef.current);
      if (e.error === "no-speech") {
        // ✅ FIX: Don't stop on no-speech, auto-restart instead
        if (shouldRestartRef.current) {
          try {
            setTimeout(() => {
              if (shouldRestartRef.current) recognition.start();
            }, 100);
          } catch (_) { }
        }
        return;
      }
      if (e.error === "aborted") return; // normal stop
      console.error("Speech recognition error:", e.error);
      setTranscript(`Error: ${e.error}`);
      setIsRecording(false);
      setIsListening(false);
      shouldRestartRef.current = false;
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      shouldRestartRef.current = false;
      clearTimeout(silenceTimerRef.current);
      try { recognition.stop(); } catch (_) { }
    };
  }, [sttLang]); // ✅ Re-create when language changes

  // --- Initialize TTS voices ---
  useEffect(() => {
    if (!window.speechSynthesis) return;
    setTtsSupported(true);

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // ✅ FIX: Prioritize FEMALE voices
      // Helper: check if voice name suggests female
      const isFemale = (v) => {
        const n = v.name.toLowerCase();
        return n.includes("female") || n.includes("zira") || n.includes("heera") ||
          n.includes("woman") || n.includes("girl") || n.includes("fiona") ||
          n.includes("samantha") || n.includes("victoria") || n.includes("karen") ||
          n.includes("moira") || n.includes("tessa") || n.includes("veena") ||
          n.includes("lekha") || n.includes("raveena") || n.includes("aditi");
      };

      // 1st: Urdu female voice
      const urduFemaleIdx = availableVoices.findIndex(
        (v) => (v.lang.startsWith("ur") || v.lang === "ur-PK") && isFemale(v)
      );
      if (urduFemaleIdx !== -1) { setSelectedVoiceIndex(urduFemaleIdx); return; }

      // 2nd: Any Urdu voice
      const urduIdx = availableVoices.findIndex(
        (v) => v.lang.startsWith("ur") || v.lang === "ur-PK"
      );
      if (urduIdx !== -1) { setSelectedVoiceIndex(urduIdx); return; }

      // 3rd: Hindi female voice (can read Roman Urdu)
      const hindiFemaleIdx = availableVoices.findIndex(
        (v) => v.lang.startsWith("hi") && isFemale(v)
      );
      if (hindiFemaleIdx !== -1) { setSelectedVoiceIndex(hindiFemaleIdx); return; }

      // 4th: Any Hindi voice
      const hindiIdx = availableVoices.findIndex(
        (v) => v.lang.startsWith("hi")
      );
      if (hindiIdx !== -1) { setSelectedVoiceIndex(hindiIdx); return; }

      // 5th: English female voice
      const enFemaleIdx = availableVoices.findIndex(
        (v) => v.lang.startsWith("en") && isFemale(v)
      );
      if (enFemaleIdx !== -1) { setSelectedVoiceIndex(enFemaleIdx); return; }

      // 6th: Any English voice
      const enIdx = availableVoices.findIndex((v) => v.lang.startsWith("en"));
      if (enIdx !== -1) setSelectedVoiceIndex(enIdx);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // --- Toggle mic on/off ---
  const toggleMic = useCallback(
    (onResult) => {
      if (!recognitionRef.current) return;

      // If TTS is playing, stop it first
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        speakQueueRef.current = [];
        setIsSpeaking(false);
      }

      if (!isRecording) {
        // START recording
        onResultCallbackRef.current = onResult;
        finalTranscriptRef.current = "";
        shouldRestartRef.current = true;
        setTranscript("🎤 Listening...");
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started — stop and restart
          try { recognitionRef.current.stop(); } catch (_) { }
          setTimeout(() => {
            try { recognitionRef.current.start(); } catch (_) { }
          }, 150);
        }
      } else {
        // STOP recording — send whatever we have
        shouldRestartRef.current = false;
        clearTimeout(silenceTimerRef.current);
        try { recognitionRef.current.stop(); } catch (_) { }
        const text = finalTranscriptRef.current.trim();
        if (text && onResultCallbackRef.current) {
          onResultCallbackRef.current(text);
        }
        setIsRecording(false);
        setIsListening(false);
      }
    },
    [isRecording, isSpeaking]
  );

  // ============================================
  // TTS — Chunked Speaking (fixes long text cutoff)
  // ============================================
  // Browser SpeechSynthesis has a ~200-300 char limit per utterance
  // on some browsers. We split into sentences and speak one by one.

  const splitIntoChunks = (text) => {
    // Split by sentence-ending punctuation, keep chunks under 180 chars
    const raw = text.match(/[^.!?۔؟\n]+[.!?۔؟\n]?/g) || [text];
    const chunks = [];
    let current = "";

    for (const piece of raw) {
      if ((current + piece).length > 180) {
        if (current.trim()) chunks.push(current.trim());
        current = piece;
      } else {
        current += piece;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  const speakNextChunk = useCallback(() => {
    const queue = speakQueueRef.current;
    const idx = speakingIdxRef.current;

    if (idx >= queue.length) {
      // All chunks done
      setIsSpeaking(false);
      speakQueueRef.current = [];
      speakingIdxRef.current = 0;
      return;
    }

    const chunk = queue[idx];
    const utterance = new SpeechSynthesisUtterance(chunk);

    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }

    // ✅ FIX: Detect if text is Urdu/Roman-Urdu and adjust rate
    const hasUrduChars = /[\u0600-\u06FF]/.test(chunk);
    utterance.rate = hasUrduChars ? 0.9 : 1.0; // Urdu reads better slower
    utterance.pitch = 1;

    utterance.onend = () => {
      speakingIdxRef.current += 1;
      // ✅ FIX: Chrome pauses after ~15s — use setTimeout to chain
      setTimeout(() => speakNextChunk(), 50);
    };

    utterance.onerror = (e) => {
      console.error("TTS chunk error:", e);
      speakingIdxRef.current += 1;
      setTimeout(() => speakNextChunk(), 50);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoiceIndex]);

  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis || !text) return;

      // Cancel any current speech
      window.speechSynthesis.cancel();

      // ✅ FIX: Preprocess text for TTS — fix abbreviations and legal terms
      let processed = text;

      // Legal abbreviations — add dots so TTS spells them out
      const abbreviations = [
        "FIR", "PPC", "IPC", "CrPC", "CRPC", "NTN", "STRN", "FBR", "PMDC",
        "SHO", "DSP", "DIG", "IGP", "SSP", "ASI", "SI", "IO", "PP",
        "NAB", "FIA", "NRO", "PIL", "SCP", "LHC", "IHC", "PHC", "SHC",
        "NADRA", "CNIC", "NIC", "DNA", "OPD", "ICU",
      ];
      abbreviations.forEach((abbr) => {
        // Replace whole-word matches only
        const regex = new RegExp(`\\b${abbr}\\b`, "g");
        const spelled = abbr.split("").join(".");
        processed = processed.replace(regex, spelled + ".");
      });

      // Section numbers — "Section 302" → "Section three oh two"
      // Keep as-is, TTS handles numbers reasonably

      // ✅ FIX: Split long text into chunks
      const chunks = splitIntoChunks(processed);
      speakQueueRef.current = chunks;
      speakingIdxRef.current = 0;
      setIsSpeaking(true);

      // ✅ FIX: Chrome has a bug where speechSynthesis pauses after ~15s
      // Workaround: periodically call resume()
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);

      speakNextChunk();
    },
    [speakNextChunk]
  );

  // --- Stop speaking ---
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      speakQueueRef.current = [];
      speakingIdxRef.current = 0;
      setIsSpeaking(false);
    }
  }, []);

  return {
    isRecording,
    isSpeaking,
    transcript,
    isListening,
    voices,
    selectedVoiceIndex,
    setSelectedVoiceIndex,
    sttSupported,
    ttsSupported,
    sttLang,
    setSttLang,
    toggleMic,
    speak,
    stopSpeaking,
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function QanoonAI() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{file, name, type, size, preview, extractedText, status}]
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Voice hook
  const voice = useVoice();

  // Track if current message was sent via voice (mic)
  const voiceTriggeredRef = useRef(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ FIX: Auto-speak AI response ONLY when message was sent via mic
  // Works regardless of whether voice panel is open or closed
  const lastMessageRef = useRef(null);
  useEffect(() => {
    if (!voice.ttsSupported) return;
    if (!voiceTriggeredRef.current) return; // only auto-speak for voice-sent messages
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.content !== lastMessageRef.current) {
      lastMessageRef.current = lastMsg.content;
      voiceTriggeredRef.current = false; // reset flag
      // Small delay to let UI render first
      setTimeout(() => voice.speak(lastMsg.content), 400);
    }
  }, [messages, voice]);

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
    clearAllFiles();
    lastMessageRef.current = null;
    inputRef.current?.focus();
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    const hasFiles = uploadedFiles.length > 0;

    // Need either text or files
    if (!msg && !hasFiles) return;
    if (loading) return;

    // ✅ Don't send if files are still uploading
    const stillUploading = uploadedFiles.some((f) => f.status === "uploading");
    if (stillUploading) return;

    // If only files, no text — auto-generate a message
    const effectiveMsg = msg || "I have uploaded a document. Please read it carefully and tell me what this document contains and what legal matters it covers.";

    // Build display message (what user sees in chat)
    const fileNames = uploadedFiles.map((f) => f.name);
    const imagePreviews = uploadedFiles
      .filter((f) => f.preview)
      .map((f) => ({ name: f.name, preview: f.preview }));

    const displayContent = hasFiles
      ? `${effectiveMsg}\n\n📎 Attached: ${fileNames.join(", ")}`
      : effectiveMsg;

    const userMsg = {
      role: "user",
      content: displayContent,
      images: imagePreviews.length > 0 ? imagePreviews : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Stop any ongoing TTS when user sends a new message
    voice.stopSpeaking();

    // Build the actual message with document context for AI
    const docContext = buildDocumentContext();
    const messageForAI = docContext ? `${effectiveMsg}${docContext}` : effectiveMsg;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageForAI,
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
        // Clear files after sending (they've been included in context)
        clearAllFiles();
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

  // Handle mic toggle — sends transcribed text automatically
  // Sets voiceTriggered flag so AI response will auto-speak
  const handleMicToggle = () => {
    voice.toggleMic((transcribedText) => {
      if (transcribedText) {
        voiceTriggeredRef.current = true; // ✅ mark as voice-sent
        sendMessage(transcribedText);
      }
    });
  };

  // ============================================
  // FILE UPLOAD HANDLERS
  // ============================================

  // Process files — shared by file picker, paste, and drag-drop
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    for (const file of files) {
      const fileObj = {
        id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        file,
        name: file.name || `pasted-image-${Date.now()}.png`,
        type: file.type,
        size: file.size,
        preview: null,
        extractedText: null,
        status: "uploading",
      };

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        fileObj.preview = URL.createObjectURL(file);
      }

      setUploadedFiles((prev) => [...prev, fileObj]);

      // Determine file category
      const isDocument =
        file.type === "application/pdf" ||
        file.type === "text/plain" ||
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        (file.name && /\.(pdf|txt|doc|docx)$/i.test(file.name));

      const isImage = file.type.startsWith("image/") ||
        (file.name && /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(file.name));

      // Upload to backend — documents get text extracted, images get AI vision analysis
      if (isDocument || isImage) {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append("file", file);

          if (isImage) {
            // ✅ Send image to Groq Vision API for actual analysis
            const res = await fetch(`${API_BASE}/api/chat/analyze-image`, {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              // Vision API returns a description of the image
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileObj.id
                    ? {
                      ...f,
                      extractedText: `[IMAGE ANALYSIS of ${fileObj.name}]:\n${data.description}`,
                      status: "ready",
                    }
                    : f
                )
              );
            } else {
              // Vision API failed — still mark ready with basic info
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileObj.id
                    ? { ...f, status: "ready", extractedText: `[Image: ${fileObj.name} — uploaded as evidence. Vision analysis unavailable.]` }
                    : f
                )
              );
            }
          } else {
            // Documents: extract text via /api/chat/upload
            const res = await fetch(`${API_BASE}/api/chat/upload`, {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileObj.id
                    ? { ...f, extractedText: data.extracted_text, status: "ready" }
                    : f
                )
              );
            } else {
              const err = await res.json().catch(() => ({ detail: "Upload failed" }));
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileObj.id ? { ...f, status: "error", extractedText: err.detail } : f
                )
              );
            }
          }
        } catch (err) {
          // Network error
          if (isImage) {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === fileObj.id
                  ? { ...f, status: "ready", extractedText: `[Image: ${fileObj.name} — uploaded as evidence]` }
                  : f
              )
            );
          } else {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === fileObj.id ? { ...f, status: "error", extractedText: String(err) } : f
              )
            );
          }
        } finally {
          setUploading(false);
        }
      } else {
        // Unknown file type
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "ready" } : f
          )
        );
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ CLIPBOARD PASTE — Ctrl+V / Cmd+V image paste
  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData || !clipboardData.items) return;

    const imageFiles = [];
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Prevent pasting image as text
        const file = item.getAsFile();
        if (file) {
          // Give pasted images a meaningful name
          const ext = file.type.split("/")[1] || "png";
          const namedFile = new File(
            [file],
            `evidence-screenshot-${Date.now()}.${ext}`,
            { type: file.type }
          );
          imageFiles.push(namedFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      await processFiles(imageFiles);
    }
  };

  // ✅ DRAG & DROP — drag files into chat area
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => {
      const removed = prev.find((f) => f.id === fileId);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const clearAllFiles = () => {
    // Don't revoke preview URLs — they may be displayed in sent messages
    setUploadedFiles([]);
  };

  // Build document context string from uploaded files
  const buildDocumentContext = () => {
    if (uploadedFiles.length === 0) return "";

    let context = "\n\n============================================\n";
    context += "UPLOADED DOCUMENTS (User has shared these files with you)\n";
    context += "IMPORTANT: Read the document content below carefully and use it in your response.\n";
    context += "============================================\n";

    uploadedFiles.forEach((f, i) => {
      if (f.extractedText && f.status === "ready") {
        // Check if extracted text is meaningful (not just metadata)
        const isSubstantial = f.extractedText.length > 100 && !f.extractedText.startsWith("[");
        if (isSubstantial) {
          context += `\n--- Document ${i + 1}: ${f.name} ---\n`;
          context += `${f.extractedText.slice(0, 2500)}\n`;
          context += `--- End of ${f.name} ---\n`;
        } else {
          // Metadata-only (image, failed extraction, etc.)
          context += `\n[File ${i + 1}: ${f.name}] ${f.extractedText}\n`;
        }
      } else if (f.type && f.type.startsWith("image/")) {
        context += `\n[Image ${i + 1}: ${f.name}] User uploaded an image as evidence/proof. You cannot view images. Ask the user to describe what is shown in the image if it is relevant to the case.\n`;
      } else if (f.status === "error") {
        context += `\n[File ${i + 1}: ${f.name}] This file could not be processed. Ask the user to try uploading in PDF or DOCX format.\n`;
      } else {
        context += `\n[File ${i + 1}: ${f.name}] File type: ${f.type || "unknown"}\n`;
      }
    });
    context += "\n============================================\n";
    return context;
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
    danger: "#ef4444",
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

      {/* Mic pulse animation */}
      <style>{`
        @keyframes micPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { transform: scale(1.08); box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.25); }
        }
        @keyframes micRipple {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>

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
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}
            >
              ⚖️
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Qanoon<span style={{ color: colors.accent }}>AI</span>
            </span>
          </div>

          <button
            onClick={startNewChat}
            style={{
              width: "100%", padding: "12px 16px",
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`,
              color: "#0a1a1a", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: fontStack,
              transition: "all 0.2s", letterSpacing: "0.3px",
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
                padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: activeSession === s.session_id ? colors.accentDim : "transparent",
                border: activeSession === s.session_id ? `1px solid ${colors.border}` : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (activeSession !== s.session_id) e.currentTarget.style.background = colors.bgHover; }}
              onMouseLeave={(e) => { if (activeSession !== s.session_id) e.currentTarget.style.background = "transparent"; }}
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
                  background: "none", border: "none", color: colors.textMuted, cursor: "pointer",
                  fontSize: 14, padding: "2px 6px", borderRadius: 4, opacity: 0.5, transition: "all 0.15s",
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
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 50,
              background: "rgba(45, 212, 168, 0.08)",
              border: "3px dashed rgba(45, 212, 168, 0.5)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{
              textAlign: "center", padding: "40px",
              background: "rgba(10, 26, 26, 0.9)", borderRadius: 16,
              border: `1px solid rgba(45, 212, 168, 0.3)`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📎</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.accent }}>
                Drop files here
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>
                PDF, DOCX, Images (PNG, JPG)
              </div>
            </div>
          </div>
        )}
        {/* Top Navbar */}
        <div
          style={{
            height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 24px", borderBottom: `1px solid ${colors.border}`,
            background: "rgba(10, 26, 26, 0.8)", backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", color: colors.textDim, cursor: "pointer", fontSize: 20, padding: "4px 8px" }}
            >
              ☰
            </button>
            <span style={{ fontSize: 14, color: colors.textDim, fontWeight: 500 }}>
              {activeSession ? "Legal Consultation" : "New Consultation"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NavItem label="Categories" />
            <NavItem label="Past Cases" />
            <NavItem label="Find Lawyer" />

            {/* Voice Mode Toggle */}
            {voice.sttSupported && (
              <button
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                title={showVoicePanel ? "Hide voice controls" : "Show voice controls"}
                style={{
                  padding: "6px 14px", display: "flex", alignItems: "center", gap: 6,
                  background: showVoicePanel ? colors.accentDim : "transparent",
                  color: showVoicePanel ? colors.accent : colors.textDim,
                  border: `1px solid ${showVoicePanel ? colors.accent : colors.border}`,
                  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: fontStack,
                  transition: "all 0.2s",
                }}
              >
                🎙️ Voice
              </button>
            )}

            <button
              style={{
                padding: "6px 16px", background: colors.accentDim, color: colors.accent,
                border: `1px solid ${colors.border}`, borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: fontStack,
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
                <MessageBubble
                  key={i}
                  msg={msg}
                  colors={colors}
                  onSpeak={voice.speak}
                  onStopSpeak={voice.stopSpeaking}
                  isSpeaking={voice.isSpeaking}
                  ttsSupported={voice.ttsSupported}
                />
              ))}
              {loading && <TypingIndicator colors={colors} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Voice Panel (transcript + voice selector) — slides in when active */}
        {showVoicePanel && (
          <VoicePanel
            voice={voice}
            colors={colors}
            fontStack={fontStack}
            onMicToggle={handleMicToggle}
          />
        )}

        {/* Input Bar */}
        <div style={{ padding: "16px 24px 24px", background: "transparent" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,.doc,.docx"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            {/* Uploaded files preview strip */}
            {uploadedFiles.length > 0 && (
              <div
                style={{
                  display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10,
                  padding: "10px 14px", background: "rgba(20, 50, 50, 0.4)",
                  border: `1px solid ${colors.border}`, borderRadius: 12,
                }}
              >
                {uploadedFiles.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", background: "rgba(45, 212, 168, 0.08)",
                      border: `1px solid ${f.status === "error" ? "rgba(239,68,68,0.4)"
                          : f.status === "ready" ? "rgba(45,212,168,0.25)"
                            : "rgba(255,255,255,0.1)"
                        }`,
                      borderRadius: 8, maxWidth: 220,
                    }}
                  >
                    {/* Thumbnail for images */}
                    {f.preview ? (
                      <img
                        src={f.preview}
                        alt={f.name}
                        style={{
                          width: 32, height: 32, borderRadius: 4,
                          objectFit: "cover", flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {f.type === "application/pdf" ? "📄"
                          : f.type === "text/plain" ? "📝"
                            : "📁"}
                      </span>
                    )}

                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 500, color: colors.text,
                        whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden",
                      }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>
                        {f.status === "uploading" ? (
                          f.type?.startsWith("image/") ? "🔍 Analyzing image..." : "⏳ Processing..."
                        ) : f.status === "error" ? "❌ Error"
                          : f.status === "ready" ? (
                            f.extractedText?.startsWith("[IMAGE ANALYSIS")
                              ? "✅ Vision analyzed"
                              : f.extractedText ? `✅ ${(f.extractedText.length / 1000).toFixed(1)}k chars`
                                : f.type?.startsWith("image/") ? "✅ Image ready"
                                  : "✅ Ready"
                          ) : ""}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(f.id)}
                      style={{
                        background: "none", border: "none", color: colors.textMuted,
                        cursor: "pointer", fontSize: 12, padding: "2px 4px", flexShrink: 0,
                        opacity: 0.6, transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => { e.target.style.opacity = "1"; e.target.style.color = "#ef4444"; }}
                      onMouseLeave={(e) => { e.target.style.opacity = "0.6"; e.target.style.color = colors.textMuted; }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Clear all button */}
                {uploadedFiles.length > 1 && (
                  <button
                    onClick={clearAllFiles}
                    style={{
                      padding: "4px 10px", background: "rgba(239,68,68,0.08)",
                      border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6,
                      color: colors.danger, fontSize: 10, cursor: "pointer",
                      fontFamily: fontStack, alignSelf: "center",
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Input row */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: colors.bgInput, border: `1px solid ${colors.border}`, borderRadius: 14,
                padding: "4px 8px 4px 12px", backdropFilter: "blur(16px)",
                boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 ${colors.borderLight}`,
              }}
            >
              {/* Upload button — opens file picker */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: uploadedFiles.length > 0 ? "rgba(45,212,168,0.12)" : "none",
                  border: uploadedFiles.length > 0 ? `1px solid rgba(45,212,168,0.25)` : "none",
                  color: uploadedFiles.length > 0 ? colors.accent : colors.textMuted,
                  cursor: "pointer", fontSize: 18, padding: "4px 6px", borderRadius: 6,
                  transition: "all 0.2s", position: "relative",
                }}
                title="Upload documents, images, or evidence"
              >
                📎
                {uploadedFiles.length > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    background: colors.accent, color: "#0a1a1a",
                    fontSize: 9, fontWeight: 700, width: 16, height: 16,
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {uploadedFiles.length}
                  </span>
                )}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={uploadedFiles.length > 0
                  ? "Ask about your uploaded documents..."
                  : "Describe your legal concern..."
                }
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: colors.text, fontSize: 14, fontFamily: fontStack, resize: "none",
                  padding: "12px 0", lineHeight: 1.5,
                }}
              />

              {/* Mic Button — tap to toggle recording */}
              {voice.sttSupported && (
                <button
                  onClick={handleMicToggle}
                  title={voice.isRecording ? "Tap to stop" : "Tap to speak"}
                  style={{
                    width: 40, height: 40, borderRadius: 10, position: "relative",
                    background: voice.isRecording ? "rgba(239, 68, 68, 0.15)" : colors.bgHover,
                    border: `1px solid ${voice.isRecording ? colors.danger : colors.border}`,
                    color: voice.isRecording ? colors.danger : colors.textMuted,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, transition: "all 0.2s",
                    animation: voice.isRecording ? "micPulse 1.2s ease-in-out infinite" : "none",
                  }}
                >
                  {voice.isRecording ? "🔴" : "🎙️"}
                </button>
              )}

              {/* Send Button */}
              {(() => {
                const stillUploading = uploadedFiles.some((f) => f.status === "uploading");
                const canSend = !loading && !stillUploading && (input.trim() || uploadedFiles.length > 0);
                return (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!canSend}
                    title={stillUploading ? "Waiting for file to finish processing..." : "Send message"}
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: canSend
                        ? `linear-gradient(135deg, ${colors.accent}, ${colors.blue})`
                        : colors.bgHover,
                      border: "none",
                      color: canSend ? "#0a1a1a" : colors.textMuted,
                      cursor: canSend ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, transition: "all 0.2s",
                    }}
                  >
                    {loading ? "⏳" : stillUploading ? "⏳" : "➤"}
                  </button>
                );
              })()}
            </div>
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
// VOICE PANEL — Transcript + Voice Selector
// ============================================
function VoicePanel({ voice, colors, fontStack, onMicToggle }) {
  return (
    <div
      style={{
        maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 24px",
      }}
    >
      <div
        style={{
          background: colors.bgInput, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 8,
          backdropFilter: "blur(16px)",
          display: "flex", flexDirection: "column", gap: 10,
        }}
      >
        {/* Transcript bar */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 8,
            background: voice.isListening ? "rgba(45, 212, 168, 0.08)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${voice.isListening ? "rgba(45, 212, 168, 0.3)" : "rgba(255,255,255,0.06)"}`,
            transition: "all 0.3s",
            minHeight: 44,
          }}
        >
          <span style={{ fontSize: 14 }}>
            {voice.isRecording ? "🔴" : voice.isSpeaking ? "🔊" : "🎤"}
          </span>
          <span
            style={{
              flex: 1, fontSize: 13,
              color: voice.isListening ? colors.text : colors.textMuted,
              fontFamily: fontStack, letterSpacing: "0.02em",
              lineHeight: 1.5,
            }}
          >
            {voice.isRecording
              ? voice.transcript || "🎤 Listening..."
              : voice.isSpeaking
                ? "🔊 Speaking response..."
                : "Tap the mic button and speak — it will auto-send after you pause"}
          </span>
          {voice.isRecording && (
            <span style={{ fontSize: 10, color: colors.accent, whiteSpace: "nowrap", opacity: 0.7 }}>
              auto-sends after pause
            </span>
          )}
        </div>

        {/* Controls row: STT Language + TTS Voice + Mic + Stop */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

          {/* STT Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
              🎤 STT
            </span>
            <select
              value={voice.sttLang}
              onChange={(e) => voice.setSttLang(e.target.value)}
              style={{
                minWidth: 110, background: "rgba(20, 50, 50, 0.8)",
                border: `1px solid ${colors.border}`, borderRadius: 8,
                padding: "6px 8px", color: colors.text, fontFamily: fontStack,
                fontSize: 11, outline: "none", cursor: "pointer",
              }}
            >
              {STT_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* TTS Voice Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 150 }}>
            <span style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
              🔊 TTS
            </span>
            <select
              value={voice.selectedVoiceIndex}
              onChange={(e) => voice.setSelectedVoiceIndex(Number(e.target.value))}
              style={{
                flex: 1, minWidth: 120, background: "rgba(20, 50, 50, 0.8)",
                border: `1px solid ${colors.border}`, borderRadius: 8,
                padding: "6px 8px", color: colors.text, fontFamily: fontStack,
                fontSize: 11, outline: "none", cursor: "pointer",
              }}
            >
              {voice.voices.map((v, i) => (
                <option key={i} value={i}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Large mic button for voice panel */}
          <button
            onClick={onMicToggle}
            title={voice.isRecording ? "Stop & send" : "Start recording"}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: voice.isRecording ? "rgba(239, 68, 68, 0.15)" : "rgba(45, 212, 168, 0.1)",
              border: `2px solid ${voice.isRecording ? colors.danger : "rgba(45, 212, 168, 0.3)"}`,
              color: voice.isRecording ? colors.danger : colors.accent,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, transition: "all 0.25s",
              animation: voice.isRecording ? "micPulse 1.2s ease-in-out infinite" : "none",
            }}
          >
            {voice.isRecording ? "⏹" : "🎙️"}
          </button>

          {voice.isSpeaking && (
            <button
              onClick={voice.stopSpeaking}
              title="Stop speaking"
              style={{
                padding: "6px 12px", background: "rgba(239, 68, 68, 0.1)",
                border: `1px solid rgba(239, 68, 68, 0.3)`, borderRadius: 8,
                color: colors.danger, fontSize: 12, cursor: "pointer", fontFamily: fontStack,
              }}
            >
              ⏹ Stop
            </button>
          )}
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
        fontSize: 13, color: "#94a3b8", cursor: "pointer", padding: "4px 8px",
        borderRadius: 6, transition: "all 0.15s",
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
          width: 80, height: 80, borderRadius: 20,
          background: `linear-gradient(135deg, rgba(45, 212, 168, 0.2), rgba(56, 189, 248, 0.15))`,
          border: `1px solid rgba(45, 212, 168, 0.12)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, marginBottom: 24,
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
      <p style={{ fontSize: 15, color: colors.textDim, marginBottom: 12, textAlign: "center" }}>
        Describe your legal concern or pick a suggestion below.
      </p>
      <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 36, textAlign: "center" }}>
        🎙️ You can also use <strong style={{ color: colors.accent }}>Voice Mode</strong> — click the mic or enable it from the navbar.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 700, marginBottom: 32 }}>
        {CATEGORIES.slice(0, 4).map((cat) => (
          <div
            key={cat.name}
            onClick={() => onSuggestion("I need legal help regarding " + cat.name)}
            style={{
              width: 155, padding: "16px 14px", background: colors.glass,
              border: `1px solid ${colors.border}`, borderRadius: 12, cursor: "pointer",
              backdropFilter: "blur(12px)", transition: "all 0.2s",
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
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s)}
            style={{
              padding: "12px 16px", background: colors.bgInput,
              border: `1px solid ${colors.border}`, borderRadius: 10,
              color: colors.textDim, cursor: "pointer", textAlign: "left",
              fontSize: 13, fontFamily: fontStack, transition: "all 0.15s",
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

function MessageBubble({ msg, colors, onSpeak, onStopSpeak, isSpeaking, ttsSupported }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: "80%", padding: "14px 18px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? colors.userBubble : colors.aiBubble,
          border: `1px solid ${isUser ? "rgba(45,212,168,0.2)" : colors.border}`,
          fontSize: 14, lineHeight: 1.7, color: colors.text,
          backdropFilter: "blur(8px)", whiteSpace: "pre-wrap",
        }}
      >
        {!isUser && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>⚖️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>QanoonAI</span>
            </div>
            {/* TTS button on AI messages */}
            {ttsSupported && (
              <button
                onClick={() => isSpeaking ? onStopSpeak() : onSpeak(msg.content)}
                title={isSpeaking ? "Stop speaking" : "Read aloud"}
                style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 14,
                  opacity: isSpeaking ? 1 : 0.5, color: isSpeaking ? "#ef4444" : colors.accent,
                  transition: "all 0.2s", padding: "2px 4px",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = "1")}
                onMouseLeave={(e) => (e.target.style.opacity = isSpeaking ? "1" : "0.5")}
              >
                {isSpeaking ? "⏹" : "🔊"}
              </button>
            )}
          </div>
        )}
        {msg.content}

        {/* Image previews in user messages */}
        {msg.images && msg.images.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {msg.images.map((img, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={img.preview}
                  alt={img.name}
                  style={{
                    maxWidth: 200, maxHeight: 150, borderRadius: 8,
                    border: "1px solid rgba(45,212,168,0.2)",
                    objectFit: "cover", cursor: "pointer",
                  }}
                  onClick={() => window.open(img.preview, "_blank")}
                  title="Click to view full size"
                />
                <div style={{
                  fontSize: 10, color: colors.textMuted, marginTop: 3,
                  textAlign: "center", maxWidth: 200, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  📷 {img.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ colors }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
      <div
        style={{
          padding: "14px 18px", borderRadius: "16px 16px 16px 4px",
          background: colors.aiBubble, border: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>⚖️</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%", background: colors.accent,
                opacity: 0.5, animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; } 40% { transform: scale(1.2); opacity: 1; } }`}</style>
      </div>
    </div>
  );
}