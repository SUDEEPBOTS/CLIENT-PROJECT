// pages/api/register.js
import dbConnect from "@/lib/db";
import Site from "@/models/Site";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    await dbConnect();

    const { siteName, siteUrl } = req.body;

    if (!siteName || !siteUrl) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const siteId = Math.random().toString(36).substring(2, 10);

    await Site.create({
      siteId,
      siteName,
      siteUrl,
      siteOff: false,
      botOff: false,
      disabledMessage: "",
      broadcast: ""
    });

    return res.status(200).json({
      ok: true,
      siteId
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
