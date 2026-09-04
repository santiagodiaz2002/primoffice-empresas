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
  });

  document.querySelectorAll("[data-wa-display]").forEach((node) => {
    if (whatsappNumber) node.textContent = formatWhatsApp(whatsappNumber);
  });

  document.querySelectorAll("[data-email-link]").forEach((link) => {
    if (!corporateEmail) return;
    link.href = `mailto:${corporateEmail}?subject=${encodeURIComponent("Consulta corporativa PrimOffice")}`;
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
      `Contacto: ${String(data.get("contacto") || "").trim()}`,
      `Proyecto: ${String(data.get("tipo") || "").trim()}`,
      data.get("cantidad") ? `Cantidad aproximada: ${String(data.get("cantidad")).trim()}` : "",
      `Fecha objetivo: ${formatDate(data.get("fecha"))}`,
      data.get("detalle") ? `Detalle: ${String(data.get("detalle")).trim()}` : ""
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
    if ((whatsappNumber || corporateEmail) && formNote) {
      formNote.textContent = whatsappNumber
        ? "Al enviar, abrimos WhatsApp con los datos de tu consulta ya cargados. Este sitio no guarda tu información."
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
        ? "Copiamos la consulta al portapapeles porque no hay un canal de contacto disponible."
        : "No hay un canal de contacto disponible en este momento.";
    });
  }
})();
