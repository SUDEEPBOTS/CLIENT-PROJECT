export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const HOME_SERVER = "https://home-omega-plum.vercel.app";

    const response = await fetch(`${HOME_SERVER}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (e) {
    console.error("Proxy chat error:", e);
    return res.status(500).json({ ok: false, error: "Proxy error" });
  }
}
