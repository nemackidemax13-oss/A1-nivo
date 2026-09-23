
const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, "data", "users.json");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "public"), {
  maxAge: "1h",
  etag: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || "PROMENI-OVAJ-SESSION-SECRET-PRE-OBJAVE",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 10
  }
}));

const MATERIALS = {
  lekcija1: {
    title: "Lekcija 1",
    subtitle: "Predstavljanje, zamenice i W-pitanja",
    icon: "1️⃣",
    file: "indexprva.html"
  },
  lekcija2: {
    title: "Lekcija 2",
    subtitle: "Wie geht’s?, heißen, brojevi, sein i haben",
    icon: "2️⃣",
    file: "index.html"
  },
  lekcija3: {
    title: "Lekcija 3",
    subtitle: "mein/meine, ein/eine, kein/keine",
    icon: "3️⃣",
    file: "indexlekcija3.html"
  },
  lekcija4: {
    title: "Lekcija 4",
    subtitle: "Essen & Trinken, brauchen, članovi i cene",
    icon: "4️⃣",
    file: "index4 lekcija.html"
  },
  lekcija5: {
    title: "Lekcija 5",
    subtitle: "Pridevi, hobi, veliki brojevi i vreme",
    icon: "5️⃣",
    file: "index5lekcija.html"
  },
  lekcija6: {
    title: "Lekcija 6",
    subtitle: "Modalni i razdvojivi glagoli, vreme, telo",
    icon: "6️⃣",
    file: "index6lekcija.html"
  },
  lekcija7: {
    title: "Lekcija 7",
    subtitle: "Akuzativ, Futur I, Perfekt, zamenice i denn",
    icon: "7️⃣",
    file: "index7lekcija_mobile_fullscreen.html"
  },
  brojevi: {
    title: "Brojevi",
    subtitle: "0–20, 20–100 i 100–1000",
    icon: "🔢",
    file: "indexbrojevi_mobile_fullscreen.html"
  },
  dani: {
    title: "Dani i am/um",
    subtitle: "Dani, vreme i von–bis",
    icon: "📅",
    file: "indexdaniamu.html"
  },
  sat: {
    title: "Vreme / sat",
    subtitle: "Privatno i oficijalno vreme",
    icon: "🕐",
    file: "indexsat.html"
  },
  prezent: {
    title: "Präsens",
    subtitle: "Potvrdne i upitne rečenice",
    icon: "✍️",
    file: "DE-MAX_A1_Prezent_potvrdne_upitne.html"
  },
  wpitanja: {
    title: "W-pitanja",
    subtitle: "Prevod i sastavljanje pitanja",
    icon: "❓",
    file: "DE-MAX_A1_W-pitanja_prevod_i_sastav.html"
  },
  razdvojivi: {
    title: "Razdvojivi glagoli",
    subtitle: "A1 rečenice i vežbanje",
    icon: "🧩",
    file: "De-Max_A1_Razdvojivi_Glagoli.html"
  },
  spelovanje: {
    title: "Spelovanje",
    subtitle: "Prezime i nemački alfabet",
    icon: "🔤",
    file: "De-Max_Spelovanje_Prezimena_A1.html"
  },
  zavrsni: {
    title: "Završni A1 test",
    subtitle: "Lekcije 1–7 • automatsko bodovanje",
    icon: "🏆",
    file: "zavrsni-test-a1.html"
  }
};

const RAW_BASE = "https://raw.githubusercontent.com/nemackidemax13-oss/A1-nivo/main/";
const htmlCache = new Map();

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")); }
  catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}
function hashPassword(password, saltHex) {
  return crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64, {N:16384, r:8, p:1}).toString("hex");
}
function makePassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, hash: hashPassword(password, salt) };
}
function safeEqualHex(a, b) {
  try {
    const A = Buffer.from(a, "hex"), B = Buffer.from(b, "hex");
    return A.length === B.length && crypto.timingSafeEqual(A, B);
  } catch { return false; }
}
function esc(s="") {
  return String(s).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  if (req.session.user.role !== "admin") return res.status(403).send("Nemate administratorski pristup.");
  next();
}
function layout(title, body, extraHead="") {
  return `<!doctype html><html lang="sr"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="/static/style.css">${extraHead}</head><body>${body}</body></html>`;
}
function loginPage(error="") {
  return layout("DE-MAX A1 – Prijava", `
  <div class="top-accent"></div>
  <div class="login-page"><div class="login-card">
    <div class="login-top">
      <img src="/static/demax-logo.jpg" alt="DE-MAX">
      <h1>DE-MAX A1</h1>
      <p>Zaštićeni portal za učenike</p>
    </div>
    <div class="login-body">
      ${error ? `<div class="error">${esc(error)}</div>` : ""}
      <form method="post" action="/login">
        <label>Korisničko ime</label>
        <input name="username" autocomplete="username" required placeholder="Unesite korisničko ime">
        <label>Lozinka</label>
        <input type="password" name="password" autocomplete="current-password" required placeholder="Unesite lozinku">
        <button class="btn btn-primary" type="submit">PRIJAVI SE</button>
      </form>
      <p class="small" style="text-align:center;margin-top:16px">DE-MAX • A1 nemački jezik • pristup samo za učenike</p>
    </div>
  </div></div>`);
}
function card(slug, extraClass="") {
  const m = MATERIALS[slug];
  return `<a class="card ${extraClass}" href="/materijal/${encodeURIComponent(slug)}">
    <div><div class="icon">${m.icon}</div><h3>${esc(m.title)}</h3><p>${esc(m.subtitle)}</p></div>
    <div class="arrow">→</div></a>`;
}
function dashboardPage(user) {
  const adminLink = user.role === "admin" ? `<a class="nav" href="/admin"><b>⚙️</b><span>Admin</span></a>` : `<span class="nav"><b>ℹ️</b><span>Info</span></span>`;
  return layout("DE-MAX A1", `
  <div class="top-accent"></div>
  <div class="shell">
    <header class="hero">
      <div class="brand"><img src="/static/demax-logo.jpg" alt="DE-MAX"><div><h1>DE-MAX A1</h1><p>Učenje nemačkog jezika 24/7</p></div></div>
      <div class="userrow"><div class="hello">Dobro došli<strong>${esc(user.name || user.username)}</strong></div><a class="logout" href="/logout">Odjava</a></div>
    </header>
    <main class="content">
      <div class="notice"><b>Privatan pristup.</b> Linkovi materijala rade samo kada je učenik prijavljen na svoj nalog.</div>

      <div class="section-title"><h2>Lekcije A1</h2><span>1–7</span></div>
      <div class="grid">
        ${card("lekcija1")}${card("lekcija2","gold")}${card("lekcija3","dark")}${card("lekcija4","gold")}
        ${card("lekcija5")}${card("lekcija6","dark")}${card("lekcija7","gold")}
      </div>

      <div class="section-title"><h2>Vežbe</h2><span>samostalni rad</span></div>
      <div class="grid">
        ${card("brojevi")}${card("dani","gold")}${card("sat","dark")}${card("spelovanje","gold")}
        ${card("prezent")}${card("wpitanja","dark")}${card("razdvojivi","gold")}
        ${card("zavrsni","wide")}
      </div>
    </main>
    <nav class="bottom">
      <a class="nav active" href="/"><b>🏠</b><span>Početna</span></a>
      <a class="nav" href="/materijal/zavrsni"><b>✅</b><span>Test</span></a>
      ${adminLink}
    </nav>
  </div>`);
}
function adminPage(users, msg="") {
  const rows = users.map(u => `
    <tr>
      <td><b>${esc(u.username)}</b><div class="small">${esc(u.name || "")}</div></td>
      <td>${esc(u.role)}</td>
      <td>${u.active ? "Aktivan" : "Isključen"}<div class="small">${u.lastLogin ? esc(u.lastLogin) : "Nije se prijavio"}</div></td>
      <td>
        ${u.username === "admin" ? "" : `
        <form method="post" action="/admin/toggle" style="display:inline">
          <input type="hidden" name="id" value="${u.id}">
          <button class="${u.active ? "danger" : "ok"}" type="submit">${u.active ? "Isključi" : "Uključi"}</button>
        </form>`}
      </td>
    </tr>`).join("");
  return layout("DE-MAX Admin", `
  <div class="top-accent"></div>
  <div class="shell">
    <header class="hero">
      <div class="brand"><img src="/static/demax-logo.jpg" alt="DE-MAX"><div><h1>Admin panel</h1><p>Upravljanje nalozima učenika</p></div></div>
      <div class="userrow"><div class="hello">DE-MAX<strong>Učenici</strong></div><a class="logout" href="/">Portal</a></div>
    </header>
    <main class="content">
      ${msg ? `<div class="notice">${esc(msg)}</div>` : ""}
      <div class="admin-box">
        <h2>Dodaj učenika</h2>
        <form method="post" action="/admin/add" class="inline-form">
          <div><label>Ime i prezime</label><input name="name" required></div>
          <div><label>Korisničko ime</label><input name="username" required pattern="[A-Za-z0-9._-]{3,30}"></div>
          <div class="full"><label>Početna lozinka</label><input name="password" type="text" minlength="8" required></div>
          <div class="full"><button class="btn btn-primary" type="submit">DODAJ UČENIKA</button></div>
        </form>
      </div>
      <div class="admin-box">
        <h2>Nalozi (${users.length})</h2>
        <div style="overflow:auto"><table class="admin-table"><thead><tr><th>Učenik</th><th>Uloga</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      <div class="admin-box">
        <h2>Promeni lozinku učeniku</h2>
        <form method="post" action="/admin/password" class="inline-form">
          <div><label>Korisničko ime</label><input name="username" required></div>
          <div><label>Nova lozinka</label><input name="password" minlength="8" required></div>
          <div class="full"><button class="btn btn-secondary" type="submit">PROMENI LOZINKU</button></div>
        </form>
      </div>
    </main>
    <nav class="bottom">
      <a class="nav" href="/"><b>🏠</b><span>Portal</span></a>
      <span class="nav active"><b>👥</b><span>Učenici</span></span>
      <a class="nav" href="/logout"><b>🚪</b><span>Odjava</span></a>
    </nav>
  </div>`);
}

app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.send(loginPage(req.query.error || ""));
});

app.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const users = readUsers();
  const user = users.find(u => String(u.username).toLowerCase() === username);
  if (!user || !user.active) return res.status(401).send(loginPage("Pogrešno korisničko ime ili nalog nije aktivan."));
  const actual = hashPassword(password, user.salt);
  if (!safeEqualHex(actual, user.hash)) return res.status(401).send(loginPage("Pogrešna lozinka."));
  user.lastLogin = new Date().toISOString();
  writeUsers(users);
  req.session.user = { id:user.id, username:user.username, name:user.name, role:user.role };
  res.redirect("/");
});

app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/login")));
app.get("/", requireAuth, (req, res) => res.send(dashboardPage(req.session.user)));

app.get("/materijal/:slug", requireAuth, async (req, res) => {
  const slug = req.params.slug;
  const item = MATERIALS[slug];
  if (!item) return res.status(404).send("Materijal nije pronađen.");
  try {
    let html, cached = htmlCache.get(slug);
    if (cached && Date.now() - cached.time < 10 * 60 * 1000) html = cached.html;
    else {
      const url = RAW_BASE + item.file.split("/").map(encodeURIComponent).join("/");
      const response = await fetch(url, { headers: { "User-Agent":"DE-MAX-Portal/1.0" } });
      if (!response.ok) throw new Error("GitHub status " + response.status);
      html = await response.text();
      htmlCache.set(slug, { time:Date.now(), html });
    }

    // Keep the original exercise intact, but add a protected-portal return button.
    const injected = `
      <style>
      #demaxPortalBack{position:fixed;z-index:2147483647;left:10px;top:10px;background:#151922;color:#fff;
      border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:9px 12px;text-decoration:none;
      font:800 12px system-ui,-apple-system,Segoe UI,Roboto,Arial;box-shadow:0 6px 18px rgba(0,0,0,.25)}
      </style><a id="demaxPortalBack" href="/">← DE-MAX portal</a>`;
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, injected + "</body>");
    else html += injected;

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.type("html").send(html);
  } catch (e) {
    res.status(502).send(layout("Greška", `<div class="login-page"><div class="login-card"><div class="login-body">
      <div class="error">Materijal trenutno nije moguće učitati.</div>
      <a class="btn btn-secondary" style="display:block;text-align:center" href="/">Nazad na portal</a>
    </div></div></div>`));
  }
});

app.get("/admin", requireAdmin, (req, res) => res.send(adminPage(readUsers(), req.query.msg || "")));

app.post("/admin/add", requireAdmin, (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username) || password.length < 8)
    return res.redirect("/admin?msg=" + encodeURIComponent("Proverite korisničko ime i lozinku."));
  const users = readUsers();
  if (users.some(u => String(u.username).toLowerCase() === username))
    return res.redirect("/admin?msg=" + encodeURIComponent("To korisničko ime već postoji."));
  const p = makePassword(password);
  users.push({
    id: Math.max(0, ...users.map(u => Number(u.id)||0)) + 1,
    username, name, role:"student", active:true, salt:p.salt, hash:p.hash, lastLogin:null
  });
  writeUsers(users);
  res.redirect("/admin?msg=" + encodeURIComponent("Učenik je dodat."));
});

app.post("/admin/toggle", requireAdmin, (req, res) => {
  const id = Number(req.body.id);
  const users = readUsers();
  const u = users.find(x => Number(x.id) === id && x.username !== "admin");
  if (u) u.active = !u.active;
  writeUsers(users);
  res.redirect("/admin");
});

app.post("/admin/password", requireAdmin, (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (password.length < 8) return res.redirect("/admin?msg=" + encodeURIComponent("Lozinka mora imati najmanje 8 znakova."));
  const users = readUsers();
  const u = users.find(x => String(x.username).toLowerCase() === username);
  if (!u) return res.redirect("/admin?msg=" + encodeURIComponent("Korisnik nije pronađen."));
  const p = makePassword(password);
  u.salt = p.salt; u.hash = p.hash;
  writeUsers(users);
  res.redirect("/admin?msg=" + encodeURIComponent("Lozinka je promenjena."));
});

app.use((req, res) => res.status(404).send("Stranica nije pronađena."));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DE-MAX A1 portal radi na portu ${PORT}`);
});
