(() => {
  const root = document.querySelector("#skill-picker");
  const result = document.querySelector("#picker-result");
  if (!root || !result || !root.dataset.src) return;

  let data = { courses: [], choices: [] };
  let selected = null;
  const names = new Map(data.courses.map((course) => [course.slug, course.name]));

  const makeLink = (slug) => {
    const link = document.createElement("a");
    link.href = `/courses/${slug}/`;
    link.textContent = names.get(slug) || slug;
    return link;
  };

  const render = () => {
    result.replaceChildren();
    if (!selected) {
      result.textContent = "Choose an option above to see matching courses.";
      return;
    }
    const heading = document.createElement("strong");
    heading.textContent = "Good fit for you:";
    const list = document.createElement("ul");
    selected[1].forEach((slug) => {
      const item = document.createElement("li");
      item.append(makeLink(slug));
      list.append(item);
    });
    const actions = document.createElement("div");
    actions.className = "hero-actions";
    const text = `Hello OCATECH, I am interested in: ${selected[1].map((slug) => names.get(slug) || slug).join(", ")}`;
    const whatsapp = document.createElement("a");
    whatsapp.className = "button button-wa";
    whatsapp.href = `https://wa.me/2348165321429?text=${encodeURIComponent(text)}`;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.append(document.createTextNode("Chat on WhatsApp"));
    const notice = document.createElement("span");
    notice.className = "sr-only";
    notice.textContent = " (opens in a new tab)";
    whatsapp.append(notice);
    const apply = document.createElement("a");
    apply.className = "button button-quiet";
    apply.href = "/apply/";
    apply.textContent = "Apply now";
    actions.append(whatsapp, apply);
    result.append(heading, list, actions);
  };

  const build = () => {
    data.courses.forEach((course) => names.set(course.slug, course.name));
    data.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "picker-choice";
      button.textContent = choice[0];
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        selected = choice;
        root.querySelectorAll(".picker-choice").forEach((node, i) => {
          node.setAttribute("aria-pressed", String(i === index));
        });
        render();
        result.scrollIntoView({ block: "nearest" });
      });
      root.append(button);
    });
    render();
  };

  fetch(root.dataset.src)
    .then((response) => response.json())
    .then((payload) => {
      data = payload;
      build();
    })
    .catch(() => {
      result.textContent = "Choose a course from the list below.";
    });
})();
