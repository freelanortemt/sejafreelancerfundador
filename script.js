// ======================
// CONFIG CENTRAL
// ======================
const CONFIG = {
  brandName: "Freela Norte",
  city: "Sinop - MT",
  cityShort: "Sinop",
  whatsappNumber: "5566992410415",

  founderProgramName: "Programa de Fundadores",
  launchWindow: "Lançamento em breve",

  whatsappBaseMessage:
    "Fala! Tudo bem? Quero entrar como fundador do Freela Norte e garantir posição no ranking regional de Sinop. Ainda tem vaga?",

  videoPaths: {
    cliente:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804387/cliente_s89oeu.mp4",
    freelancer:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804382/freelancer_kec6uy.mp4",
  },

  videoCaptions: {
    cliente: "Cliente: buscar freelancers, avaliar perfis, abrir chat e contratar com segurança.",
    freelancer: "Freelancer: perfil + serviços + chat + oportunidades em um fluxo simples e regional.",
  },

  scarcity: {
    storageKey: "freela-norte-scarcity-v3",
    resetAfterMs: 1000 * 60 * 60 * 18,
    minRefreshMs: 14000,
    maxRefreshMs: 30000,
    maxCatchupTicks: 28,
    catchupStepMs: 1000 * 60 * 3,
    manualThrottleMs: 16000,
  },

  plans: [
    { id: "starter", name: "Starter", price: 197, vagas: 12, floor: 0, weight: 1.0 },
    { id: "pro", name: "Pro", price: 497, vagas: 18, floor: 1, weight: 1.5 },
    { id: "elite", name: "Elite", price: 997, vagas: 6, floor: 0, weight: 0.8 },
  ],
};

// ======================
// STATE
// ======================
const state = {
  slots: {},
  trends: {},
  scarcityTimer: null,
  scarcityUpdatedAt: Date.now(),
  lastScarcityEvent: "Sincronizando disponibilidade regional...",
  lastManualIntentAt: 0,
};

let soundEnabled = false;

// ======================
// HELPERS
// ======================
function sanitizeNumber(numStr) {
  const digits = (numStr || "").replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function currency(value) {
  return `R$ ${Number(value).toLocaleString("pt-BR")}`;
}

function getPlan(id) {
  return CONFIG.plans.find((plan) => plan.id === id) || CONFIG.plans[0];
}

function buildWhatsAppLink(plan) {
  const number = sanitizeNumber(CONFIG.whatsappNumber);
  const message =
    `${CONFIG.whatsappBaseMessage}\n\n` +
    `Tenho interesse no plano ${plan.name} (${currency(plan.price)}). ` +
    `Pode me explicar como funciona para garantir a vaga e ativar selo/verificação?`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function storageAvailable() {
  try {
    const key = "__scarcity_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

const hasStorage = storageAvailable();

// ======================
// UI UPDATES
// ======================
function updateBranding() {
  const brandNameEl = document.getElementById("brand-name");
  const brandCityEl = document.getElementById("brand-city");
  const cityPill = document.getElementById("city-pill");
  const launchEl = document.getElementById("launch-window");
  const footerBrand = document.getElementById("footer-brand");
  const footerCity = document.getElementById("footer-city");
  const topbarCity = document.getElementById("topbar-city");
  const kpiCity = document.getElementById("kpi-city");

  if (brandNameEl) brandNameEl.textContent = CONFIG.brandName;
  if (brandCityEl) brandCityEl.textContent = `Marketplace regional • ${CONFIG.city}`;
  if (cityPill) cityPill.textContent = CONFIG.city;
  if (launchEl) launchEl.textContent = CONFIG.launchWindow;
  if (footerBrand) footerBrand.textContent = CONFIG.brandName;
  if (footerCity) footerCity.textContent = CONFIG.city;
  if (topbarCity) topbarCity.textContent = `${CONFIG.cityShort}/MT:`;
  if (kpiCity) kpiCity.textContent = CONFIG.cityShort;
}

function updatePrices() {
  CONFIG.plans.forEach((plan) => {
    document.querySelectorAll(`[data-plan-price="${plan.id}"]`).forEach((el) => {
      el.textContent = currency(plan.price);
    });
  });
}

function updateSlotsUI() {
  let totalAvailable = 0;
  const totalCapacity = CONFIG.plans.reduce((sum, plan) => sum + plan.vagas, 0);

  CONFIG.plans.forEach((plan) => {
    const available = clamp(
      Number(state.slots[plan.id] ?? plan.vagas),
      plan.floor ?? 0,
      plan.vagas
    );
    const lowThreshold = Math.max(1, Math.ceil(plan.vagas * 0.3));
    const ratio = plan.vagas > 0 ? available / plan.vagas : 0;
    const meterWidth = available === 0 ? 0 : Math.max(8, Math.round(ratio * 100));
    const label = available > 0 ? `${available} vaga${available > 1 ? "s" : ""}` : "Esgotado";
    const trend = state.trends[plan.id] || "stable";
    const trendLabel =
      trend === "down" ? "Alta demanda" : trend === "up" ? "Vaga liberada" : "Estável";

    totalAvailable += available;

    document.querySelectorAll(`[data-slot="${plan.id}"]`).forEach((el) => {
      el.textContent = label;
      el.classList.toggle("slot-out", available === 0);
    });

    document.querySelectorAll(`[data-scarcity-row="${plan.id}"]`).forEach((row) => {
      row.classList.toggle("slot-row-low", available > 0 && available <= lowThreshold);
      row.classList.toggle("slot-row-out", available === 0);
    });

    document.querySelectorAll(`[data-meter="${plan.id}"]`).forEach((meter) => {
      meter.style.width = `${meterWidth}%`;
    });

    document.querySelectorAll(`[data-trend="${plan.id}"]`).forEach((el) => {
      el.textContent = trendLabel;
      el.classList.toggle("is-up", trend === "up");
      el.classList.toggle("is-down", trend === "down");
      el.classList.toggle("is-stable", trend === "stable");
    });
  });

  const lotStatus = document.getElementById("lot-status");
  if (lotStatus) {
    const ratio = totalCapacity > 0 ? totalAvailable / totalCapacity : 0;
    let text = "Ativo";

    if (totalAvailable <= 0) text = "Encerrado";
    else if (ratio <= 0.24) text = "Últimas vagas";
    else if (ratio <= 0.5) text = "Aquecido";

    lotStatus.textContent = text;
  }
}

function updateScarcityFeed() {
  const feed = document.getElementById("scarcity-feed");
  if (feed) feed.textContent = state.lastScarcityEvent;
}

// ======================
// SCARCITY ENGINE
// ======================
function buildDefaultSnapshot() {
  const slots = {};
  const trends = {};

  CONFIG.plans.forEach((plan) => {
    const baseDrop = Math.max(1, Math.round(plan.vagas * (0.18 + Math.random() * 0.2)));
    slots[plan.id] = clamp(plan.vagas - baseDrop, plan.floor ?? 0, plan.vagas);
    trends[plan.id] = "stable";
  });

  return {
    slots,
    trends,
    updatedAt: Date.now(),
    lastEvent: `Painel atualizado às ${formatTime(Date.now())}.`,
  };
}

function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== "object") return null;

  const slots = {};
  const trends = {};

  for (const plan of CONFIG.plans) {
    const rawSlot = Number(raw.slots?.[plan.id]);
    if (!Number.isFinite(rawSlot)) return null;
    slots[plan.id] = clamp(Math.round(rawSlot), plan.floor ?? 0, plan.vagas);

    const rawTrend = raw.trends?.[plan.id];
    trends[plan.id] = rawTrend === "up" || rawTrend === "down" ? rawTrend : "stable";
  }

  const updatedAt = Number(raw.updatedAt);
  const normalizedUpdatedAt = Number.isFinite(updatedAt) ? updatedAt : Date.now();

  return {
    slots,
    trends,
    updatedAt: normalizedUpdatedAt,
    lastEvent:
      typeof raw.lastEvent === "string" && raw.lastEvent.trim().length > 0
        ? raw.lastEvent
        : `Painel atualizado às ${formatTime(normalizedUpdatedAt)}.`,
  };
}

function persistScarcitySnapshot() {
  if (!hasStorage) return;

  const snapshot = {
    slots: state.slots,
    trends: state.trends,
    updatedAt: state.scarcityUpdatedAt,
    lastEvent: state.lastScarcityEvent,
  };

  try {
    localStorage.setItem(CONFIG.scarcity.storageKey, JSON.stringify(snapshot));
  } catch (error) {
    // Silencioso: armazenamento pode estar indisponível.
  }
}

function loadScarcitySnapshot() {
  if (!hasStorage) return buildDefaultSnapshot();

  try {
    const raw = localStorage.getItem(CONFIG.scarcity.storageKey);
    if (!raw) return buildDefaultSnapshot();

    const parsed = JSON.parse(raw);
    const snapshot = normalizeSnapshot(parsed);
    if (!snapshot) return buildDefaultSnapshot();

    const isExpired = Date.now() - snapshot.updatedAt > CONFIG.scarcity.resetAfterMs;
    if (isExpired) return buildDefaultSnapshot();

    return snapshot;
  } catch (error) {
    return buildDefaultSnapshot();
  }
}

function setAllTrends(nextTrend, focusPlanId) {
  CONFIG.plans.forEach((plan) => {
    state.trends[plan.id] = plan.id === focusPlanId ? nextTrend : "stable";
  });
}

function pickPlanIdByWeight(mode) {
  const pool = [];

  CONFIG.plans.forEach((plan) => {
    const available = state.slots[plan.id] ?? plan.vagas;
    const hasRoom = available < plan.vagas;
    const canConsume = available > (plan.floor ?? 0);
    const ratio = plan.vagas > 0 ? available / plan.vagas : 0;
    const scarcityBoost = 1 + (1 - ratio) * 0.7;
    const releaseBoost = 1 + ratio * 0.5;

    if (mode === "reserve" && canConsume) {
      pool.push({ id: plan.id, weight: (plan.weight || 1) * scarcityBoost });
    }

    if (mode === "release" && hasRoom) {
      pool.push({ id: plan.id, weight: (plan.weight || 1) * releaseBoost });
    }
  });

  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let marker = Math.random() * totalWeight;

  for (const entry of pool) {
    marker -= entry.weight;
    if (marker <= 0) return entry.id;
  }

  return pool[pool.length - 1].id;
}

function buildScarcityMessage(type, plan, source, timestamp) {
  const time = formatTime(timestamp);

  if (source === "manual") {
    return `Nova intenção iniciada no plano ${plan.name}. Janela de confirmação aberta às ${time}.`;
  }

  if (type === "reserve") {
    return `Nova pré-reserva registrada no plano ${plan.name}. Atualizado às ${time}.`;
  }

  if (type === "release") {
    return `Uma pré-reserva expirou no plano ${plan.name} e a vaga retornou. Atualizado às ${time}.`;
  }

  return `Demanda monitorada sem alteração relevante nesta janela. Atualizado às ${time}.`;
}

function applyScarcityMutation({ silent = false, source = "auto" } = {}) {
  const now = Date.now();
  const floorTotal = CONFIG.plans.reduce((sum, plan) => sum + (plan.floor ?? 0), 0);
  const currentTotal = CONFIG.plans.reduce(
    (sum, plan) => sum + (state.slots[plan.id] ?? plan.vagas),
    0
  );

  const forceRelease = currentTotal <= floorTotal;
  let action = "stable";
  let targetPlanId = null;

  if (!forceRelease && Math.random() < 0.68) {
    targetPlanId = pickPlanIdByWeight("reserve");
    if (targetPlanId) {
      const plan = getPlan(targetPlanId);
      if (state.slots[targetPlanId] > (plan.floor ?? 0)) {
        state.slots[targetPlanId] -= 1;
        action = "reserve";
      }
    }
  }

  if (action === "stable" && Math.random() < 0.48) {
    targetPlanId = pickPlanIdByWeight("release");
    if (targetPlanId) {
      const plan = getPlan(targetPlanId);
      if (state.slots[targetPlanId] < plan.vagas) {
        state.slots[targetPlanId] += 1;
        action = "release";
      }
    }
  }

  if (!targetPlanId) {
    targetPlanId = CONFIG.plans[1]?.id || CONFIG.plans[0].id;
  }

  const plan = getPlan(targetPlanId);
  const nextTrend = action === "reserve" ? "down" : action === "release" ? "up" : "stable";

  setAllTrends(nextTrend, targetPlanId);
  state.lastScarcityEvent = buildScarcityMessage(action, plan, source, now);
  state.scarcityUpdatedAt = now;

  if (!silent) {
    updateSlotsUI();
    updateScarcityFeed();
  }

  persistScarcitySnapshot();
}

function registerManualIntent(planId) {
  const now = Date.now();
  if (now - state.lastManualIntentAt < CONFIG.scarcity.manualThrottleMs) return;

  const plan = getPlan(planId);
  const current = state.slots[plan.id] ?? plan.vagas;
  const floor = plan.floor ?? 0;

  if (current <= floor) return;

  state.slots[plan.id] = current - 1;
  setAllTrends("down", plan.id);
  state.lastScarcityEvent = buildScarcityMessage("reserve", plan, "manual", now);
  state.scarcityUpdatedAt = now;
  state.lastManualIntentAt = now;

  updateSlotsUI();
  updateScarcityFeed();
  persistScarcitySnapshot();
}

function scheduleScarcityTick() {
  if (state.scarcityTimer) clearTimeout(state.scarcityTimer);

  const delay = randomInt(CONFIG.scarcity.minRefreshMs, CONFIG.scarcity.maxRefreshMs);
  state.scarcityTimer = window.setTimeout(() => {
    applyScarcityMutation({ source: "timer" });
    scheduleScarcityTick();
  }, delay);
}

function hydrateScarcityState() {
  const snapshot = loadScarcitySnapshot();

  state.slots = { ...snapshot.slots };
  state.trends = { ...snapshot.trends };
  state.lastScarcityEvent = snapshot.lastEvent;
  state.scarcityUpdatedAt = snapshot.updatedAt;

  const elapsed = Math.max(0, Date.now() - state.scarcityUpdatedAt);
  const catchupTicks = Math.min(
    CONFIG.scarcity.maxCatchupTicks,
    Math.floor(elapsed / CONFIG.scarcity.catchupStepMs)
  );

  for (let i = 0; i < catchupTicks; i += 1) {
    applyScarcityMutation({ silent: true, source: "catchup" });
  }

  persistScarcitySnapshot();
}

function setupScarcityVisibilitySync() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.scarcityTimer) clearTimeout(state.scarcityTimer);
      return;
    }

    applyScarcityMutation({ source: "resume" });
    scheduleScarcityTick();
  });
}

// ======================
// VIDEO DEMO
// ======================
function updateVideos() {
  const phoneVideo = document.getElementById("demo-phone-video");
  const caption = document.getElementById("demo-video-caption");
  if (!phoneVideo) return;

  phoneVideo.src = CONFIG.videoPaths.cliente;
  phoneVideo.muted = true;
  phoneVideo.volume = 1;
  phoneVideo.load();

  if (caption) caption.textContent = CONFIG.videoCaptions.cliente || "";
}

function setupVideoTabs() {
  const phoneVideo = document.getElementById("demo-phone-video");
  const caption = document.getElementById("demo-video-caption");
  const tabs = document.querySelectorAll(".video-tab");

  if (!phoneVideo || tabs.length === 0) return;

  function setActive(key) {
    tabs.forEach((btn) => {
      const isActive = btn.dataset.video === key;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const nextSrc = CONFIG.videoPaths[key];
    if (!nextSrc) return;

    if (phoneVideo.getAttribute("src") !== nextSrc) {
      phoneVideo.src = nextSrc;
      phoneVideo.muted = !soundEnabled;
      phoneVideo.load();
      phoneVideo.play().catch(() => {});
    }

    if (caption) caption.textContent = CONFIG.videoCaptions[key] || "";
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => setActive(btn.dataset.video));
  });

  setActive("cliente");
}

function setupSoundToggle() {
  const btn = document.querySelector(".sound-toggle");
  const phoneVideo = document.getElementById("demo-phone-video");
  if (!btn || !phoneVideo) return;

  function updateUI() {
    btn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    btn.textContent = soundEnabled ? "Som ativado" : "Ativar som";
  }

  btn.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    phoneVideo.muted = !soundEnabled;
    if (soundEnabled) phoneVideo.volume = 1;

    await phoneVideo.play().catch(() => {});
    updateUI();
  });

  phoneVideo.addEventListener("click", () => btn.click());
  updateUI();
}

// ======================
// CTA WHATSAPP
// ======================
function wireCTAs() {
  const buttons = document.querySelectorAll(".cta-whatsapp");

  buttons.forEach((btn) => {
    const planId = btn.dataset.plan || "pro";
    const plan = getPlan(planId);

    btn.href = buildWhatsAppLink(plan);
    btn.target = "_blank";
    btn.rel = "noopener";

    btn.addEventListener("click", () => {
      registerManualIntent(plan.id);
    });
  });
}

// ======================
// ACCORDION FAQ
// ======================
function setupAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (items.length === 0) return;

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const isOpen = panel.classList.contains("open");

      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("open"));
      document
        .querySelectorAll(".accordion-item")
        .forEach((b) => b.setAttribute("aria-expanded", "false"));
      document
        .querySelectorAll(".accordion-item .icon")
        .forEach((icon) => (icon.style.transform = "rotate(0deg)"));

      if (!isOpen) {
        panel.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        const icon = btn.querySelector(".icon");
        if (icon) icon.style.transform = "rotate(45deg)";
      }
    });
  });

  items[0].click();
}

// ======================
// INIT
// ======================
function init() {
  updateBranding();
  updatePrices();

  hydrateScarcityState();
  updateSlotsUI();
  updateScarcityFeed();

  updateVideos();
  setupVideoTabs();
  setupSoundToggle();

  wireCTAs();
  setupAccordion();

  scheduleScarcityTick();
  setupScarcityVisibilitySync();
}

document.addEventListener("DOMContentLoaded", init);
