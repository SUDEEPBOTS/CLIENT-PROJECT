// pages/index.js (CLIENT VERSION – FIXED FOR NEXT.JS)
import { useEffect, useState } from "react";

const HOME_BASE = "https://home-omega-plum.vercel.app";
const CHAT_API_URL = `${HOME_BASE}/api/chat`;
const REGISTER_API_URL = `${HOME_BASE}/api/register`;
const CONFIG_API_URL_BASE = `${HOME_BASE}/api/config`;

export default function Home() {
  // Safe window check
  const isBrowser = typeof window !== "undefined";

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

  const [broadcastFromAdmin, setBroadcastFromAdmin] = useState("");
  const [showBroadcastPopup, setShowBroadcastPopup] = useState(false);

  // ----------------- LOAD LOCAL STORAGE -----------------
  useEffect(() => {
    if (!isBrowser) return;

    const id = window.localStorage.getItem("siteId");
    const saved = window.localStorage.getItem("clientSettings");

    if (id) setSiteId(id);
    else setShowRegisterModal(true);

    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {}
    }
  }, [isBrowser]);

  // Save settings to localStorage
  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem("clientSettings", JSON.stringify(settings));
  }, [settings, isBrowser]);

  // ----------------- POLL CONFIG -----------------
  useEffect(() => {
    if (!siteId) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`${CONFIG_API_URL_BASE}?siteId=${encodeURIComponent(siteId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        // website OFF
        if (data.siteOff) {
          setIsDisabled(true);
          setDisabledMessage(data.message || "Site disabled by admin.");
        } else {
          setIsDisabled(false);
          setDisabledMessage("");
        }

        // broadcast
        if (data.broadcast && data.broadcast !== "") {
          setBroadcastFromAdmin(data.broadcast);
          setShowBroadcastPopup(true);
        }
      } catch (err) {}
    };

    poll();
    const int = setInterval(poll, 5000);

    return () => {
      active = false;
      clearInterval(int);
    };
  }, [siteId]);

  // ----------------- REGISTER SITE -----------------
  async function registerSite() {
    if (!registerName.trim()) return alert("Enter site name");

    let origin = "";
    if (isBrowser) origin = window.location.origin;

    try {
      const res = await fetch(REGISTER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: registerName,
          siteUrl: origin,
        }),
      });

      const data = await res.json();
      if (data.siteId) {
        if (isBrowser) window.localStorage.setItem("siteId", data.siteId);

        setSiteId(data.siteId);
        setShowRegisterModal(false);
        alert("Registration successful!");
      } else {
        alert("Registration failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Registration error.");
    }
  }

  // ----------------- BOT TOKEN SAVE -----------------
  function saveBotToken() {
    if (!isBrowser) return;
    window.localStorage.setItem("botToken", botToken);
    setBotTokenSaved(true);
    setTimeout(() => setBotTokenSaved(false), 2000);
  }

  // ----------------- TEST CHAT -----------------
  async function testChat(message) {
    if (!message.trim()) return alert("Enter message");

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
      if (data.ok) alert("Reply: " + data.reply);
      else alert("Error: " + data.error);
    } catch (err) {
      console.error(err);
      alert("Chat test error");
    }
  }

  // ----------------- SITE DISABLED VIEW -----------------
  if (isDisabled) {
    return (
      <div style={{ background: "#0b0f19", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h2>⚠️ {disabledMessage}</h2>
      </div>
    );
  }

  // ----------------- MAIN UI -----------------
  return (
    <div style={{ padding: 24, background: "#0b0f19", minHeight: "100vh", color: "white" }}>
      <h1>Client Panel (Sezukuu)</h1>

      {/* Bot Settings */}
      <section style={{ marginTop: 20 }}>
        <h3>Bot Settings</h3>
        <div style={{ maxWidth: 600 }}>
          <label>Owner Name</label>
          <input value={settings.ownerName} onChange={(e) => setSettings(s => ({ ...s, ownerName: e.target.value }))} />

          <label>Bot Name</label>
          <input value={settings.botName} onChange={(e) => setSettings(s => ({ ...s, botName: e.target.value }))} />

          <label>Bot Username</label>
          <input value={settings.botUsername} onChange={(e) => setSettings(s => ({ ...s, botUsername: e.target.value }))} />

          <label>Gender</label>
          <select value={settings.gender} onChange={(e) => setSettings(s => ({ ...s, gender: e.target.value }))}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          <label>Personality</label>
          <input value={settings.personality} onChange={(e) => setSettings(s => ({ ...s, personality: e.target.value }))} />

          <label>Group Link</label>
          <input value={settings.groupLink} onChange={(e) => setSettings(s => ({ ...s, groupLink: e.target.value }))} />

          <button onClick={() => {
            if (isBrowser) window.localStorage.setItem("clientSettings", JSON.stringify(settings));
            alert("Settings saved!");
          }}>
            Save
          </button>
        </div>
      </section>

      {/* Bot Token */}
      <section style={{ marginTop: 24 }}>
        <h3>Telegram Bot</h3>
        <input value={botToken} placeholder="Bot Token" onChange={(e) => setBotToken(e.target.value)} />
        <button onClick={saveBotToken}>{botTokenSaved ? "Saved!" : "Save Token"}</button>

        {isBrowser && (
          <p style={{ fontSize: 12, color: "#aaa" }}>
            Webhook: <code>{window.location.origin}/api/telegram-webhook</code>
          </p>
        )}
      </section>

      {/* Test Chat */}
      <section style={{ marginTop: 24 }}>
        <h3>Test Chat with Yuki</h3>
        <TestChat onSend={testChat} />
      </section>

      {/* Broadcast Popup */}
      {showBroadcastPopup && broadcastFromAdmin && (
        <div style={{
          position: "fixed", right: 20, bottom: 20,
          background: "#111827", padding: 16, borderRadius: 8
        }}>
          <b>Broadcast:</b>
          <p>{broadcastFromAdmin}</p>
          <button onClick={() => setShowBroadcastPopup(false)}>Close</button>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#0b1220", padding: 24, borderRadius: 10, width: 300 }}>
            <h3>Register Your Website</h3>
            <input
              placeholder="Site Name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
            />
            <button onClick={registerSite} style={{ marginTop: 10 }}>Register</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------- TestChat Component -----------------
function TestChat({ onSend }) {
  const [text, setText] = useState("");
  return (
    <div style={{ maxWidth: 600 }}>
      <textarea
        rows={4}
        style={{ width: "100%" }}
        onChange={(e) => setText(e.target.value)}
        value={text}
      />
      <button onClick={() => { onSend(text); setText(""); }}>Send</button>
    </div>
  );
                      }
