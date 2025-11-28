import mongoose from "mongoose";

const SiteSchema = new mongoose.Schema({
  siteId: { type: String, unique: true },
  siteName: String,
  siteUrl: String,
  siteOff: Boolean,
  botOff: Boolean,
  disabledMessage: String,
  broadcast: String,
});

export default mongoose.models.Site || mongoose.model("Site", SiteSchema);
