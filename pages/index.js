// pages/index.js
import { useEffect, useState } from "react";

const CHAT_API_URL = "https://sezukuu.vercel.app/api/chat";
const REGISTER_API_URL = "https://sezukuu.vercel.app/api/register";
const CONFIG_API_URL_BASE = "https://sezukuu.vercel.app/api/config"; // append ?siteId=...

export default function Home() {
  // removed keys state on client version
  const [botToken, setBotToken] = useState("");
  const [botTokenSaved, setBotTokenSaved] = useState(false);

  const [settings, setSettings] = useState({
    ownerName: "",
    botName: "",
    botUsername: "",
    gender: "female",
    personality: "Friendly",
    groupLink: "",
  });

  const [siteId, setSiteId] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [showBroadcastPopup, setShowBroadcastPopup] = useState(false);
  const [broadcastFromAdmin, setBroadcastFromAdmin] = useState("");

  // load local siteId & settings from localStorage
  useEffect(() => {
    const id = localStorage.getItem("siteId");
    const savedSettings = localStorage.getItem("clientSettings");
    if (id) {
      setSiteId(id);
    } else {
      // first-time: ask for site name
      setShowRegisterModal(true);
    }
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
  }, []);

  // save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem("clientSettings", JSON.stringify(settings));
  }, [settings]);

  // If siteId present, start polling config
  useEffect(() => {
    if (!siteId) return;
    let mounted = true;

    async function fetchConfig() {
      try {
        const res = await fetch(`${CONFIG_API_URL_BASE}?siteId=${encodeURIComponent(siteId)}`);
        if (!res.ok) return;
        const data = await res.json();
        // Expecting: { siteOff: true/false, botOff: true/false, message: "", broadcast: "" }
        if (!mounted) return;
        if (data.siteOff) {
          setIsDisabled(true);
          setDisabledMessage(data.message || "This website is disabled by the administrator.");
        } else {
          setIsDisabled(false);
          setDisabledMessage("");
        }

        if (data.broadcast && data.broadcast !== "") {
          setBroadcastFromAdmin(data.broadcast);
          setShowBroadcastPopup(true);
        }
      } catch (e) {
        // ignore poll errors
        console.error("config poll error", e);
      }
    }

    fetchConfig();
    const interval = setInterval(fetchConfig, 6000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [siteId]);

  // Register site (POST to HOME server)
  async function registerSite() {
    if (!registerName || registerName.trim() === "") {
      alert("Please enter a site name");
      return;
    }
    try {
      const res = await fetch(REGISTER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: registerName,
          siteUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.siteId) {
        localStorage.setItem("siteId", data.siteId);
        setSiteId(data.siteId);
        setShowRegisterModal(false);
        setRegisterName("");
        alert("Registered successfully.");
      } else {
        alert("Registration failed: " + (data.error || "Unknown"));
      }
    } catch (e) {
      console.error(e);
      alert("Registration error");
    }
  }

  // Save bot token locally (client still needs token to operate Telegram webhook)
  async function saveBotToken() {
    // On client version we just save locally or to BotSettings API (if allowed).
    localStorage.setItem("botToken", botToken);
    setBotTokenSaved(true);
    setTimeout(() => setBotTokenSaved(false), 2000);
  }

  // Test chat via HOME chat API (hardcoded)
  async function testChat(message) {
    if (!message || message.trim() === "") {
      alert("Enter message");
      return;
    }
    try {
      const body = {
        message,
        ownerName: settings.ownerName,
        botName: settings.botName,
        username: settings.botUsername,
        gender: settings.gender,
        personality: settings.personality,
        siteId,
      };

      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        alert("Reply: " + (data.reply || "").trim());
      } else {
        alert("Error: " + (data.error || "No reply"));
      }
    } catch (e) {
      console.error(e);
      alert("Chat test error");
    }
  }

  if (isDisabled) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f19", color: "white" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2>⚠️ {disabledMessage}</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#0b0f19", minHeight: "100vh", color: "white" }}>
      <h1>Client Panel (Sezukuu)</h1>

      {/* Bot Settings */}
      <section style={{ marginTop: 20 }}>
        <h3>Bot Settings</h3>
        <div style={{ maxWidth: 600 }}>
          <label>Owner Name</label>
          <input value={settings.ownerName} onChange={(e) => setSettings(prev => ({...prev, ownerName: e.target.value}))} />
          <label>Bot Name</label>
          <input value={settings.botName} onChange={(e) => setSettings(prev => ({...prev, botName: e.target.value}))} />
          <label>Bot Username</label>
          <input value={settings.botUsername} onChange={(e) => setSettings(prev => ({...prev, botUsername: e.target.value}))} />
          <label>Gender</label>
          <select value={settings.gender} onChange={(e)=> setSettings(prev=>({...prev, gender:e.target.value}))}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <label>Personality</label>
          <input value={settings.personality} onChange={(e) => setSettings(prev => ({...prev, personality: e.target.value}))} />
          <label>Group Link</label>
          <input value={settings.groupLink} onChange={(e) => setSettings(prev => ({...prev, groupLink: e.target.value}))} />
          <div style={{ marginTop: 8 }}>
            <button onClick={() => {
              localStorage.setItem("clientSettings", JSON.stringify(settings));
              alert("Settings saved locally.");
            }}>Save Settings</button>
          </div>
        </div>
      </section>

      {/* Bot Token */}
      <section style={{ marginTop: 24 }}>
        <h3>Telegram Bot</h3>
        <input placeholder="Telegram Bot Token" value={botToken} onChange={(e)=>setBotToken(e.target.value)} />
        <button onClick={saveBotToken}>{botTokenSaved ? "Saved" : "Save Token"}</button>
        <p style={{ fontSize: 12, color: "#aaa" }}>
          *Use this token to set webhook to <code>{window.location.origin}/api/telegram-webhook</code>
        </p>
      </section>

      {/* Test Chat */}
      <section style={{ marginTop: 24 }}>
        <h3>Test Chat with Yuki</h3>
        <TestChat onSend={testChat} />
      </section>

      {/* Broadcast popup */}
      {showBroadcastPopup && broadcastFromAdmin && (
        <div style={{ position: "fixed", right: 20, bottom: 20, background: "#111827", color: "white", padding: 16, borderRadius: 8 }}>
          <strong>Broadcast:</strong>
          <div>{broadcastFromAdmin}</div>
          <button onClick={()=> setShowBroadcastPopup(false)}>Close</button>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#0b1220", padding: 24, borderRadius: 8, color: "white", width: 320 }}>
            <h3>Setup your site</h3>
            <input placeholder="Enter site name" value={registerName} onChange={(e)=>setRegisterName(e.target.value)} />
            <div style={{ marginTop: 12 }}>
              <button onClick={registerSite}>Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal TestChat component
function TestChat({ onSend }) {
  const [text, setText] = useState("");
  return (
    <div style={{ maxWidth: 600 }}>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={4} style={{ width: "100%" }} />
      <button onClick={() => { onSend(text); setText(""); }}>Send</button>
    </div>
  );
}