// ======================
// CONFIG (AJUSTE AQUI)
// ======================
const CONFIG = {
  brandName: "Freela Norte",
  cityLabel: "Sinop e região",
  cityShort: "Sinop e região",
  whatsappNumber: "5566992410415",

  // ✅ Escassez premium real (defina uma data/horário do encerramento do lote)
  // Formato ISO: "2026-03-05T23:59:59-04:00"
  lotDeadlineISO: "2026-03-05T23:59:59-04:00",

  // ✅ Mensagem WhatsApp: profissional, generalista, sem empurrar plano
  whatsappBaseMessage:
    "Olá! Tenho interesse no Programa de Embaixadores do Freela Norte (Sinop e região). Ainda tem vagas no lote atual? Como funciona para confirmar e ativar a verificação?",

  // Vídeos
  videoPaths: {
    cliente:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804387/cliente_s89oeu.mp4",
    freelancer:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804382/freelancer_kec6uy.mp4",
  },

  videoCaptions: {
    cliente: "Cliente: encontra profissionais, vê reputação e chama no chat.",
    freelancer: "Freelancer: perfil, serviços, chat e oportunidades."
  },

  // ✅ Vagas: atualize manualmente quando vender (isso é o mais profissional e real)
  plans: [
    { id: "starter", name: "Starter", price: 197, vagas_total: 12, vagas_restantes: 12 },
    { id: "pro", name: "Pro", price: 497, vagas_total: 18, vagas_restantes: 18 },
    { id: "elite", name: "Elite", price: 997, vagas_total: 6, vagas_restantes: 6 },
  ],
};

// ======================
// STATE
// ======================
const state = {
  soundEnabled: false,
};

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDeadlineShort(date) {
  // Ex: "05/03 23:59"
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const pad = (n) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

// ======================
// WHATSAPP LINK (generalista)
// ======================
function buildWhatsAppLink(extra = "") {
  const number = sanitizeNumber(CONFIG.whatsappNumber);
  const base = CONFIG.whatsappBaseMessage.trim();
  const msg = extra ? `${base}\n\n${extra}` : base;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

// ======================
// UI UPDATES
// ======================
function updateBranding() {
  const brandNameEl = document.getElementById("brand-name");
  const brandCityEl = document.getElementById("brand-city");
  const cityPill = document.getElementById("city-pill");

  const footerBrand = document.getElementById("footer-brand");
  const footerCity = document.getElementById("footer-city");
  const topbarCity = document.getElementById("topbar-city");

  if (brandNameEl) brandNameEl.textContent = CONFIG.brandName;
  if (brandCityEl) brandCityEl.textContent = `Embaixadores • ${CONFIG.cityLabel}`;
  if (cityPill) cityPill.textContent = CONFIG.cityLabel;

  if (footerBrand) footerBrand.textContent = CONFIG.brandName;
  if (footerCity) footerCity.textContent = CONFIG.cityLabel;

  if (topbarCity) topbarCity.textContent = `${CONFIG.cityShort}:`;
}

function updatePrices() {
  CONFIG.plans.forEach((plan) => {
    document.querySelectorAll(`[data-plan-price="${plan.id}"]`).forEach((el) => {
      el.textContent = currency(plan.price);
    });
  });
}

function computeLotStats() {
  const totals = CONFIG.plans.reduce(
    (acc, p) => {
      acc.total += Math.max(0, Number(p.vagas_total || 0));
      acc.remaining += Math.max(0, Number(p.vagas_restantes || 0));
      return acc;
    },
    { total: 0, remaining: 0 }
  );

  const used = Math.max(0, totals.total - totals.remaining);
  const pct = totals.total > 0 ? (used / totals.total) * 100 : 0;

  return {
    total: totals.total,
    remaining: totals.remaining,
    used,
    percent: clamp(pct, 0, 100),
  };
}

function updateSlotsProgressRing() {
  const { total, remaining, percent } = computeLotStats();

  // total remaining
  const lotRemainingEl = document.getElementById("lot-remaining");
  if (lotRemainingEl) lotRemainingEl.textContent = `${remaining}/${total}`;

  // badge status
  const lotStatus = document.getElementById("lot-status");
  if (lotStatus) lotStatus.textContent = remaining > 0 ? "Ativo" : "Encerrado";

  // percent text
  const pctEl = document.getElementById("lot-percent");
  if (pctEl) pctEl.textContent = `${Math.round(percent)}%`;

  // ring stroke
  const ringBar = document.querySelector(".ring__bar");
  if (ringBar) {
    const C = 2 * Math.PI * 46; // r=46 -> aprox 289.027
    const offset = C * (1 - percent / 100);
    ringBar.style.strokeDasharray = String(C);
    ringBar.style.strokeDashoffset = String(offset);
  }

  // per-plan label + progress
  CONFIG.plans.forEach((plan) => {
    const restantes = Math.max(0, Number(plan.vagas_restantes || 0));
    const totalPlan = Math.max(1, Number(plan.vagas_total || 1));
    const usedPlan = totalPlan - restantes;
    const percentPlan = clamp((usedPlan / totalPlan) * 100, 0, 100);

    const label = restantes > 0 ? `${restantes} vaga${restantes > 1 ? "s" : ""}` : "Esgotado";

    document.querySelectorAll(`[data-slot="${plan.id}"]`).forEach((el) => {
      el.textContent = label;
      if (restantes === 0) el.classList.add("slot-out");
    });

    document.querySelectorAll(`[data-progress="${plan.id}"]`).forEach((bar) => {
      bar.style.width = `${percentPlan}%`;
    });
  });
}

function updateDeadlineUI() {
  const deadline = new Date(CONFIG.lotDeadlineISO);
  const now = new Date();
  const ms = deadline.getTime() - now.getTime();

  const deadlineInline = document.getElementById("deadline-inline");
  const deadlineCompact = document.getElementById("deadline-compact");
  const lotDeadline = document.getElementById("lot-deadline");
  const mobileDeadline = document.getElementById("mobile-deadline");

  // se deadline inválido
  if (Number.isNaN(deadline.getTime())) {
    const t = "em breve";
    if (deadlineInline) deadlineInline.textContent = t;
    if (deadlineCompact) deadlineCompact.textContent = t;
    if (lotDeadline) lotDeadline.textContent = t;
    if (mobileDeadline) mobileDeadline.textContent = `Lote: ${t}`;
    return;
  }

  // formato curto fixo
  const fixed = formatDeadlineShort(deadline);

  // countdown
  const countdown = ms > 0 ? formatCountdown(ms) : "encerrado";
  const txt = ms > 0 ? `${countdown} (até ${fixed})` : `encerrado (${fixed})`;

  if (deadlineInline) deadlineInline.textContent = fixed;
  if (deadlineCompact) deadlineCompact.textContent = txt;
  if (lotDeadline) lotDeadline.textContent = txt;
  if (mobileDeadline) mobileDeadline.textContent = `Lote: ${ms > 0 ? countdown : "encerrado"}`;
}

// ======================
// VIDEO
// ======================
function initVideo() {
  const phoneVideo = document.getElementById("demo-phone-video");
  const caption = document.getElementById("demo-video-caption");
  if (!phoneVideo) return;

  phoneVideo.src = CONFIG.videoPaths.cliente;
  phoneVideo.muted = true;
  phoneVideo.volume = 1.0;
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
      phoneVideo.muted = !state.soundEnabled;
      phoneVideo.load();
      phoneVideo.play().catch(() => {});
    }

    if (caption) caption.textContent = CONFIG.videoCaptions[key] || "";
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => setActive(btn.dataset.video)));
  setActive("cliente");
}

function setupSoundToggle() {
  const btn = document.querySelector(".sound-toggle");
  const phoneVideo = document.getElementById("demo-phone-video");
  if (!btn || !phoneVideo) return;

  function updateUI() {
    btn.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
    btn.textContent = state.soundEnabled ? "🔊 Som ativado" : "🔇 Ativar som";
  }

  btn.addEventListener("click", async () => {
    state.soundEnabled = !state.soundEnabled;
    phoneVideo.muted = !state.soundEnabled;
    if (state.soundEnabled) phoneVideo.volume = 1.0;

    await phoneVideo.play().catch(() => {});
    updateUI();
  });

  phoneVideo.addEventListener("click", () => btn.click());
  updateUI();
}

// ======================
// CTA: WhatsApp (menos invasivo)
// ======================
function wireCTAs() {
  const buttons = document.querySelectorAll(".cta-whatsapp");
  buttons.forEach((btn) => {
    // Se for botão de plano, adiciona apenas uma “preferência suave”
    const planId = btn.dataset.plan;
    let extra = "";

    if (planId) {
      const plan = CONFIG.plans.find((p) => p.id === planId);
      if (plan) {
        extra = `Tenho preferência pelo plano ${plan.name}. Ainda tem vaga disponível?`;
      }
    }

    btn.href = buildWhatsAppLink(extra);
    btn.target = "_blank";
    btn.rel = "noopener";
  });
}

// ======================
// FAQ
// ======================
function setupAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (items.length === 0) return;

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const isOpen = panel.classList.contains("open");

      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("open"));
      document.querySelectorAll(".accordion-item").forEach((b) => b.setAttribute("aria-expanded", "false"));
      document.querySelectorAll(".accordion-item .icon").forEach((i) => (i.style.transform = "rotate(0deg)"));

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
  updateSlotsProgressRing();
  updateDeadlineUI();

  initVideo();
  setupVideoTabs();
  setupSoundToggle();

  wireCTAs();
  setupAccordion();

  // deadline countdown refresh (1s)
  setInterval(updateDeadlineUI, 1000);
}

document.addEventListener("DOMContentLoaded", init);
