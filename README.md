# 🤖 SEZUKUU · CLIENT VERSION  
**Telegram AI Bot Control Panel (Powered by Home Admin Server)**

This is the **Client Version** of Sezukuu.  
Each client website hosts **their own Telegram bot panel**, but:

### 🟥 IMPORTANT  
👉 All AI replies  
👉 Personality system  
👉 Bot ON/OFF  
👉 Website ON/OFF  
👉 Broadcast messages  

**all are controlled by the Sezukuu HOME ADMIN PANEL.**

This client project **cannot run independently**.  
It must always stay connected to:

```
HOME_BASE_URL=https://your-admin-domain.vercel.app
```

---

# 🚀 Features Available to Clients

| Feature | Description |
|--------|-------------|
| 🎭 Personality Settings | Owner name, bot name, bot username, gender, personality |
| 🤖 Telegram Bot Setup | Add bot token, set webhook |
| 🧠 Test Chat | Send test messages via home AI server |
| 👥 Group Logger | Shows groups where bot is active |
| ⚡ Auto Registration | Registers itself to HOME |
| 🛡 Admin-Controlled | Admin can disable website/bot anytime |
| 🔔 Broadcast Popup | Popups appear instantly from admin |
| 💾 Local Settings | Saved in MongoDB (client-side) |

---

# 📌 How It Works (Client Flow)

```
User → Client Bot → Client Webhook
      ↓ forward chat
Home AI (/api/chat) ← Client
      ↓
   Yuki AI
      ↓
Return reply → Client Bot → User
```

The HOME server controls:

- Website Online/Offline  
- Bot Online/Offline  
- Broadcast messages  
- Personality memory  
- AI engine & API keys  

---

# ⚙️ Requirements

Client project needs:

- MongoDB connection  
- A valid Telegram Bot Token  
- Webhook setup  
- HOME_BASE_URL pointing to Home Admin Panel  

---

# 🔧 Environment Variables

Add these inside:  
**Vercel → Project Settings → Environment Variables**

```
MONGO_URI=your_mongo_string
HOME_BASE_URL=https://your-admin-domain.vercel.app
```

Optional:
```
TELEGRAM_BOT_TOKEN=your_bot_token
```

---

# 🟦 First-Time Setup (Registration)

When client site opens first time:

1. A popup appears:  
   **“Enter Website Name”**
2. Client enters a name  
3. It registers itself:

```
POST HOME_BASE_URL/api/register
```

Home server returns:

```
{ "siteId": "xxxx-xxxx" }
```

This siteId is stored locally  
and all future config comes from HOME panel.

---

# 🤖 Setting Telegram Webhook

Once you save the bot token:

Set webhook manually:

```
https://client-site.vercel.app/api/telegram-webhook?token=YOUR_BOT_TOKEN&siteId=YOUR_SITE_ID
```

Or click **"Set Webhook"** button in the UI.

---

# 🎭 Bot Settings (Controlled by Client)

Clients can set:

- Owner Name  
- Bot Name  
- @BotUsername  
- Gender (male/female)  
- Personality (normal/flirty/professional)  
- Group Link (shown on /start)  

These settings are forwarded to Home AI during chat.

---

# 🚨 Admin Control Over Client

Admin can:

- Turn client website OFF  
- Turn bot OFF  
- Send broadcast to this client  
- Delete site entry  
- View activity  
- Update personality  
- Track online status  

Client UI will automatically obey:

## 🔴 If Website is Disabled  
Client sees:

```
⚠️ This website is disabled by the Administrator.
```

## 🟡 If Bot is Disabled  
Telegram bot simply stops responding.

## 🔔 If Broadcast Sent  
Client panel shows popup:

```
Admin Broadcast:
<message>
```

---

# 🧪 Test Chat Feature

Client panel includes:

```
Test Chat with Yuki
```

This sends:

```
POST HOME_BASE_URL/api/chat
```

and displays reply from Home AI Engine.

---

# 📡 Webhook Processing (Important)

Client webhook (`/api/telegram-webhook`) does:

1. Receives message from Telegram  
2. Checks HOME config → siteOFF/botOFF  
3. Sends full chat info to:  
   `HOME_BASE_URL/api/chat`  
4. Sends reply back to Telegram  

---

# 🗂 Folder Structure (Client Version)

```
CLIENT/
│
├── lib/
│   └── db.js
│
├── models/
│   ├── BotConfig.js
│   ├── BotSettings.js
│   ├── Group.js
│   └── Memory.js
│
├── pages/
│   ├── index.js              ← Client UI
│   │
│   └── api/
│       ├── telegram-webhook.js
│       ├── bot-config.js
│       ├── bot-settings.js
│       ├── groups.js
│
├── public/
├── styles/
```

❌ Not included in client:

```
models/ApiKey.js
lib/gemini.js
pages/api/keys.js
pages/api/chat.js
```

---

# 🚀 Deploy to Vercel (One Click)

If the client uploads this to GitHub,  
they can deploy instantly:

```
https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/YOUR-CLIENT-REPO
```

Replace:

- YOUR-USERNAME  
- YOUR-CLIENT-REPO  

---

# 📝 Notes

- Client version **does not** contain Gemini keys  
- Client depends 100% on HOME_BASE_URL  
- Admin can control all clients anytime  
- Client website must never be used without Home server  
- Telegram bot must always use webhook with `siteId`  
- Personality settings only affect that client's bot

---

# 🎉 Done!  
Your Client Version README is ready.  
Paste it inside `README.md` of client project.
