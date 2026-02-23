// Config central (ajuste aqui para refletir o lote atual)
const CONFIG = {
  brandName: "Freela Norte",
  city: "Sinop - MT",
  whatsappNumber: "5566992410415",
  whatsappBaseMessage:
    "Fala, tudo bem? Vi o Freela Norte e quero entrar antes da abertura em Sinop. Ainda tem vaga disponível?"",

  founderProgramName: "Fundadores Freela Norte",
  launchWindow: "Lançamento em breve",

  videoPaths: {
    cliente:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804387/cliente_s89oeu.mp4",
    freelancer:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804382/freelancer_kec6uy.mp4",
  },

  plans: [
    { id: "starter", name: "Starter", price: 197, vagas: 12 },
    { id: "pro", name: "Pro", price: 497, vagas: 18 },
    { id: "elite", name: "Elite", price: 997, vagas: 6 },
  ],
};

const state = {
  slots: CONFIG.plans.reduce((acc, plan) => {
    acc[plan.id] = plan.vagas;
    return acc;
  }, {}),
};

let soundEnabled = false;

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
    `Plano desejado: ${plan.name} (${currency(plan.price)})\n` +
    `Cidade: ${CONFIG.city}\n\n` +
    `Ainda tem vaga? Quero garantir minha posição antes do lançamento.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function updateSlotsUI() {
  CONFIG.plans.forEach((plan) => {
    const value = state.slots[plan.id];
    const label = value > 0 ? `${value} vaga${value > 1 ? "s" : ""}` : "Esgotado";
    document.querySelectorAll(`[data-slot="${plan.id}"]`).forEach((el) => {
      el.textContent = label;
      if (value === 0) el.classList.add("slot-out");
    });
  });
}

function updatePrices() {
  CONFIG.plans.forEach((plan) => {
    document.querySelectorAll(`[data-plan-price="${plan.id}"]`).forEach((el) => {
      el.textContent = currency(plan.price);
    });
  });
}

function updateBranding() {
  const brandNameEl = document.getElementById("brand-name");
  const brandCityEl = document.getElementById("brand-city");
  const cityPill = document.getElementById("city-pill");
  const launchEl = document.getElementById("launch-window");

  if (brandNameEl) brandNameEl.textContent = CONFIG.brandName;
  if (brandCityEl) brandCityEl.textContent = `Marketplace regional • ${CONFIG.city}`;
  if (cityPill) cityPill.textContent = CONFIG.city;
  if (launchEl) launchEl.textContent = CONFIG.launchWindow;
}

function updateVideos() {
  const phoneVideo = document.getElementById("demo-phone-video");
  if (!phoneVideo) return;

  phoneVideo.src = CONFIG.videoPaths.cliente;
  phoneVideo.muted = true;
  phoneVideo.volume = 1.0;
  phoneVideo.load();
}

function setupVideoTabs() {
  const phoneVideo = document.getElementById("demo-phone-video");
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
    btn.textContent = soundEnabled ? "🔊 Som ativado" : "🔇 Ativar som";
  }

  btn.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    phoneVideo.muted = !soundEnabled;
    if (soundEnabled) phoneVideo.volume = 1.0;
    await phoneVideo.play().catch(() => {});
    updateUI();
  });

  phoneVideo.addEventListener("click", () => {
    btn.click();
  });

  updateUI();
}

function wireCTAs() {
  const buttons = document.querySelectorAll(".cta-whatsapp");
  buttons.forEach((btn) => {
    const planId = btn.dataset.plan || "pro";
    const plan = getPlan(planId);
    btn.href = buildWhatsAppLink(plan);
    btn.target = "_blank";
    btn.rel = "noopener";

    btn.addEventListener("click", () => {
      const current = state.slots[plan.id];
      if (current > 0) {
        state.slots[plan.id] = current - 1;
        updateSlotsUI();
      }
    });
  });
}

function setupAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const isOpen = panel.classList.contains("open");
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("open"));
      document.querySelectorAll(".accordion-item").forEach((b) => b.setAttribute("aria-expanded", "false"));

      if (!isOpen) {
        panel.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  if (items[0]) items[0].click();
}

function init() {
  updateBranding();
  updatePrices();
  updateSlotsUI();
  updateVideos();
  setupVideoTabs();
  setupSoundToggle();
  wireCTAs();
  setupAccordion();
}

document.addEventListener("DOMContentLoaded", init);
