// panel-route.js — Backend Express route untuk Pterodactyl
// =========================================================
// Pasang dulu Express: npm install express
// Lalu di file utama kamu (app.js / server.js):
//
//   const express = require("express");
//   const app = express();
//   app.use(express.json());
//   app.use("/api", require("./panel-route"));
//   app.listen(3000);
//
// Atau set env var: PTERODACTYL_API_KEY=xxx node app.js
// =========================================================

const { Router } = require("express");
const router = Router();

const PTERODACTYL_URL     = "https://sanzy.webserverku.biz.id";
// Application API key (ptla...) — BUKAN Client key (ptlc...)
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY || "ptla_wSJufvKqSepXSGQzXrgsf2NWWmuDeBjNy7DdcDYaQDm";

// Egg 15 = NodeJS Bot | Egg 3 = Minecraft Vanilla
const EGGS = {
  bot: {
    id: 15,
    image: "ghcr.io/pterodactyl/yolks:nodejs_18",
    startup: "node {{CMD_RUN}}",
    env: { CMD_RUN: "index.js" },
  },
  minecraft: {
    id: 3,
    image: "ghcr.io/pterodactyl/yolks:java_17",
    startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}",
    env: { SERVER_JARFILE: "server.jar", VANILLA_VERSION: "latest" },
  },
};

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
  let password = "";
  for (let i = 0; i < length; i++) password += chars[Math.floor(Math.random() * chars.length)];
  return password;
}

function generateEmail(username) {
  const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  return username.toLowerCase() + "@" + domains[Math.floor(Math.random() * domains.length)];
}

async function pteroRequest(path, method = "GET", body) {
  const res = await fetch(PTERODACTYL_URL + "/api/application" + path, {
    method,
    headers: {
      "Authorization": "Bearer " + PTERODACTYL_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

router.post("/panel/create", async (req, res) => {
  const { username, jenisPanel, ram, jenisServer = "bot" } = req.body;

  if (!username || !jenisPanel || ram === undefined) {
    return res.status(400).json({ success: false, message: "Input tidak valid." });
  }

  if (PTERODACTYL_API_KEY === "ISI_API_KEY_KAMU_DISINI" || !PTERODACTYL_API_KEY) {
    return res.status(500).json({ success: false, message: "API Key Pterodactyl belum diisi." });
  }

  const password = generatePassword(12);
  const email    = generateEmail(username);

  try {
    // 1. Buat user di Pterodactyl
    const userRes = await pteroRequest("/users", "POST", {
      username, email,
      first_name: username, last_name: "User",
      language: "en", password,
      root_admin: jenisPanel === "admin",
    });

    if (!userRes.ok) {
      let msg = "Gagal membuat akun (kode " + userRes.status + ")";
      if (userRes.status === 422) msg = "Username atau email sudah digunakan. Coba username lain.";
      else if (userRes.status === 403) msg = "API Key tidak punya izin. Gunakan Application API key.";
      else if (userRes.status === 401) msg = "API Key tidak valid atau kadaluarsa.";
      return res.status(400).json({ success: false, message: msg });
    }

    const ua  = userRes.data.attributes;
    const egg = EGGS[jenisServer] || EGGS.bot;

    // 2. Buat server
    const srvRes = await pteroRequest("/servers", "POST", {
      name: username + "-server",
      user: ua.id,
      egg: egg.id,
      docker_image: egg.image,
      startup: egg.startup,
      environment: { ...egg.env },
      limits: { memory: Number(ram), swap: 0, disk: 2048, io: 500, cpu: 100 },
      feature_limits: { databases: 0, backups: 0 },
      deploy: { locations: [1], dedicated_ip: false, port_range: [] },
    });

    if (!srvRes.ok) {
      return res.json({
        success: true,
        username: ua.username, password, email: ua.email, panelType: jenisPanel,
        message: "Akun berhasil dibuat! Server gagal dibuat (kode " + srvRes.status + ") — hubungi admin.",
      });
    }

    return res.json({
      success: true,
      username: ua.username,
      password,
      email: ua.email,
      panelType: jenisPanel,
      serverId: srvRes.data.attributes.identifier,
      serverName: srvRes.data.attributes.name,
      message: "Panel " + jenisPanel + " + server berhasil dibuat!",
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Gagal terhubung ke Pterodactyl: " + err.message });
  }
});

module.exports = router;
