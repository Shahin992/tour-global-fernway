/* Fernway Journeys: interactions that work with or without the animation layer. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* Header: solid once scrolled; tucks away while reading down, returns on scroll up or focus */
  const header = $("[data-header]");
  if (header) {
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > 480 && y > lastY + 2 && !document.body.classList.contains("menu-open"));
      if (y < lastY - 2) header.classList.remove("is-hidden");
      lastY = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    onScroll();
  }

  /* Full-screen menu: a native <dialog>, so focus trapping and Esc come for free */
  const menu = $("[data-menu]");
  const openBtn = $("[data-menu-open]");
  if (menu && openBtn && typeof menu.showModal === "function") {
    openBtn.addEventListener("click", () => {
      menu.showModal();
      document.body.classList.add("menu-open");
      openBtn.setAttribute("aria-expanded", "true");
      document.dispatchEvent(new CustomEvent("fernway:menu-open"));
    });
    $("[data-menu-close]", menu)?.addEventListener("click", () => menu.close());
    menu.addEventListener("close", () => {
      document.body.classList.remove("menu-open");
      openBtn.setAttribute("aria-expanded", "false");
      openBtn.focus();
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", () => menu.close()));
  }

  /* Destination rail: arrow buttons + a progress line tied to the scroll position */
  $$("[data-rail]").forEach((wrap) => {
    const rail = $(".rail", wrap);
    const prev = $("[data-rail-prev]", wrap);
    const next = $("[data-rail-next]", wrap);
    const bar = $(".rail-progress span", wrap);
    if (!rail) return;
    const step = () => ($(".rail-card", rail)?.offsetWidth || 300) + 24;
    prev?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    next?.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const visible = rail.clientWidth / rail.scrollWidth;
      const p = max > 0 ? rail.scrollLeft / max : 1;
      if (bar) bar.style.transform = `scaleX(${Math.min(1, visible + p * (1 - visible))})`;
      if (prev) prev.disabled = rail.scrollLeft < 4;
      if (next) next.disabled = rail.scrollLeft > max - 4;
    };
    rail.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  });

  /* Trip filters on /trips/ (also reads ?style= so links can pre-filter) */
  const filters = $("[data-filters]");
  if (filters) {
    const cards = $$("[data-cat]");
    const empty = $("[data-empty]");
    const count = $("[data-count-label]");
    const apply = (cat) => {
      $$("button[data-filter]", filters).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === cat)));
      let shown = 0;
      cards.forEach((card) => {
        const show = cat === "all" || card.dataset.cat.split(" ").includes(cat);
        card.hidden = !show;
        if (show) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = `Showing ${shown} of ${cards.length} trips`;
    };
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filter]");
      if (b) apply(b.dataset.filter);
    });
    const preset = new URLSearchParams(location.search).get("style");
    if (preset && $(`button[data-filter="${CSS.escape(preset)}"]`, filters)) apply(preset);
  }

  /* Enquiry form: pre-selects ?trip=, then confirms in place (demo: nothing is sent) */
  const form = $("[data-enquiry]");
  if (form) {
    const trip = new URLSearchParams(location.search).get("trip");
    const select = form.elements.namedItem("trip");
    if (trip && select && Array.from(select.options).some((o) => o.value === trip)) select.value = trip;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const box = $("[data-enquiry-success]");
      const first = (form.elements.namedItem("name").value || "").trim().split(/\s+/)[0];
      $("[data-success-name]", box).textContent = first || "there";
      box.hidden = false;
      form.querySelector('button[type="submit"]').disabled = true;
      box.focus();
    });
  }

  /* Newsletter: inline confirmation (demo) */
  $$("[data-newsletter]").forEach((f) => {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      $("[data-newsletter-status]", f).textContent = "Thank you. Your first dispatch arrives at the start of next month.";
      f.querySelector("button").disabled = true;
    });
  });

  $$("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
