import { useState, useEffect } from "react";
import { fetchPrologWava } from "../../api/wava/PrologWava";

const VirtualAssistant = () => {
  const [assistantState, setAssistantState] = useState("idle");
  const [lastText, setLastText] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [prologText, setPrologText] = useState("");

  const [showModal, setShowModal] = useState(true);
  const [allowVoice, setAllowVoice] = useState(true);

  const [inputText, setInputText] = useState("");

  const speak = (text, lang = "id-ID") => {
    if (!text) return;

    speechSynthesis.cancel(); // bersihkan dulu

    setAssistantState("speaking");
    setSpokenText(text);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;

    utter.onend = () => {
      setAssistantState("idle");
    };

    utter.onerror = (e) => {
      console.error("TTS error", e);
      setAssistantState("idle");
    };

    speechSynthesis.speak(utter);
  };

  const fetchProlog = async () => {
    try {
        const json = await fetchPrologWava();
        if (json.success) {
        setPrologText(json.data.text);
        setSpokenText(json.data.text);
        }
    } catch (err) {
        console.error(err);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    setAssistantState("listening");

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const spokenText = e.results[0][0].transcript;
      handleUserInput(spokenText);
    };

    recognition.onerror = () => setAssistantState("idle");
    recognition.start();
  };

  const handleUserInput = (text) => {
    if (!text) return;

    setLastText(text);

    // sementara: echo
    speak(`Anda mengatakan: ${text}`);

    // nanti di sini:
    // - kirim ke BE
    // - intent detection
    // - dialog engine
  };

  const getAvatarSrc = () => {
    switch (assistantState) {
      case "speaking":
        return "/talking.png";
      case "listening":
        return "/listening.png";
      default:
        return "/idle.png";
    }
  };

  useEffect(() => {
    fetchProlog();
  }, []);

  return (
    <>
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>🎧 Aktifkan WAVA</h3>

            <label style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={allowVoice}
                onChange={(e) => setAllowVoice(e.target.checked)}
              />
              Dengarkan perkenalan WAVA
            </label>

            <button
              onClick={() => {
                setShowModal(false);
                if (allowVoice) {
                  speak(prologText);
                }
              }}
              disabled={!prologText}
            >
              Mulai
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", maxWidth: 500, margin: "auto" }}>
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              width: 160,
              height: 160,
              margin: "auto",
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow:
                assistantState === "speaking"
                  ? "0 0 20px #42a5f5"
                  : assistantState === "listening"
                  ? "0 0 20px #66bb6a"
                  : "0 0 10px #ccc",
              transition: "all 0.3s ease",
              animation:
                assistantState === "speaking"
                  ? "pulse 1.2s infinite"
                  : "none",
            }}
          >
            <img
              src={getAvatarSrc()}
              alt="WAVA Avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ marginTop: 6, fontSize: 14, opacity: 0.7 }}>
            {assistantState === "speaking" && "🗣️ WAVA sedang berbicara"}
            {assistantState === "listening" && "🎧 WAVA mendengarkan"}
            {assistantState === "idle" && "😐 WAVA siap"}
          </div>
        </div>

        <h2>WAVA</h2>

        <p>
          Status: <b>{assistantState}</b>
        </p>

        <button
          onClick={() => speak(prologText)}
          disabled={!prologText || assistantState === "speaking"}
          style={{ padding: 10, margin: 10, borderRadius: "10px" }}
        >
          🔊 Dengarkan WAVA
        </button>

        {spokenText && (
          <div
            style={{
              background: "#e3f2fd",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
              textAlign: "left"
            }}
          >
            🤖 <b>WAVA:</b> {spokenText}
          </div>
        )}

        {lastText && (
          <div
            style={{
              background: "#f1f8e9",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
              textAlign: "right"
            }}
          >
            🗣 <b>Anda:</b> {lastText}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            type="text"
            value={inputText}
            placeholder="Ketik pesan..."
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUserInput(inputText);
                setInputText("");
              }
            }}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={startListening}
            disabled={assistantState !== "idle"}
            style={{ fontSize: 24, padding: 10, borderRadius: "10px" }}
          >
            🎤
          </button>
          
          <button
            onClick={() => {
              handleUserInput(inputText);
              setInputText("");
            }}
            style={{ padding: 10, borderRadius: "10px" }}
          >
            Kirim
          </button>
        </div>

      </div>
    </>
  );

};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modalStyle = {
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  width: 320,
  textAlign: "center",
};

const style = document.createElement("style");
style.innerHTML = `
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;
document.head.appendChild(style);

export default VirtualAssistant;
