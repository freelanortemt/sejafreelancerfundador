// Config central (ajuste aqui para refletir o lote atual)
const CONFIG = {
  brandName: "Freela Norte",
  city: "Sinop - MT",
  whatsappNumber: "5566992410415", // inclua DDI+DDD, apenas dígitos

  // Mensagem base (Guerra: mais direta, ainda 100% honesta)
  whatsappBaseMessage:
    "Quero garantir minha posição ANTES da abertura pública em Sinop. Sei que é pagamento único, focado em visibilidade/prioridade (sem promessa de clientes).",

  founderProgramName: "Fundadores Freela Norte",
  launchWindow: "Lançamento em breve",

  // Cloudinary (otimização automática)
  videoPaths: {
    cliente:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804387/cliente_s89oeu.mp4",
    freelancer:
      "https://res.cloudinary.com/dsxthz96u/video/upload/q_auto,f_auto/v1771804382/freelancer_kec6uy.mp4",
  },

  plans: [
    { id: "starter", name: "Starter", price: 197, vagas: 12, perks: ["Selo verificado", "Destaque inicial", "Teste Interno", "Checklist pronto"] },
    { id: "pro", name: "Pro", price: 497, vagas: 18, perks: ["Ranking priorizado por 6 meses", "Selo + badge Pro", "Grupo VIP", "Feedback direto"] },
    { id: "elite", name: "Elite", price: 997, vagas: 6, perks: ["Top ranking por 12 meses", "Badge Elite", "Suporte 1:1", "Prioridade máxima"] },
  ],

  // Efeito de atenção (bem sutil) na seção nova
  warMode: {
    observeSectionId: "o-que-e",
    revealClass: "war-reveal",
    revealedClass: "war-revealed",
  },

  // Tracking local simples (sem analytics)
  tracking: {
    enabled: true,
    storageKey: "freela_norte_clicks_v1",
  }
};

// Estado visual de vagas
const state = {
  slots: CONFIG.plans.reduce((acc, plan) => {
    acc[plan.id] = plan.vagas;
    return acc;
  }, {}),
};

// Estado do som (persistente enquanto navega na página)
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

  // Complemento por plano (Guerra: pressão + clareza + pergunta de fechamento)
  const planCloser = {
    starter:
      "Quero entrar e já começar com selo verificado + destaque inicial. Me passa o passo a passo e as vagas restantes desse lote?",
    pro:
      "Quero o PRO para entrar com prioridade de ranking e já sair na frente na minha categoria. Ainda tem vaga no lote atual? Quero garantir agora.",
    elite:
      "Quero o ELITE para ficar no topo com suporte 1:1 no lançamento. Ainda tem vaga? Se tiver, quero travar minha posição hoje.",
  };

  const message =
    `${CONFIG.whatsappBaseMessage}\n\n` +
    `Plano desejado: ${plan.name} (${currency(plan.price)})\n` +
    `Cidade: ${CONFIG.city}\n\n` +
    `${planCloser[plan.id] || "Ainda tem vaga? Quero garantir minha posição antes do lançamento."}`;

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

/**
 * Atualiza o vídeo do mockup (smartphone)
 * Autoplay exige muted; o botão de som libera o áudio após clique.
 */
function updateVideos() {
  const phoneVideo = document.getElementById("demo-phone-video");
  if (!phoneVideo) return;

  phoneVideo.src = CONFIG.videoPaths.cliente;

  // Autoplay mais confiável com muted
  phoneVideo.muted = true;
  phoneVideo.volume = 1.0;

  phoneVideo.load();
}

/**
 * Tabs Cliente/Freelancer para trocar o vídeo no smartphone
 */
function setupVideoTabs() {
  const phoneVideo = document.getElementById("demo-phone-video");
  const captionEl = document.getElementById("demo-video-caption");
  const tabs = document.querySelectorAll(".video-tab");

  if (!phoneVideo || tabs.length === 0) return;

  const captions = {
    cliente: "Veja como os clientes encontram e contratam quem está no topo.",
    freelancer: "Entenda o caminho do perfil verificado até o destaque no ranking.",
  };

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

      // mantém o estado do som ao trocar de vídeo
      phoneVideo.muted = !soundEnabled;

      phoneVideo.load();

      const playPromise = phoneVideo.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    if (captionEl) captionEl.textContent = captions[key] || "";
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => setActive(btn.dataset.video));
  });

  setActive("cliente");
}

/**
 * Botão de som (mobile-first)
 * Regras do navegador: som só após interação do usuário.
 */
function setupSoundToggle() {
  const btn = document.querySelector(".sound-toggle");
  const phoneVideo = document.getElementById("demo-phone-video");
  if (!btn || !phoneVideo) return;

  function updateUI() {
    btn.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    btn.textContent = soundEnabled ? "🔊 Som ativado" : "🔇 Ativar som";
  }

  btn.addEventListener("click", async () => {
    try {
      soundEnabled = !soundEnabled;

      phoneVideo.muted = !soundEnabled;
      if (soundEnabled) phoneVideo.volume = 1.0;

      const p = phoneVideo.play();
      if (p && typeof p.catch === "function") {
        await p.catch(() => {});
      }

      updateUI();
    } catch (e) {
      soundEnabled = false;
      phoneVideo.muted = true;
      updateUI();
    }
  });

  // Mobile UX: tocar no vídeo também alterna som
  phoneVideo.addEventListener("click", () => {
    btn.click();
  });

  updateUI();
}

/* Tracking local simples (sem analytics externo) */
function trackClick(type, payload = {}) {
  if (!CONFIG.tracking.enabled) return;
  try {
    const key = CONFIG.tracking.storageKey;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { total: 0, byPlan: {}, events: [] };

    data.total += 1;
    if (payload.planId) {
      data.byPlan[payload.planId] = (data.byPlan[payload.planId] || 0) + 1;
    }
    data.events.push({
      type,
      payload,
      ts: new Date().toISOString(),
    });

    // evita crescer infinito
    if (data.events.length > 200) data.events = data.events.slice(-200);

    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

/* CTA WhatsApp: funciona com <a> ou <button> */
function wireCTAs() {
  const buttons = document.querySelectorAll(".cta-whatsapp");
  buttons.forEach((btn) => {
    const planId = btn.dataset.plan || "pro";
    const plan = getPlan(planId);
    const link = buildWhatsAppLink(plan);

    // Se for <a>, aplica href/target
    if (btn.tagName.toLowerCase() === "a") {
      btn.href = link;
      btn.target = "_blank";
      btn.rel = "noopener";
    } else {
      // Se algum dia trocar para button, mantém funcionando
      btn.addEventListener("click", () => window.open(link, "_blank", "noopener"));
    }

    btn.addEventListener("click", () => {
      trackClick("cta_whatsapp", { planId: plan.id, planName: plan.name });

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
      document.querySelectorAll(".accordion-item .icon").forEach((i) => (i.style.transform = "rotate(0deg)"));
      if (!isOpen) {
        panel.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        const icon = btn.querySelector(".icon");
        if (icon) icon.style.transform = "rotate(45deg)";
      }
    });
  });
  if (items[0]) items[0].click(); // abre a primeira
}

/**
 * 🚀 Efeito de atenção na seção nova (#o-que-e)
 * - adiciona uma classe quando a seção entra na tela
 * - não depende de libs
 */
function setupWarReveal() {
  const id = CONFIG.warMode.observeSectionId;
  const section = document.getElementById(id);
  if (!section) return;

  // adiciona classe base (pra CSS opcional)
  section.classList.add(CONFIG.warMode.revealClass);

  // Se browser não suportar IntersectionObserver, revela direto
  if (!("IntersectionObserver" in window)) {
    section.classList.add(CONFIG.warMode.revealedClass);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add(CONFIG.warMode.revealedClass);
          trackClick("section_view", { sectionId: id });
          io.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );

  io.observe(section);
}

function injectWarCSS() {
  // CSS mínimo pra animação (não substitui seu styles.css, só complementa)
  const css = `
    #${CONFIG.warMode.observeSectionId}.${CONFIG.warMode.revealClass} .card,
    #${CONFIG.warMode.observeSectionId}.${CONFIG.warMode.revealClass} .section-head.left {
      transform: translateY(10px);
      opacity: 0.86;
      transition: transform .45s ease, opacity .45s ease;
      will-change: transform, opacity;
    }
    #${CONFIG.warMode.observeSectionId}.${CONFIG.warMode.revealedClass} .card,
    #${CONFIG.warMode.observeSectionId}.${CONFIG.warMode.revealedClass} .section-head.left {
      transform: translateY(0px);
      opacity: 1;
    }
  `;
  const style = document.createElement("style");
  style.setAttribute("data-war-css", "true");
  style.textContent = css;
  document.head.appendChild(style);
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

  // Guerra
  injectWarCSS();
  setupWarReveal();
}

document.addEventListener("DOMContentLoaded", init);
