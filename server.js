require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/auth/ebay", (req, res) => {
  const redirect = `https://auth.ebay.com/oauth2/authorize?client_id=${process.env.EBAY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&scope=${encodeURIComponent(process.env.SCOPES)}`;
  res.redirect(redirect);
});

app.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send("No code provided");
  const creds = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64");

  try {
    const resp = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`
    });
    const data = await resp.json();
    console.log("Access Token Received:", data);
    res.send("Authorization successful. Check your server logs.");
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("OAuth failed.");
  }
});

app.post("/webhook", (req, res) => {
  console.log("🔔 Webhook Received:");
  console.dir(req.body, { depth: null });
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
