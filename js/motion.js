/* Fernway Journeys: cinematic animation layer built on Motion (the vanilla-JS edition of Framer Motion).
   Slow, eased, never bouncy. Loaded as a module; with reduced motion or no JS every element is already
   visible and static, because initial states are only applied here. */
import { animate, scroll, inView, stagger } from "https://cdn.jsdelivr.net/npm/motion@14.3.0/+esm";

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = [0.16, 1, 0.3, 1]; // long, soft deceleration, no overshoot
const SLOW = 1.15;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* content blocks that rise into place as they enter the viewport */
const BLOCKS = [
  ".section-head > .overline", ".section-head > .lede", ".section-head-actions", ".standfirst > .overline", ".standfirst-text",
  ".facts > div", ".feature", ".rail-foot", ".promise", ".principle", ".pullquote blockquote", ".pullquote figcaption",
  ".stat", ".steps li", ".band-foot", ".rows li", ".faq-head", ".faq-list details", ".closing-text", ".trip-card", ".filters",
  ".trip-summary > div", ".love li", ".itinerary li", ".incl > div", ".note", ".review", ".book-card", ".table-wrap", ".route",
  ".sample", ".person", ".columns-text", ".contact-side .block", ".contact-form", ".in-short", ".prose > p", ".prose > h2",
  ".prose > ul", ".prose > ol", ".prose > blockquote", ".toc",
].join(",");

if (reduceMotion) {
  root.classList.remove("m-pending");
} else {
  root.classList.add("motion");
  splitHeadings();
  intro();
  progressBar();
  revealBlocks();
  railEntrance();
  wipeImages();
  parallax();
  stickySplit();
  marquee();
  counters();
  menuReveal();
  faqHeights();
}

/* ---------- split headings into masked words (text stays in the DOM for SEO) ---------- */
function splitHeadings() {
  $$(".hero h1, .mast h1, .section-title, .closing .section-title").forEach((h) => {
    if (h.dataset.splitDone) return;
    h.dataset.splitDone = "1";
    wrapWords(h);
  });
}
function wrapWords(node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 3) {
      const parts = child.textContent.split(/( +)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^ +$/.test(part)) { frag.append(" "); return; }
        const outer = document.createElement("span");
        outer.className = "split-word";
        const inner = document.createElement("span");
        inner.textContent = part;
        outer.append(inner);
        frag.append(outer);
      });
      child.replaceWith(frag);
    } else if (child.nodeType === 1 && child.tagName !== "BR") {
      wrapWords(child);
    }
  });
}
function words(el) { return el ? $$(".split-word > span", el) : []; }

/* ---------- first paint: hero / masthead ---------- */
function intro() {
  const hero = $(".hero") || $(".mast");
  if (!hero) { root.classList.remove("m-pending"); return; }
  const h1 = $("h1", hero);
  const heroImg = $(".hero-media img", hero);
  const figure = $(".mast-figure");
  const items = $$("[data-m-hero]", hero);

  // set starting states, then lift the CSS guard in the same frame: no flash of final content
  words(h1).forEach((w) => { w.style.transform = "translateY(110%)"; });
  items.forEach((el) => { el.style.opacity = "0"; });
  if (figure) figure.style.clipPath = "inset(100% 0 0 0)";
  root.classList.remove("m-pending");

  if (heroImg) animate(heroImg, { opacity: [0, 1], scale: [1.16, 1] }, { duration: 2.6, ease: EASE });
  animate(words(h1), { y: ["110%", "0%"] }, { duration: 1.2, delay: stagger(0.055, { startDelay: 0.2 }), ease: EASE });
  animate(items, { opacity: [0, 1], y: [22, 0] }, { duration: SLOW, delay: stagger(0.08, { startDelay: 0.45 }), ease: EASE });
  if (figure) {
    animate(figure, { clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"] }, { duration: 1.5, delay: 0.35, ease: EASE });
    const img = $("img", figure);
    if (img) animate(img, { scale: [1.18, 1] }, { duration: 2.2, delay: 0.35, ease: EASE });
  }
}

/* ---------- reading progress ---------- */
function progressBar() {
  const bar = $(".m-progress");
  if (bar) scroll(animate(bar, { scaleX: [0, 1] }, { ease: "linear" }));
}

/* ---------- section titles + content blocks rise into place ---------- */
function revealBlocks() {
  $$(".section-title").forEach((title) => {
    if (title.closest(".hero, .mast")) return;
    const w = words(title);
    w.forEach((s) => { s.style.transform = "translateY(110%)"; });
    inView(title, () => {
      animate(w, { y: ["110%", "0%"] }, { duration: 1.1, delay: stagger(0.045), ease: EASE });
    }, { margin: "0px 0px -10% 0px" });
  });

  const groups = new Map();
  $$(BLOCKS).forEach((el) => {
    if (el.closest(".hero, .mast, [hidden], .menu")) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  // siblings that enter together are staggered by their order in the group
  groups.forEach((els) => {
    els.forEach((el, i) => {
      inView(el, () => {
        animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: SLOW, delay: Math.min(i % 4, 3) * 0.09, ease: EASE });
      }, { margin: "0px 0px -8% 0px" });
    });
  });
}

/* ---------- destination rail: the cards glide in from the right together, including those off-screen ---------- */
function railEntrance() {
  $$(".rail").forEach((rail) => {
    const cards = $$(".rail-card", rail);
    cards.forEach((c) => { c.style.opacity = "0"; });
    inView(rail, () => {
      animate(cards, { opacity: [0, 1], x: [80, 0] }, { duration: 1.3, delay: stagger(0.08), ease: EASE });
    }, { margin: "0px 0px -10% 0px" });
  });
}

/* ---------- photographs open with a bottom-up clip wipe ---------- */
function wipeImages() {
  $$(".frame").forEach((frame) => {
    if (frame.closest(".hero, .mast, .menu, .rail")) return;
    const img = $("img", frame);
    const still = frame.hasAttribute("data-parallax");
    frame.style.clipPath = "inset(100% 0 0 0)";
    inView(frame, () => {
      animate(frame, { clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"] }, { duration: 1.35, ease: EASE });
      if (img && !still) animate(img, { scale: [1.2, 1] }, { duration: 1.9, ease: EASE });
    }, { margin: "0px 0px -6% 0px" });
  });
}

/* ---------- slow parallax drift on selected photographs ---------- */
function parallax() {
  $$("[data-parallax]").forEach((frame) => {
    const img = $("img", frame);
    if (!img) return;
    img.style.scale = "1.14";
    scroll(animate(img, { y: ["-6%", "6%"] }, { ease: "linear" }), { target: frame, offset: ["start end", "end start"] });
  });
}

/* ---------- "How we travel": the pinned photo follows the principle being read ---------- */
function stickySplit() {
  const split = $("[data-split-sticky]");
  if (!split) return;
  const frames = $$(".split-media .frame", split);
  $$(".principle", split).forEach((p, i) => {
    inView(p, () => {
      frames.forEach((f, j) => f.classList.toggle("is-active", j === i));
      const img = frames[i] && $("img", frames[i]);
      if (img) animate(img, { scale: [1.08, 1] }, { duration: 1.6, ease: EASE });
      return () => {};
    }, { amount: 0.55 });
  });
}

/* ---------- destination marquee (paused while off-screen) ---------- */
function marquee() {
  $$("[data-marquee]").forEach((wrap) => {
    const track = $(".marquee-track", wrap);
    const anim = animate(track, { x: ["0%", "-50%"] }, { duration: 42, repeat: Infinity, ease: "linear" });
    anim.pause();
    inView(wrap, () => { anim.play(); return () => anim.pause(); });
  });
}

/* ---------- numbers count up once ---------- */
function counters() {
  $$("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const fmt = (v) => (el.dataset.prefix || "") + v.toLocaleString("en", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (el.dataset.suffix || "");
    el.textContent = fmt(0);
    inView(el, () => {
      animate(0, target, { duration: 2, ease: EASE, onUpdate: (v) => { el.textContent = fmt(v); } });
    }, { amount: 0.6 });
  });
}

/* ---------- overlay menu: curtain drop, then links rise one by one ---------- */
function menuReveal() {
  const menu = $("[data-menu]");
  if (!menu) return;
  document.addEventListener("fernway:menu-open", () => {
    animate(menu, { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] }, { duration: 0.85, ease: EASE });
    animate($$(".menu-link", menu), { y: [56, 0], opacity: [0, 1] }, { duration: 0.95, delay: stagger(0.06, { startDelay: 0.25 }), ease: EASE });
    animate($$(".menu-num, .menu-aside, .menu-top", menu), { opacity: [0, 1] }, { duration: 0.8, delay: 0.35, ease: EASE });
  });
}

/* ---------- FAQ answers open and close smoothly ---------- */
function faqHeights() {
  $$(".faq-list details").forEach((d) => {
    const summary = $("summary", d);
    const body = $(".faq-a", d);
    if (!summary || !body) return;
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = "1";
      if (!d.open) {
        d.open = true;
        const h = body.scrollHeight;
        animate(body, { height: [0, h], opacity: [0, 1] }, { duration: 0.6, ease: EASE }).then(() => {
          body.style.height = ""; delete d.dataset.busy;
        });
      } else {
        animate(body, { height: [body.offsetHeight, 0], opacity: [1, 0] }, { duration: 0.45, ease: EASE }).then(() => {
          d.open = false; body.style.height = ""; body.style.opacity = ""; delete d.dataset.busy;
        });
      }
    });
  });
}
