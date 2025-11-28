// pages/api/chat.js  (client side proxy)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error: "Method not allowed" });

  try {
    // HOME server base (change if different)
    const HOME = "https://home-omega-plum.vercel.app";

    const r = await fetch(`${HOME}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("CLIENT->HOME chat proxy error:", err);
    return res.status(500).json({ ok:false, error: "Proxy failed" });
  }
}
