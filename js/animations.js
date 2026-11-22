(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  root.classList.add("js");

  // Hero entrance: words blur in, the rest rises
  const h1 = document.querySelector(".hero h1");
  if (h1) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute("aria-label", words.join(" "));
    h1.innerHTML = words.map((w, i) =>
      `<span class="hw" aria-hidden="true" style="transition-delay:${i * 0.12}s">${w}</span>`).join(" ");
  }
  document.querySelectorAll(".hero .tag, .hero .lead, .hero-actions, .crisis, .hero-banner")
    .forEach((el, i) => { el.classList.add("hero-rise"); el.style.transitionDelay = (0.5 + i * 0.12) + "s"; });
  function go() { requestAnimationFrame(() => root.classList.add("hero-go")); }
  if (root.classList.contains("has-splash")) window.addEventListener("splash-done", go, { once: true });
  else go();

  // Scroll reveals
  const targets = [
    [".section-head, .section h2, .section .lead", ""],
    [".stat", ""], [".tabs", ""], [".steps li", "from-left"],
    [".card-other", "from-left"], [".card-willow", "from-right"],
    [".faq-item", ""], [".member", ""], ["#waitlist form", "from-right"], ["#waitlist .wrap > div:first-child", "from-left"],
    [".cta-art", ""], [".footer .wrap", ""]
  ];
  const seen = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  targets.forEach(([sel, dir]) => document.querySelectorAll(sel).forEach((el, i) => {
    if (seen.has(el) || el.closest(".hero")) return;
    seen.add(el);
    el.classList.add("reveal");
    if (dir) el.classList.add(dir);
    el.style.transitionDelay = Math.min(i, 4) * 0.08 + "s";
    io.observe(el);
  }));

  // Fast jumps (anchor links, End key) can skip past elements: reveal anything already above the fold
  window.addEventListener("scroll", () => {
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) { el.classList.add("in"); io.unobserve(el); }
    });
  }, { passive: true });

  // Cursor-reactive dot grid (like Framer's Magnetic Grid, "scaler" mode)
  const cv = document.getElementById("dotGrid");
  if (cv) {
    const ctx = cv.getContext("2d");
    const GAP = 20, BASE = 0.6, INTENSITY = 1.2, RADIUS = 220;
    let w = 0, h = 0, dots = [], mx = -9999, my = -9999, dpr = 1, running = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      const cols = Math.floor(w / GAP), rows = Math.floor(h / GAP);
      const ox = (w - (cols - 1) * GAP) / 2, oy = (h - (rows - 1) * GAP) / 2;
      dots = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
        dots.push({ x: ox + c * GAP, y: oy + r * GAP, s: BASE });
    }
    function frame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      let moving = false;
      for (const d of dots) {
        const dist = Math.hypot(d.x - mx, d.y - my);
        const k = dist < RADIUS ? 1 - dist / RADIUS : 0;
        const target = BASE + k * k * INTENSITY * 2.2;
        d.s += (target - d.s) * 0.14;
        if (Math.abs(target - d.s) > 0.01) moving = true;
        ctx.globalAlpha = 0.55 + Math.min(k, 1) * 0.45;
        ctx.beginPath(); ctx.arc(d.x, d.y, 2 * d.s, 0, 6.2832); ctx.fill();
      }
      running = moving;
      if (moving) requestAnimationFrame(frame);
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
    const box = cv.parentElement;
    box.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; kick();
    });
    box.addEventListener("pointerleave", () => { mx = my = -9999; kick(); });
    window.addEventListener("resize", () => { size(); kick(); });
    size(); frame();
    // The banner is aria-hidden and sits under the hero text; allow pointer events on it
    box.parentElement.style.pointerEvents = "auto";
    window.addEventListener("load", () => cv.classList.add("on"));
    setTimeout(() => cv.classList.add("on"), 300);
  }

  // Smooth (inertia) scrolling, mouse wheel only
  if (matchMedia("(pointer: fine)").matches) {
    let target = window.scrollY, cur = target, raf = 0;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    function tick() {
      cur += (target - cur) * 0.1;
      if (Math.abs(target - cur) < 0.4) { cur = target; raf = 0; } else raf = requestAnimationFrame(tick);
      window.scrollTo(0, cur);
    }
    window.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.defaultPrevented || root.classList.contains("has-splash")) return;
      if (e.target.closest("textarea, select")) return;
      e.preventDefault();
      target = Math.max(0, Math.min(max(), target + e.deltaY));
      if (!raf) { cur = window.scrollY; raf = requestAnimationFrame(tick); }
    }, { passive: false });
    window.addEventListener("scroll", () => { if (!raf) target = cur = window.scrollY; });
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href") === "#") return;
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      target = Math.max(0, Math.min(max(), t.getBoundingClientRect().top + window.scrollY - 70));
      if (!raf) { cur = window.scrollY; raf = requestAnimationFrame(tick); }
    });
  }
})();
