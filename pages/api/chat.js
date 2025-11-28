// CLIENT PROJECT → /pages/api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const HOME_SERVER = "https://home-omega-plum.vercel.app/";

    // Forward request to HOME server chat API
    const response = await fetch(`${HOME_SERVER}api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    console.error("CLIENT CHAT PROXY ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: "Proxy chat request failed",
    });
  }
}
