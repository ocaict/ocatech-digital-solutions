(() => {
  const form = document.querySelector("#apply-form");
  if (!form) return;
  const messages = JSON.parse(form.dataset.messages || "{}");
  const errors = document.querySelector("#form-errors");
  const name = form.elements.name;
  const phone = form.elements.phone;
  const email = form.elements.email;
  const course = form.elements.course;
  const service = form.elements.service;
  const locationInput = form.elements.location;
  const message = form.elements.message;
  const consent = form.elements.consent;
  const counter = document.querySelector("#message-count");
  const source = document.querySelector("#source-page");

  const type = () => form.elements.type?.value || "learn";

  const clearErrors = () => {
    [name, phone, course, service, locationInput, consent].filter(Boolean).forEach((field) => {
      field.setCustomValidity("");
      field.classList.remove("field-error");
    });
    if (errors) {
      errors.replaceChildren();
      errors.hidden = true;
    }
  };

  const addError = (field, text) => {
    if (field) {
      field.setCustomValidity(text);
      field.classList.add("field-error");
    }
    if (errors) {
      const line = document.createElement("p");
      line.textContent = text;
      errors.append(line);
    }
  };

  const preselect = () => {
    const params = new URLSearchParams(location.search);
    const selectedCourse = params.get("course");
    const selectedService = params.get("service");
    if (course && selectedCourse && [...course.options].some((option) => option.value === selectedCourse)) {
      course.value = selectedCourse;
    }
    if (service && selectedService && [...service.options].some((option) => option.value === selectedService)) {
      service.value = selectedService;
    }
    if (source) {
      source.value = location.pathname;
    }
    try {
      ["utm_source", "utm_medium", "utm_campaign", "referrer"].forEach((k) => {
        const val = sessionStorage.getItem(`ocatech_${k}`) || params.get(k);
        if (val && form.elements[k]) {
          form.elements[k].value = val;
        }
      });
    } catch {}
  };

  const validate = () => {
    clearErrors();
    if (name && name.value.trim().length < 2) addError(name, messages.name);
    const digits = phone ? phone.value.replace(/[\s-]/g, "") : "";
    if (!/^(?:\+?234|0)[789]\d{9}$/.test(digits)) addError(phone, messages.phone);
    if (type() === "learn" && course && !course.value) addError(course, messages.course);
    if (type() === "service" && service && !service.value) addError(service, messages.service || messages.course);
    if (type() === "service" && locationInput && !locationInput.value.trim()) addError(locationInput, messages.location || "Enter your location or town.");
    if (consent && !consent.checked) addError(consent, messages.consent);
    if (errors && errors.childElementCount) {
      errors.hidden = false;
      return false;
    }
    return true;
  };

  const showSuccess = (firstName, customWaUrl) => {
    const panel = document.createElement("section");
    panel.className = "form-success";
    const heading = document.createElement("h2");
    heading.textContent = firstName ? `${messages.success}, ${firstName}!` : messages.success;
    const text = document.createElement("p");
    text.textContent = messages.successText;
    const link = document.createElement("a");
    link.className = "button button-wa button-full";
    link.href = customWaUrl || form.dataset.whatsapp;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Continue on WhatsApp";
    const notice = document.createElement("span");
    notice.className = "sr-only";
    notice.textContent = " (opens in a new tab)";
    link.append(notice);
    panel.append(heading, text, link);
    form.replaceWith(panel);
  };

  if (message && counter) {
    message.addEventListener("input", () => {
      counter.textContent = `${message.value.length}/600`;
    });
  }
  [name, phone, course, service, locationInput, consent].filter(Boolean).forEach((field) => {
    field.addEventListener("input", () => field.setCustomValidity(""));
  });

  preselect();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate()) return;
    form.classList.add("is-sending");
    const button = form.querySelector("button[type='submit']");
    const label = button.textContent;
    button.textContent = messages.sending;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      ["utm_source", "utm_medium", "utm_campaign", "referrer"].forEach((k) => {
        if (!payload[k]) {
          const val = sessionStorage.getItem(`ocatech_${k}`);
          if (val) payload[k] = val;
        }
      });
    } catch {}
    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 429) {
        errors.textContent = messages.limit;
        errors.hidden = false;
        return;
      }
      if (!response.ok) throw new Error("apply failed");
      const result = await response.json().catch(() => ({}));
      showSuccess(name.value.trim().split(/\s+/)[0], result.whatsappUrl);
    } catch {
      errors.textContent = messages.error;
      errors.hidden = false;
    } finally {
      form.classList.remove("is-sending");
      button.textContent = label;
    }
  });
})();
