// Configurações editáveis
const CONFIG = {
  vagasStarter: 50,
  vagasPro: 35,
  vagasElite: 10,
  whatsappNumber: "6692410415", // apenas dígitos com DDD
  mensagemWhatsApp: "Quero ser fundador do Freela Norte em Sinop. Plano:",
  dataLancamento: "Em breve" // texto livre
};

// Estado local de vagas (somente visual)
const slots = {
  starter: CONFIG.vagasStarter,
  pro: CONFIG.vagasPro,
  elite: CONFIG.vagasElite
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function buildWhatsAppLink(planLabel) {
  const msg = `${CONFIG.mensagemWhatsApp} ${planLabel}. Data lançamento: ${CONFIG.dataLancamento}. Benefícios válidos por 24 meses.`;
  const encoded = encodeURIComponent(msg);
  return `https://wa.me/55${CONFIG.whatsappNumber}?text=${encoded}`;
}

function updateCounters() {
  document.getElementById("slot-starter").textContent = slots.starter;
  document.getElementById("slot-pro").textContent = slots.pro;
  document.getElementById("slot-elite").textContent = slots.elite;
  document.getElementById("slot-starter-card").textContent = slots.starter;
  document.getElementById("slot-pro-card").textContent = slots.pro;
  document.getElementById("slot-elite-card").textContent = slots.elite;
  const total = slots.starter + slots.pro + slots.elite;
  document.getElementById("total-fundadores").textContent = `${total} slots ativos`;
}

function wireCTAs() {
  const ctas = document.querySelectorAll(".cta-whatsapp");
  ctas.forEach(btn => {
    const plan = btn.dataset.plan || "fundador";
    const label = plan === "starter" ? "Starter (R$197)"
                : plan === "elite" ? "Elite (R$997)"
                : plan === "pro" ? "Pro (R$497)"
                : "Fundador";
    btn.href = buildWhatsAppLink(label);
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.addEventListener("click", () => {
      const key = plan === "starter" ? "starter" : plan === "elite" ? "elite" : "pro";
      if (slots[key] > 0) {
        slots[key] -= 1;
        updateCounters();
      }
    });
  });
}

function setupAccordion() {
  const items = document.querySelectorAll(".accordion-item");
  items.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const icon = btn.querySelector(".icon");
      const isOpen = panel.classList.contains("open");
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("open"));
      document.querySelectorAll(".accordion-item .icon").forEach(i => i.style.transform = "rotate(0deg)");
      if (!isOpen) {
        panel.classList.add("open");
        icon.style.transform = "rotate(45deg)";
      }
    });
    if (idx === 0) btn.click(); // abre a primeira por padrão
  });
}

function init() {
  document.getElementById("data-lancamento").textContent = formatDate(CONFIG.dataLancamento);
  updateCounters();
  wireCTAs();
  setupAccordion();
}

document.addEventListener("DOMContentLoaded", init);
