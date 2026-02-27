const CONFIG = {
  whatsappNumber: "5566992410415",
  whatsappMessage:
    "Olá! Vi o Freela Norte (Sinop & região) e quero entender como funciona o Programa de Embaixadores. Ainda tem vagas no lote atual?",
  refreshEveryMs: 25000,
  plans: {
    starter: { total: 12, floor: 2 },
    pro: { total: 18, floor: 3 },
    elite: { total: 6, floor: 1 },
  },
};

function waLink() {
  const n = String(CONFIG.whatsappNumber || "").replace(/\D/g, "");
  const msg = encodeURIComponent(CONFIG.whatsappMessage);
  return `https://wa.me/${n}?text=${msg}`;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function loadState() {
  const key = `fn_scarcity_${getDayKey()}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { key, data: JSON.parse(raw) };
  } catch {}
  return { key, data: null };
}

function saveState(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function computeAvailability(seed) {
  const rng = mulberry32(seed);
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const dayProgress = minutes / (24 * 60);

  const out = {};
  for (const [id, p] of Object.entries(CONFIG.plans)) {
    const expectedFill = 0.45 + rng() * 0.37;
    const fillNow = expectedFill * (0.22 + dayProgress * 0.78);
    const jitter = (rng() - 0.5) * 0.06;
    const fill = clamp(fillNow + jitter, 0.10, 0.92);

    const used = Math.floor(p.total * fill);
    const remaining = clamp(p.total - used, p.floor, p.total);

    out[id] = { remaining, total: p.total };
  }
  return out;
}

function renderAvailability(av) {
  const updated = document.getElementById("scarcity-updated");
  if (updated) updated.textContent = "agora";

  const map = [
    { id: "starter", pill: "slot-starter", bar: "bar-starter" },
    { id: "pro", pill: "slot-pro", bar: "bar-pro" },
    { id: "elite", pill: "slot-elite", bar: "bar-elite" },
  ];

  for (const item of map) {
    const p = av[item.id];
    if (!p) continue;

    const pill = document.getElementById(item.pill);
    const bar = document.getElementById(item.bar);

    const used = p.total - p.remaining;
    const pct = Math.round((used / p.total) * 100);

    if (pill) pill.textContent = `${p.remaining} vagas`;
    if (bar) bar.style.width = `${pct}%`;
  }
}

function tickUpdatedLabel() {
  const el = document.getElementById("scarcity-updated");
  if (!el) return;
  const start = Date.now();
  setInterval(() => {
    const secs = Math.floor((Date.now() - start) / 1000);
    if (secs < 10) el.textContent = "agora";
    else if (secs < 60) el.textContent = `há ${secs}s`;
    else el.textContent = `há ${Math.floor(secs / 60)}min`;
  }, 1000);
}

function wireWhatsApp() {
  const link = waLink();
  document.querySelectorAll(".cta-whatsapp").forEach((a) => {
    a.setAttribute("href", link);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });
}

function setupFAQ() {
  const qs = document.querySelectorAll(".faq__q");
  qs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      qs.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      const icon = btn.querySelector(".faq__i");
      if (icon) icon.textContent = isOpen ? "+" : "×";
    });
  });
  if (qs[0]) qs[0].click();
}

function initScarcity() {
  const day = getDayKey();
  const seedBase =
    day.split("-").reduce((acc, part) => acc + Number(part || 0), 0) + 1337;

  const { key, data } = loadState();

  let state = data;
  if (!state) {
    state = {
      seed: seedBase,
      last: Date.now(),
      av: computeAvailability(seedBase),
    };
    saveState(key, state);
  }

  renderAvailability(state.av);
  tickUpdatedLabel();

  setInterval(() => {
    const next = computeAvailability(state.seed + Math.floor(Date.now() / 60000));

    for (const id of Object.keys(CONFIG.plans)) {
      const prev = state.av[id]?.remaining ?? CONFIG.plans[id].total;
      const now = next[id]?.remaining ?? prev;
      next[id].remaining = Math.min(prev, now);
    }

    state.av = next;
    state.last = Date.now();
    saveState(key, state);
    renderAvailability(state.av);
  }, CONFIG.refreshEveryMs);
}

document.addEventListener("DOMContentLoaded", () => {
  wireWhatsApp();
  setupFAQ();
  initScarcity();
});
