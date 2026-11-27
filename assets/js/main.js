(() => {
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const courseList = document.querySelector("#course-list");
  if (courseList) {
    const track = new URLSearchParams(location.search).get("track") || "all";
    courseList.querySelectorAll("[data-course-track]").forEach((row) => {
      row.hidden = track !== "all" && row.dataset.courseTrack !== track;
    });
    document.querySelectorAll("[data-track-filter]").forEach((link) => {
      if (link.dataset.trackFilter === track) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  const chatButton = document.querySelector(".chat-open");
  if (chatButton && !document.querySelector("meta[name='chat-src']")?.content) {
    chatButton.disabled = true;
  }

  chatButton?.addEventListener("click", () => {
    if (window.OCATECH_CHAT_READY) return;
    window.OCATECH_CHAT_READY = true;
    const src = document.querySelector("meta[name='chat-src']")?.content;
    if (!src) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.head.append(script);
  }, { once: true });

  try {
    const params = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach((key) => {
      const val = params.get(key);
      if (val) sessionStorage.setItem(`ocatech_${key}`, val);
    });
    if (document.referrer && !sessionStorage.getItem("ocatech_referrer")) {
      try {
        const refUrl = new URL(document.referrer, location.href);
        if (refUrl.origin !== location.origin) {
          sessionStorage.setItem("ocatech_referrer", document.referrer);
        }
      } catch {}
    }
  } catch {}
})();
