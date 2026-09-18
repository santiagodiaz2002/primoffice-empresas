(() => {
  "use strict";

  const config = window.PRIMOFFICE_SITE_CONFIG || {};
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const form = document.querySelector("[data-contact-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const formNote = document.querySelector("[data-form-note]");
  const dateInput = document.querySelector("[data-date-input]");
  const projectSelect = document.querySelector("[data-project-select]");
  const formSuccess = document.querySelector("[data-form-success]");
  const successWhatsApp = document.querySelector("[data-success-wa]");
  let successWhatsAppUrl = "";
  const track = (name, params = {}) => {
    // Analytics is optional and must never interrupt a persisted lead's confirmation.
    try { window.gtag?.("event", name, params); } catch (_) { /* unavailable */ }
  };
  const attributionKeys = ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const attribution = {};
  const storageKey = "primoffice.corporate.attribution";
  let saved = {};
  try { saved = JSON.parse(window.sessionStorage.getItem(storageKey)) || {}; } catch (_) { /* private mode */ }
  const query = new URLSearchParams(window.location.search);
  for (const key of [...attributionKeys, "landing_url", "referrer"]) {
    if (typeof saved[key] === "string" && saved[key]) attribution[key] = saved[key];
  }
  for (const key of attributionKeys) {
    const value = query.get(key);
    if (!attribution[key] && value) attribution[key] = value;
  }
  attribution.landing_url ||= window.location.href;
  // An empty initial referrer is meaningful: do not replace it on later loads.
  attribution.referrer = typeof saved.referrer === "string" ? saved.referrer : document.referrer;
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(attribution)); } catch (_) { /* retain in memory */ }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  if (dateInput) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    dateInput.min = localDate;
  }

  if (navToggle && nav) {
    const closeNav = () => {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menú");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    };

    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navToggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) closeNav();
    });
  }

  document.querySelectorAll("[data-project-type]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!projectSelect) return;
      const type = link.getAttribute("data-project-type");
      const optionExists = Array.from(projectSelect.options).some((option) => option.value === type);
      if (optionExists) projectSelect.value = type;
    });
  });

  const normalizeWhatsApp = (value) => String(value || "").replace(/\D/g, "");
  const formatWhatsApp = (value) => {
    const argentina = value.match(/^54(9)(\d{2})(\d{4})(\d{4})$/);
    return argentina
      ? `+54 9 ${argentina[2]} ${argentina[3]}-${argentina[4]}`
      : `+${value}`;
  };
  const whatsappNumber = normalizeWhatsApp(config.whatsappNumber);
  const corporateEmail = String(config.corporateEmail || "").trim();

  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    if (!whatsappNumber) return;
    const text = "Hola PrimOffice, quiero consultar por una propuesta para mi empresa.";
    link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", (event) => {
      track("whatsapp_click");
      if (link === successWhatsApp && successWhatsAppUrl) {
        // Keep customer data out of link_url collected by automatic link tracking.
        event.preventDefault();
        window.open(successWhatsAppUrl, "_blank", "noopener,noreferrer");
      }
    });
  });

  document.querySelectorAll("[data-wa-display]").forEach((node) => {
    if (whatsappNumber) node.textContent = formatWhatsApp(whatsappNumber);
  });

  document.querySelectorAll("[data-email-link]").forEach((link) => {
    if (!corporateEmail) return;
    link.href = `mailto:${corporateEmail}?subject=${encodeURIComponent("Consulta corporativa PrimOffice")}`;
    link.addEventListener("click", () => track("email_click"));
  });

  document.querySelectorAll("[data-email-display]").forEach((node) => {
    if (corporateEmail) node.textContent = corporateEmail;
  });

  const formatDate = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  const buildMessage = (data) => {
    const lines = [
      "Hola PrimOffice, quiero consultar por una propuesta para mi empresa.",
      "",
      `Nombre: ${String(data.get("nombre") || "").trim()}`,
      `Empresa: ${String(data.get("empresa") || "").trim()}`,
      `Email: ${String(data.get("email") || "").trim()}`,
      `WhatsApp: ${String(data.get("phone") || "").trim()}`,
      `Proyecto: ${String(data.get("tipo") || "").trim()}`,
      data.get("cantidad") ? `Cantidad aproximada: ${String(data.get("cantidad")).trim()}` : "",
      `Fecha objetivo: ${formatDate(data.get("fecha"))}`,
      data.get("detalle") ? `Detalle: ${String(data.get("detalle")).trim()}` : ""
    ];
    return lines.filter(Boolean).join("\n");
  };

  if (form) {
    const submitButton = form.querySelector('[type="submit"]');
    const formGrid = form.querySelector(".form-grid");
    const phoneInput = form.elements.namedItem("phone");
    let formStarted = false;
    let registrationPending = false;
    let submitted = false;
    const submissionKey = "primoffice.corporate.submission";
    let submissionId = "";
    try { submissionId = window.sessionStorage.getItem(submissionKey) || ""; } catch (_) { /* retain in memory */ }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) submissionId = "";
    const startForm = () => {
      if (formStarted) return;
      formStarted = true;
      track("form_start");
    };
    form.addEventListener("input", startForm);
    form.addEventListener("change", startForm);
    phoneInput.addEventListener("input", () => phoneInput.setCustomValidity(""));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (registrationPending || submitted) return;
      formStatus.textContent = "";
      const phone = phoneInput.value.trim();
      const digits = phone.replace(/\D/g, "");
      phoneInput.setCustomValidity(/^\+?[\d\s().-]+$/.test(phone) && digits.length >= 8 && digits.length <= 15
        ? "" : "Ingresá un WhatsApp válido, con código de área.");
      if (!form.checkValidity()) {
        track("form_error", { error_type: "validation" });
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const message = buildMessage(data);
      registrationPending = true;
      submitButton.disabled = true;
      form.setAttribute("aria-busy", "true");
      formStatus.textContent = "Enviando consulta…";
      try {
        submissionId ||= window.crypto.randomUUID();
        try { window.sessionStorage.setItem(submissionKey, submissionId); } catch (_) { /* retry keeps the ID in memory */ }
        const response = await fetch("https://setupoficina.com.ar/api/corporate-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...Object.fromEntries(data), ...attribution, submission_id: submissionId })
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true || !Number.isInteger(result.id) || result.id <= 0) {
          throw new Error("Registration not confirmed");
        }
        submitted = true;
        try { window.sessionStorage.removeItem(submissionKey); } catch (_) { /* storage unavailable */ }
        submissionId = "";
        track("generate_lead");
        formGrid.hidden = true;
        submitButton.hidden = true;
        formNote.hidden = true;
        formStatus.textContent = "";
        if (whatsappNumber) successWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        else successWhatsApp.hidden = true;
        formSuccess.hidden = false;
        formSuccess.focus();
      } catch (_) {
        track("form_error", { error_type: "backend" });
        formStatus.textContent = "No pudimos confirmar el registro de tu consulta. Tus datos siguen en el formulario; podés volver a intentar.";
      } finally {
        registrationPending = false;
        submitButton.disabled = submitted;
        form.setAttribute("aria-busy", "false");
      }
    });
  }

  const workCarousel = document.querySelector(".work-carousel");
  const workLightbox = document.querySelector("[data-work-lightbox]");
  const workLightboxImage = document.querySelector("[data-work-lightbox-image]");
  const workLightboxClose = document.querySelector("[data-work-lightbox-close]");

  if (
    workCarousel &&
    workLightbox &&
    workLightboxImage &&
    workLightboxClose &&
    typeof workLightbox.showModal === "function"
  ) {
    const originalImages = Array.from(
      workCarousel.querySelectorAll('.work-carousel-group:not([aria-hidden="true"]) img')
    );

    const openWorkLightbox = (image) => {
      const source = image.getAttribute("src");
      const originalImage = originalImages.find(
        (item) => item.getAttribute("src") === source
      );

      workLightboxImage.src = image.currentSrc || image.src;
      workLightboxImage.alt = originalImage?.alt || image.alt || "";

      workLightbox.showModal();
      document.body.classList.add("work-lightbox-open");
    };

    originalImages.forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt}. Abrir imagen ampliada`);

      image.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openWorkLightbox(image);
      });
    });

    workCarousel.addEventListener("click", (event) => {
      const image = event.target.closest(".work-carousel-group img");
      if (!image) return;

      openWorkLightbox(image);
    });

    workLightboxClose.addEventListener("click", () => {
      workLightbox.close();
    });

    workLightbox.addEventListener("click", (event) => {
      if (event.target === workLightbox) {
        workLightbox.close();
      }
    });

    workLightbox.addEventListener("close", () => {
      document.body.classList.remove("work-lightbox-open");
      workLightboxImage.removeAttribute("src");
      workLightboxImage.alt = "";
    });
  }
})();
