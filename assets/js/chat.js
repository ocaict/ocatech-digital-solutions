(() => {
  const button = document.querySelector(".chat-open");
  if (!button || document.querySelector(".chat-widget")) return;

  const copy = {
    name: "OCATECH Admissions Assistant",
    header: "OCATECH Admissions Assistant. Answers about our courses, tuition and center.",
    greeting: "Hello and welcome to OCATECH! I am your admissions counselor. Feel free to ask about our courses, tuition fees, installment plans, or how to visit our Onitsha center. What would you like to learn?",
    quickReplies: [
      { label: "Explore Courses", query: "What courses do you offer for beginners and tech careers?" },
      { label: "Tuition & Installments", query: "How much are course fees and can I pay in installments?" },
      { label: "Where are you located?", query: "Where is your center located and what are your opening hours?" },
      { label: "Do I need a laptop?", query: "Do I need my own laptop to study at OCATECH?" },
      { label: "Talk on WhatsApp", wa: true },
    ],
    placeholder: "Type your question here...",
    footer: "Verified OCATECH information. For instant admission help, use WhatsApp.",
    error: "Something went wrong connecting to the assistant. Please message us on WhatsApp.",
    handoff: "For customized admissions, fee schedules, or corporate training, please chat directly with our team on WhatsApp.",
    whatsapp: "Chat on WhatsApp",
  };

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const formatText = (text) => {
    let safe = String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold formatting: **bold**
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Markdown link formatting: [Label](url)
    safe = safe.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, href) => {
      const cleanHref = href.trim();
      const isInternal = cleanHref.startsWith("/") || cleanHref.startsWith("#");
      const isWA = cleanHref.startsWith("https://wa.me/");
      if (isInternal) {
        return `<a href="${cleanHref}">${label}</a>`;
      }
      if (isWA) {
        return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      }
      return label;
    });

    // Paragraphs and breaks
    safe = safe.replace(/\n\n+/g, "<br><br>").replace(/\n/g, "<br>");
    return safe;
  };

  const widget = make("section", "chat-widget");
  widget.setAttribute("role", "dialog");
  widget.setAttribute("aria-label", copy.name);
  const head = make("div", "chat-head");
  const heading = make("h2", "", copy.name);
  heading.title = copy.header;
  const close = make("button", "chat-close");
  close.type = "button";
  close.setAttribute("aria-label", "Close chat window");
  close.setAttribute("title", "Close chat");
  close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span class="sr-only">Close chat</span>';
  head.append(heading, close);
  const body = make("div", "chat-body");
  const quick = make("div", "chat-quick");
  const form = make("form", "chat-form");
  const input = make("input");
  input.type = "text";
  input.placeholder = copy.placeholder;
  input.setAttribute("aria-label", copy.placeholder);
  input.required = true;
  const send = make("button", "", "Send");
  send.type = "submit";
  form.append(input, send);
  const footer = make("div", "chat-footer", copy.footer);
  widget.append(head, body, quick, form, footer);
  document.body.append(widget);

  let messages = [];
  let busy = false;
  const STORAGE_KEY = "ocatech_chat_v2";

  const say = (text, user = false) => {
    const bubble = make("div", `chat-message${user ? " user" : ""}`);
    bubble.innerHTML = formatText(text);
    body.append(bubble);
    body.scrollTop = body.scrollHeight;
  };

  const showTyping = () => {
    if (document.getElementById("chat-typing")) return;
    const bubble = make("div", "chat-message typing");
    bubble.id = "chat-typing";
    bubble.setAttribute("aria-label", "Counselor is typing...");
    bubble.innerHTML = "<span></span><span></span><span></span>";
    body.append(bubble);
    body.scrollTop = body.scrollHeight;
  };

  const hideTyping = () => {
    const typing = document.getElementById("chat-typing");
    if (typing) typing.remove();
  };

  const saveSession = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  };

  const loadSession = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          messages = parsed;
          parsed.forEach((m) => {
            say(m.content, m.role === "user");
          });
          return true;
        }
      }
    } catch {}
    return false;
  };

  const whatsappLink = (contextText) => {
    const link = make("a", "button button-wa", copy.whatsapp);
    const msg = contextText
      ? `Hello OCATECH, I was asking the website counselor about: "${contextText}". Could you please give me more details?`
      : "Hello OCATECH, I would like to know more about your courses and admissions.";
    link.href = `https://wa.me/2348165321429?text=${encodeURIComponent(msg)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const notice = document.createElement("span");
    notice.className = "sr-only";
    notice.textContent = " (opens in a new tab)";
    link.append(notice);
    return link;
  };

  quickReplies();
  function quickReplies() {
    copy.quickReplies.forEach((item) => {
      const chip = make("button", "", item.label);
      chip.type = "button";
      chip.addEventListener("click", () => {
        if (item.wa) {
          say("I will connect you directly with our admissions officer on WhatsApp!");
          const link = whatsappLink("Registration and admissions inquiry");
          body.append(link);
          body.scrollTop = body.scrollHeight;
          return;
        }
        ask(item.query);
      });
      quick.append(chip);
    });
  }

  const toggle = () => {
    const isClosed = widget.hidden;
    widget.hidden = !isClosed;
    button.setAttribute("aria-expanded", String(isClosed));
    if (isClosed) {
      input.focus();
    } else {
      button.focus();
    }
  };

  button.addEventListener("click", toggle);
  close.addEventListener("click", toggle);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !widget.hidden) {
      toggle();
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (!widget.hidden && !widget.contains(e.target) && !button.contains(e.target)) {
      widget.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });

  const ask = async (text) => {
    if (busy) return;
    const content = text.trim().slice(0, 600);
    if (!content) return;
    say(content, true);
    messages = [...messages, { role: "user", content }].slice(-10);
    saveSession();
    input.value = "";
    busy = true;
    send.disabled = true;
    showTyping();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ messages }),
      });
      hideTyping();
      const data = await response.json();
      if (!response.ok) {
        say(data.message || copy.error);
        if (data.whatsappUrl) {
          const link = whatsappLink(content);
          link.href = data.whatsappUrl;
          body.append(link);
        }
        return;
      }
      const reply = data.reply || copy.handoff;
      say(reply);
      messages = [...messages, { role: "assistant", content: reply }].slice(-10);
      saveSession();
      if (data.handoff || reply.includes("WhatsApp") || reply.includes("register")) {
        const link = whatsappLink(content);
        if (data.whatsappUrl) link.href = data.whatsappUrl;
        body.append(link);
      }
    } catch {
      hideTyping();
      say(copy.error);
    } finally {
      busy = false;
      send.disabled = false;
      body.scrollTop = body.scrollHeight;
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });

  const restored = loadSession();
  if (!restored) {
    say(copy.greeting);
  }
  widget.hidden = true;
  if (window.OCATECH_CHAT_READY) toggle();
})();
