// pages/api/telegram-webhook.js
// Client version: forwards chat to HOME server and relays replies to Telegram

const HOME_BASE = process.env.HOME_BASE_URL || "https://sezukuu.vercel.app";
const HOME_CHAT_API = `${HOME_BASE}/api/chat`;
const HOME_CONFIG_API = (siteId) => `${HOME_BASE}/api/config?siteId=${encodeURIComponent(siteId)}`;

// Next.js default parser is fine for Telegram JSON webhooks.
export const config = {
  api: { bodyParser: true },
};

async function sendMessage(token, chatId, text, extra = {}) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...extra,
    };
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("sendMessage error", e);
  }
}

async function sendTyping(token, chatId) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendChatAction`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
  } catch (e) {
    // ignore
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  const body = req.body || {};

  // Telegram payload shapes: message, edited_message, channel_post, callback_query etc.
  const telegramMessage =
    body.message || body.edited_message || body.channel_post || (body.callback_query && body.callback_query.message);

  if (!telegramMessage) {
    return res.status(200).json({ ok: true });
  }

  const chat = telegramMessage.chat || telegramMessage.from || {};
  const chatId = chat.id;
  const text = telegramMessage.text || telegramMessage.caption || (body.data ? body.data : "") || "";
  const msgId = telegramMessage.message_id || (body.callback_query && body.callback_query.message && body.callback_query.message.message_id);

  // BOT TOKEN: prefer query param, fallback to env
  const query = req.query || {};
  const BOT_TOKEN = (query.token || process.env.TELEGRAM_BOT_TOKEN || "").toString();

  // SITE_ID: prefer query param, fallback to body.siteId (if client included it)
  const SITE_ID = (query.siteId || body.siteId || "").toString();

  // If no bot token we cannot send responses - just return OK
  if (!BOT_TOKEN) {
    console.warn("No BOT_TOKEN provided to webhook; skipping reply.");
    return res.status(200).json({ ok: true, warning: "No bot token" });
  }

  // If siteId present, fetch config from HOME server
  if (SITE_ID) {
    try {
      const cfgRes = await fetch(HOME_CONFIG_API(SITE_ID));
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        // expected fields: siteOff (bool), botOff (bool), message (string), broadcast (string)
        if (cfg.siteOff) {
          const disabledMsg = cfg.message || "This website is currently disabled by the administrator.";
          // Inform user in chat that site is disabled
          await sendMessage(BOT_TOKEN, chatId, `⚠️ ${disabledMsg}`, { reply_to_message_id: msgId });
          return res.status(200).json({ ok: true, info: "site disabled" });
        }
        if (cfg.botOff) {
          // Bot is turned off by admin - do not reply
          return res.status(200).json({ ok: true, info: "bot disabled" });
        }
        // Optionally, we could forward cfg.broadcast to site users - but site polling shows broadcast to UI
      }
      // If config fetch failed, continue to forward the message (best-effort)
    } catch (e) {
      console.error("config fetch error", e);
      // continue
    }
  }

  // Build payload to forward to HOME chat API
  // Allow client to include settings in the webhook body if they saved them client-side
  const forwardPayload = {
    message: text,
    siteId: SITE_ID || undefined,
    ownerName: body.ownerName || body.owner || "",
    botName: body.botName || body.name || "",
    username: body.botUsername || body.username || "",
    gender: body.gender || "",
    personality: body.personality || "",
    groupLink: body.groupLink || "",
    // Optionally include some context about telegram user
    _meta: {
      fromId: telegramMessage.from?.id,
      fromName: `${telegramMessage.from?.first_name || ""} ${telegramMessage.from?.last_name || ""}`.trim(),
      chatType: telegramMessage.chat?.type || "private",
    },
  };

  // Typing indicator
  await sendTyping(BOT_TOKEN, chatId);

  // Small delay to simulate typing and allow HOME server to prepare
  await new Promise((r) => setTimeout(r, 600));

  try {
    const r = await fetch(HOME_CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardPayload),
    });

    let data;
    try {
      data = await r.json();
    } catch (e) {
      console.error("Invalid JSON from HOME chat API", e);
      data = null;
    }

    if (!r.ok || !data) {
      console.error("HOME chat API returned error", r.status, data);
      // Optional: notify the user
      await sendMessage(BOT_TOKEN, chatId, "⚠️ Bot is temporarily unable to respond. Please try again later.", { reply_to_message_id: msgId });
      return res.status(200).json({ ok: false, error: "home api error", status: r.status });
    }

    if (!data.ok) {
      console.error("HOME chat API response not ok", data);
      await sendMessage(BOT_TOKEN, chatId, data.error || "⚠️ Bot error from upstream.", { reply_to_message_id: msgId });
      return res.status(200).json({ ok: false, error: "home returned not ok", detail: data });
    }

    const reply = (data.reply || "").toString().trim() || "Sorry, I couldn't generate a reply.";

    // Send reply back to Telegram
    await sendMessage(BOT_TOKEN, chatId, reply, { reply_to_message_id: msgId });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error forwarding to HOME chat API", err);
    try {
      await sendMessage(BOT_TOKEN, chatId, "⚠️ Something went wrong on the bot server. Try later.", { reply_to_message_id: msgId });
    } catch (_) {}
    return res.status(500).json({ ok: false, error: "server error" });
  }
}
