// server.js — Buat Panel Yann (All-in-One, TANPA npm install)
// ============================================================
// Cara pakai di PC/Laptop/VPS:
//   1. Isi PTERODACTYL_API_KEY di bawah dengan Application API key kamu
//   2. Jalankan: node server.js
//   3. Buka:     http://localhost:3000
//
// Cara pakai di Termux (Android):
//   1. pkg install nodejs
//   2. Isi API key, lalu: node server.js
//   3. Buka: http://localhost:3000
//
// Catatan: Butuh Node.js v18 ke atas (fetch sudah built-in)
// ============================================================

const http = require("http");

// ============================
//  KONFIGURASI — EDIT DI SINI
// ============================
const PORT = process.env.PORT || 3000;
const PTERODACTYL_URL     = "https://sanzy.webserverku.biz.id";

// Application API key (ptla...) — BUKAN Client key (ptlc...), sudah diisi
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY || "ptla_wSJufvKqSepXSGQzXrgsf2NWWmuDeBjNy7DdcDYaQDm";

// ICON di atas judul — ganti dengan URL gambar kamu (jpg/png/gif/webp)
// Contoh: "https://i.imgur.com/xxxxx.png"
const ICON_URL = "https://c.termai.cc/i147/VIyol.jpg";

// ============
//  HELPER
// ============
function generatePassword(len = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
  let p = "";
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

function generateEmail(username) {
  const d = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
  return username.toLowerCase() + "@" + d[Math.floor(Math.random() * d.length)];
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

// ============
//  CSS
// ============
const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { min-height:100vh; background:hsl(222,47%,11%); color:hsl(213,31%,91%); font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; display:flex; align-items:center; justify-content:center; padding:20px; }
.card { background:hsl(222,47%,8%); border:1px solid hsl(217,33%,18%); border-radius:12px; padding:32px; width:100%; max-width:440px; box-shadow:0 10px 40px rgba(0,0,0,.5); animation:fadeInUp .5s ease-out; }
@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.header { text-align:center; margin-bottom:28px; }
.icon-wrap { display:inline-block; margin-bottom:14px; }
.icon-wrap img { width:72px; height:72px; border-radius:50%; object-fit:cover; border:2px solid rgba(59,130,246,.3); display:block; }
h1 { font-size:1.5rem; font-weight:700; letter-spacing:.05em; }
.subtitle { color:hsl(215,20%,65%); font-size:.875rem; margin-top:6px; }
.form-group { margin-bottom:18px; }
label { display:block; font-size:.875rem; font-weight:500; margin-bottom:7px; opacity:.9; }
.input-row { display:flex; gap:10px; }
input, select { flex:1; padding:10px 14px; background:hsl(222,47%,11%); border:1px solid hsl(217,33%,22%); border-radius:8px; color:hsl(213,31%,91%); font-size:.875rem; outline:none; transition:border-color .2s; width:100%; }
input:focus, select:focus { border-color:#3b82f6; box-shadow:0 0 0 1px #3b82f6; }
input::placeholder { color:hsl(215,20%,65%); }
select option { background:hsl(222,47%,11%); }
.btn-random { padding:10px 14px; background:#3b82f6; color:white; border:none; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:opacity .2s; flex-shrink:0; }
.btn-random:hover { opacity:.9; }
.btn-random svg { width:16px; height:16px; fill:white; }
.btn-submit { width:100%; padding:12px; background:#3b82f6; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; transition:opacity .2s; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:8px; }
.btn-submit:hover { opacity:.9; }
.btn-submit:disabled { opacity:.6; cursor:not-allowed; }
.result-box { margin-top:22px; background:hsl(222,47%,11%); border:1px solid hsl(217,33%,20%); border-radius:10px; padding:20px; animation:fadeInUp .3s ease-out; }
.result-header { text-align:center; margin-bottom:16px; }
.status-icon { display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:50%; margin-bottom:10px; }
.status-icon.success { background:rgba(34,197,94,.15); border:1px solid rgba(34,197,94,.3); }
.status-icon.error { background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3); }
.status-icon svg { width:24px; height:24px; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; fill:none; }
.status-icon.success svg { stroke:#4ade80; }
.status-icon.error svg { stroke:#f87171; }
.result-header h2 { font-size:1.1rem; font-weight:700; }
.result-header p { color:hsl(215,20%,65%); font-size:.875rem; margin-top:4px; }
.result-list { display:flex; flex-direction:column; gap:9px; margin-bottom:14px; }
.result-item { display:flex; align-items:center; justify-content:space-between; background:hsl(222,47%,8%); border:1px solid hsl(217,33%,18%); border-radius:8px; padding:10px 14px; }
.result-item span { font-size:.875rem; color:hsl(215,20%,75%); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:8px; }
.result-item strong { color:hsl(213,31%,91%); }
.result-item .primary { color:#3b82f6; text-transform:capitalize; }
.btn-copy { font-size:.75rem; padding:5px 10px; border-radius:6px; border:1px solid #3b82f6; color:#3b82f6; background:transparent; cursor:pointer; transition:all .2s; flex-shrink:0; white-space:nowrap; }
.btn-copy:hover { background:#3b82f6; color:white; }
.login-link { text-align:center; font-size:.875rem; color:hsl(215,20%,65%); margin-bottom:14px; }
.login-link a { color:#3b82f6; text-decoration:none; }
.login-link a:hover { text-decoration:underline; }
.btn-close { width:100%; padding:10px; background:hsl(0,63%,55%); color:white; border:none; border-radius:8px; font-size:.875rem; font-weight:500; cursor:pointer; transition:opacity .2s; }
.btn-close:hover { opacity:.9; }
.spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
`;

// ============
//  HTML
// ============
const HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Buat Panel Yann</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon-wrap">
        <img src="${ICON_URL}" alt="Logo" onerror="this.style.display='none'"/>
      </div>
      <h1>Buat Panel Yann</h1>
      <p class="subtitle">By YANN TAMVAN</p>
    </div>

    <form id="panelForm">
      <div class="form-group">
        <label>Username:</label>
        <div class="input-row">
          <input type="text" id="username" placeholder="Masukkan username" required/>
          <button type="button" class="btn-random" onclick="randomUsername()" title="Acak Username">
            <svg viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Pilih Jenis Panel:</label>
        <select id="jenisPanel">
          <option value="user">User Panel</option>
          <option value="admin">Admin Panel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Pilih RAM:</label>
        <select id="ram">
          <option value="1024">1 GB</option>
          <option value="2048">2 GB</option>
          <option value="3072">3 GB</option>
          <option value="4096">4 GB</option>
          <option value="5120">5 GB</option>
          <option value="6144">6 GB</option>
          <option value="7168">7 GB</option>
          <option value="8192">8 GB</option>
          <option value="9216">9 GB</option>
          <option value="0">Unlimited</option>
        </select>
      </div>
      <button type="submit" class="btn-submit" id="submitBtn">Submit</button>
    </form>

    <div id="resultBox"></div>
  </div>

  <script>
    const adjs  = ["cool","dark","fast","smart","epic","nova","ultra","mega","super","pro"];
    const nouns = ["wolf","hawk","lion","bear","fox","eagle","tiger","panda","dragon","phoenix"];

    function randomUsername() {
      const a = adjs[Math.floor(Math.random() * adjs.length)];
      const n = nouns[Math.floor(Math.random() * nouns.length)];
      document.getElementById("username").value = a + n + (Math.floor(Math.random() * 999) + 1);
    }

    async function copyText(text, btn) {
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Tersalin!";
        setTimeout(() => btn.textContent = "Salin", 2000);
      } catch {
        btn.textContent = "Gagal!";
        setTimeout(() => btn.textContent = "Salin", 2000);
      }
    }

    document.getElementById("panelForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      if (!username) return;

      const btn = document.getElementById("submitBtn");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Sedang Membuat...';

      try {
        const res = await fetch("/api/panel/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            jenisPanel: document.getElementById("jenisPanel").value,
            jenisServer: "bot",
            ram: Number(document.getElementById("ram").value),
          }),
        });
        const data = await res.json();
        const box = document.getElementById("resultBox");

        if (data.success) {
          const sidHtml = data.serverId
            ? \`<div class="result-item">
                <span>Server ID: <strong style="font-family:monospace">\${data.serverId}</strong></span>
                <button class="btn-copy" onclick="copyText('\${data.serverId}',this)">Salin</button>
               </div>\`
            : "";

          box.innerHTML = \`
            <div class="result-box">
              <div class="result-header">
                <div class="status-icon success">
                  <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2>Status Pembuatan</h2>
                <p>\${data.message}</p>
              </div>
              <div class="result-list">
                <div class="result-item">
                  <span>Username: <strong>\${data.username}</strong></span>
                  <button class="btn-copy" onclick="copyText('\${data.username}',this)">Salin</button>
                </div>
                <div class="result-item">
                  <span>Password: <strong style="font-family:monospace">\${data.password}</strong></span>
                  <button class="btn-copy" onclick="copyText('\${data.password}',this)">Salin</button>
                </div>
                <div class="result-item">
                  <span>Email: <strong>\${data.email}</strong></span>
                  <button class="btn-copy" onclick="copyText('\${data.email}',this)">Salin</button>
                </div>
                <div class="result-item">
                  <span>Tipe Panel: <strong class="primary">\${data.panelType}</strong></span>
                </div>
                \${sidHtml}
              </div>
              <p class="login-link">Login di: <a href="https://sanzy.webserverku.biz.id" target="_blank">sanzy.webserverku.biz.id</a></p>
              <button class="btn-close" onclick="document.getElementById('resultBox').innerHTML=''">Tutup</button>
            </div>\`;

          document.getElementById("username").value = "";
        } else {
          box.innerHTML = \`
            <div class="result-box">
              <div class="result-header">
                <div class="status-icon error">
                  <svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <h2>Gagal</h2>
                <p>\${data.message}</p>
              </div>
              <button class="btn-close" onclick="document.getElementById('resultBox').innerHTML=''">Tutup</button>
            </div>\`;
        }
      } catch (err) {
        document.getElementById("resultBox").innerHTML = \`
          <div class="result-box">
            <div class="result-header">
              <div class="status-icon error">
                <svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <h2>Error Koneksi</h2>
              <p>\${err.message}</p>
            </div>
            <button class="btn-close" onclick="document.getElementById('resultBox').innerHTML=''">Tutup</button>
          </div>\`;
      } finally {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    });
  </script>
</body>
</html>`;

// ==============
//  HTTP SERVER
// ==============
async function handleRequest(req, res) {
  // Serve halaman utama
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(HTML);
  }

  // API endpoint buat panel
  if (req.method === "POST" && req.url === "/api/panel/create") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", async () => {
      res.setHeader("Content-Type", "application/json");

      if (PTERODACTYL_API_KEY === "ISI_API_KEY_KAMU_DISINI" || !PTERODACTYL_API_KEY) {
        res.writeHead(500);
        return res.end(JSON.stringify({ success: false, message: "API Key belum diisi di server.js!" }));
      }

      let body;
      try { body = JSON.parse(raw); }
      catch {
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: "Body request tidak valid." }));
      }

      const { username, jenisPanel, ram } = body;
      if (!username || !jenisPanel || ram === undefined) {
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: "Input tidak valid." }));
      }

      const password = generatePassword(12);
      const email    = generateEmail(username);

      try {
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
          res.writeHead(400);
          return res.end(JSON.stringify({ success: false, message: msg }));
        }

        const ua = userRes.data.attributes;

        // Buat server
        const srvRes = await pteroRequest("/servers", "POST", {
          name: username + "-server",
          user: ua.id,
          egg: 15,
          docker_image: "ghcr.io/pterodactyl/yolks:nodejs_18",
          startup: "node {{CMD_RUN}}",
          environment: { CMD_RUN: "index.js" },
          limits: { memory: Number(ram), swap: 0, disk: 2048, io: 500, cpu: 100 },
          feature_limits: { databases: 0, backups: 0 },
          deploy: { locations: [1], dedicated_ip: false, port_range: [] },
        });

        if (srvRes.ok) {
          res.writeHead(200);
          return res.end(JSON.stringify({
            success: true,
            username: ua.username,
            password,
            email: ua.email,
            panelType: jenisPanel,
            serverId: srvRes.data.attributes.identifier,
            serverName: srvRes.data.attributes.name,
            message: "Panel " + jenisPanel + " + server berhasil dibuat!",
          }));
        } else {
          res.writeHead(200);
          return res.end(JSON.stringify({
            success: true,
            username: ua.username, password, email: ua.email, panelType: jenisPanel,
            message: "Akun berhasil dibuat! Server gagal dibuat (kode " + srvRes.status + ") — hubungi admin.",
          }));
        }
      } catch (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ success: false, message: "Gagal terhubung ke Pterodactyl: " + err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}

http.createServer(handleRequest).listen(PORT, () => {
  console.log("================================");
  console.log("  Buat Panel Yann — Running!");
  console.log("================================");
  console.log("  Buka  : http://localhost:" + PORT);
  console.log("  Stop  : tekan Ctrl+C");
  console.log("================================");
});
