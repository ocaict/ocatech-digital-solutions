(() => {
  const button = document.querySelector(".chat-open");
  if (!button || document.querySelector(".chat-widget")) return;

  const copy = {
    name: "OCATECH Assistant",
    header: "OCATECH Assistant. Answers about our courses and services.",
    greeting: "Hello! I can answer questions about OCATECH’s courses, payment and location. What would you like to know?",
    quickReplies: ["Courses", "How do I pay?", "Where are you?", "Talk to a person"],
    placeholder: "Type your question",
    footer: "Answers come from OCATECH information. For anything urgent, use WhatsApp.",
    safety: "Do not type passwords or bank details.",
    error: "Something went wrong. Please try again or message us on WhatsApp.",
    handoff: "I do not have that information. Please ask our team directly on WhatsApp.",
    whatsapp: "Chat on WhatsApp",
  };

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const widget = make("section", "chat-widget");
  widget.setAttribute("role", "dialog");
  widget.setAttribute("aria-label", copy.name);
  const head = make("div", "chat-head");
  const heading = make("h2", "", copy.name);
  heading.title = copy.header;
  const close = make("button", "chat-close", "Close");
  close.type = "button";
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
  const footer = make("div", "chat-footer", `${copy.footer} ${copy.safety}`);
  widget.append(head, body, quick, form, footer);
  document.body.append(widget);

  let messages = [];
  let busy = false;

  const say = (text, user = false) => {
    const bubble = make("p", `chat-message${user ? " user" : ""}`, text);
    body.append(bubble);
    body.scrollTop = body.scrollHeight;
  };

  const whatsappLink = () => {
    const link = make("a", "button button-wa", copy.whatsapp);
    link.href = `https://wa.me/2348165321429?text=${encodeURIComponent("Hello OCATECH, I would like to know more about your courses.")}`;
    return link;
  };

  quickReplies();
  function quickReplies() {
    copy.quickReplies.forEach((label) => {
      const chip = make("button", "", label);
      chip.type = "button";
      chip.addEventListener("click", () => {
        if (label === "Talk to a person") {
          say(copy.handoff);
          const link = whatsappLink();
          body.append(link);
          return;
        }
        ask(label);
      });
      quick.append(chip);
    });
  }

  const toggle = () => {
    const open = widget.hidden;
    widget.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  };

  button.addEventListener("click", toggle);
  close.addEventListener("click", toggle);

  const ask = async (text) => {
    if (busy) return;
    const content = text.trim().slice(0, 500);
    if (!content) return;
    say(content, true);
    messages = [...messages, { role: "user", content }].slice(-6);
    input.value = "";
    busy = true;
    send.disabled = true;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await response.json();
      if (!response.ok) {
        say(data.message || copy.error);
        if (data.whatsappUrl) {
          const link = whatsappLink();
          link.href = data.whatsappUrl;
          body.append(link);
        }
        return;
      }
      say(data.reply || copy.handoff);
      messages = [...messages, { role: "assistant", content: data.reply || copy.handoff }].slice(-6);
      if (data.handoff) {
        const link = whatsappLink();
        body.append(link);
      }
    } catch {
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

  say(copy.greeting);
  widget.hidden = true;
  if (window.OCATECH_CHAT_READY) toggle();
})();
