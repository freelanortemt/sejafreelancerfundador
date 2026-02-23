// Config central (ajuste aqui para refletir o lote atual)
const CONFIG = {
  brandName: "Freela Norte",
  city: "Sinop - MT",
  whatsappNumber: "5566992410415", // inclua DDI+DDD, apenas dígitos
  whatsappBaseMessage:
    "Quero garantir minha posição antes da abertura pública em Sinop. Sei que é pagamento único e focado em visibilidade/prioridade (sem promessa de clientes).",
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
  const cityPill = document.getElementById("city-pill"); // pode não existir (ok)
  const launchEl = document.getElementById("launch-window");

  if (brandNameEl) brandNameEl.textContent = CONFIG.brandName;
  if (brandCityEl) brandCityEl.textContent = `Marketplace regional • ${CONFIG.city}`;
  if (cityPill) cityPill.textContent = CONFIG.city;
  if (launchEl) launchEl.textContent = CONFIG.launchWindow;
}

/**
 * Sempre coloca um src inicial no vídeo (fallback).
 */
function ensureVideoSrc() {
  const phoneVideo = document.getElementById("demo-phone-video");
  if (!phoneVideo) return;

  // Se já tiver src no HTML, mantém. Se não, aplica cliente.
  const currentSrc = phoneVideo.getAttribute("src");
  if (!currentSrc) phoneVideo.setAttribute("src", CONFIG.videoPaths.cliente);

  // Autoplay mais confiável com muted
  phoneVideo.muted = true;
  phoneVideo.volume = 1.0;

  const p = phoneVideo.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

function setupVideoTabs() {
  const phoneVideo = document.getElementById("demo-phone-video");
  const captionEl = document.getElementById("demo-video-caption");
  const tabs = document.querySelectorAll(".video-tab");

  if (!phoneVideo || tabs.length === 0) return;

  const captions = {
    cliente: "",
    freelancer: "",
  };

  function setActive(key) {
    tabs.forEach((btn) => {
      const isActive = btn.dataset.video === key;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const nextSrc = CONFIG.videoPaths[key];
    if (!nextSrc) return;

    // troca de src só quando necessário
    if (phoneVideo.getAttribute("src") !== nextSrc) {
      phoneVideo.setAttribute("src", nextSrc);
      phoneVideo.muted = !soundEnabled;

      phoneVideo.load();
      const p = phoneVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    if (captionEl) captionEl.textContent = captions[key] || "";
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

    try {
      const p = phoneVideo.play();
      if (p && typeof p.catch === "function") await p.catch(() => {});
    } catch (e) {
      soundEnabled = false;
      phoneVideo.muted = true;
    }

    updateUI();
  });

  // tocar no vídeo também alterna som (boa UX)
  phoneVideo.addEventListener("click", () => btn.click());

  updateUI();
}

function wireCTAs() {
  const buttons = document.querySelectorAll(".cta-whatsapp");

  // Se o JS falhar em algum ponto, pelo menos deixa um fallback
  const fallbackPlan = getPlan("pro");
  const fallbackHref = buildWhatsAppLink(fallbackPlan);

  buttons.forEach((btn) => {
    const planId = btn.dataset.plan || "pro";
    const plan = getPlan(planId);

    btn.setAttribute("href", buildWhatsAppLink(plan));
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener");

    btn.addEventListener("click", () => {
      // decremento visual opcional
      const current = state.slots[plan.id];
      if (typeof current === "number" && current > 0) {
        state.slots[plan.id] = current - 1;
        updateSlotsUI();
      }
    });
  });

  // Se não achou nenhum botão, não explode
  if (buttons.length === 0) {
    console.warn("Nenhum CTA .cta-whatsapp encontrado. Cheque o HTML.");
  }

  // Extra: garante que qualquer link sem href não fique morto
  document.querySelectorAll("a.cta-whatsapp:not([href])").forEach((a) => {
    a.setAttribute("href", fallbackHref);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });
}

function setupAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      if (!panel) return;

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

function init() {
  // trava de segurança: se algo der erro, não mata o resto
  try { updateBranding(); } catch (e) { console.error("Branding error:", e); }
  try { updatePrices(); } catch (e) { console.error("Prices error:", e); }
  try { updateSlotsUI(); } catch (e) { console.error("Slots error:", e); }

  try { ensureVideoSrc(); } catch (e) { console.error("Video src error:", e); }
  try { setupVideoTabs(); } catch (e) { console.error("Tabs error:", e); }
  try { setupSoundToggle(); } catch (e) { console.error("Sound error:", e); }

  try { wireCTAs(); } catch (e) { console.error("CTA error:", e); }
  try { setupAccordion(); } catch (e) { console.error("Accordion error:", e); }
}

// Com defer no script, DOM já costuma estar pronto, mas deixo os dois caminhos
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
