(() => {
  "use strict";

  const config = window.PRIMOFFICE_SITE_CONFIG || {};
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const previewNote = document.querySelector("[data-preview-note]");
  const form = document.querySelector("[data-contact-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const formNote = document.querySelector("[data-form-note]");
  const dateInput = document.querySelector("[data-date-input]");
  const projectSelect = document.querySelector("[data-project-select]");

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  if (config.preview && previewNote) {
    previewNote.hidden = false;
  }

  if (dateInput) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    dateInput.min = localDate;
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.classList.remove("nav-open");
      });
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
  const whatsappNumber = normalizeWhatsApp(config.whatsappNumber);
  const corporateEmail = String(config.corporateEmail || "").trim();

  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    if (!whatsappNumber) {
      link.setAttribute("title", "WhatsApp pendiente de configurar");
      return;
    }
    const text = "Hola PrimOffice, quiero consultar por una propuesta corporativa.";
    link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  document.querySelectorAll("[data-email-link]").forEach((link) => {
    if (!corporateEmail) {
      link.setAttribute("title", "Email corporativo pendiente de configurar");
      return;
    }
    link.href = `mailto:${corporateEmail}?subject=${encodeURIComponent("Consulta corporativa PrimOffice")}`;
  });

  const formatDate = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  const buildMessage = (data) => {
    const lines = [
      "Hola PrimOffice, quiero consultar por una propuesta corporativa.",
      "",
      `Nombre: ${data.get("nombre") || ""}`,
      `Empresa: ${data.get("empresa") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `Teléfono / WhatsApp: ${data.get("telefono") || ""}`,
      `Fecha objetivo: ${formatDate(data.get("fecha"))}`,
      data.get("cantidad") ? `Cantidad aproximada: ${data.get("cantidad")}` : "",
      `Proyecto: ${data.get("tipo") || ""}`,
      data.get("detalle") ? `Detalle: ${data.get("detalle")}` : ""
    ];
    return lines.filter(Boolean).join("\n");
  };

  const copyText = async (text) => {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      return false;
    }
  };

  if (form) {
    if (!config.preview && (whatsappNumber || corporateEmail) && formNote) {
      formNote.textContent = whatsappNumber
        ? "Al enviar, abrimos WhatsApp con los datos de tu consulta ya cargados."
        : "Al enviar, preparamos un email con los datos de tu consulta.";
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      formStatus.textContent = "";

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const message = buildMessage(data);

      if (whatsappNumber) {
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        formStatus.textContent = "Consulta preparada en WhatsApp.";
        return;
      }

      if (corporateEmail) {
        const subject = `Consulta corporativa · ${data.get("empresa") || "PrimOffice"}`;
        window.location.href = `mailto:${corporateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        formStatus.textContent = "Consulta preparada en tu aplicación de email.";
        return;
      }

      const copied = await copyText(message);
      formStatus.textContent = copied
        ? "Vista previa: copiamos la consulta al portapapeles. Falta configurar WhatsApp o email antes de publicar."
        : "Vista previa: falta configurar WhatsApp o email antes de publicar.";
    });
  }
})();
