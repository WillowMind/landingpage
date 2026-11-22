/* =========================================================
   Willow — landing page interactions
   Re-creates the Framer behaviours:
   preloader, on-mount + in-view appear effects, word blur-in title,
   mobile/tablet menu, services hover tabs, FAQ accordion,
   magnetic dot grid, waitlist form states and smooth scrolling.
   ========================================================= */
(function () {
  "use strict";

  var DESKTOP = window.matchMedia("(min-width: 1200px)");
  var PHONE = window.matchMedia("(max-width: 809.98px)");
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Preloader (desktop only, 3 s total) ---------- */
  var preloader = document.getElementById("preloader");
  if (preloader) {
    if (DESKTOP.matches && !REDUCED.matches) {
      setTimeout(function () { preloader.classList.add("is-leaving"); }, 1500);
      setTimeout(function () { preloader.classList.add("is-done"); }, 3000);
    } else {
      preloader.classList.add("is-done");
    }
  }

  /* ---------- Hero title: split into words ---------- */
  document.querySelectorAll("[data-split-words]").forEach(function (el) {
    var words = el.textContent.trim().split(/(\s+)/);
    el.textContent = "";
    var i = 0;
    words.forEach(function (w) {
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(" ")); return; }
      var span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      span.style.transitionDelay = (i * 0.05).toFixed(2) + "s";
      el.appendChild(span);
      i++;
    });
  });

  /* ---------- On-mount appear effects (hero) ---------- */
  document.querySelectorAll(".mount-up, .mount-fade, .mount-zoom").forEach(function (el) {
    var delay = parseFloat(el.getAttribute("data-delay") || "0") * 1000;
    if (REDUCED.matches) delay = 0;
    setTimeout(function () {
      el.classList.add("is-in");
      if (el.hasAttribute("data-split-words")) el.classList.add("words-in");
    }, delay);
  });

  /* ---------- In-view appear effects ---------- */
  var inViewEls = document.querySelectorAll(".in-view, .in-view-left, .in-view-right");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var d = parseFloat(el.getAttribute("data-delay") || "0.1");
        el.style.transitionDelay = d + "s";
        el.classList.add("is-in");
        // clear the delay after the entrance so hover/state transitions stay snappy
        setTimeout(function () { el.style.transitionDelay = ""; }, (d + 1) * 1000);
        io.unobserve(el);
      });
    }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
    inViewEls.forEach(function (el) { io.observe(el); });
  } else {
    inViewEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Navigation menu (tablet + phone) ---------- */
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("navMenu");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (nav && menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.querySelectorAll(".nav__link, .nav__cta, .nav__logo").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    DESKTOP.addEventListener("change", function () { setMenu(false); });
  }

  /* ---------- Services: hover / tap to switch ---------- */
  var svc = document.getElementById("svc");
  if (svc) {
    var items = svc.querySelectorAll(".svc__item");
    var descs = svc.querySelectorAll(".svc__desc");
    var activate = function (idx) {
      items.forEach(function (it) { it.classList.toggle("is-active", it.dataset.index === idx); });
      descs.forEach(function (d) { d.classList.toggle("is-active", d.dataset.index === idx); });
    };
    items.forEach(function (it) {
      it.addEventListener("mouseenter", function () { activate(it.dataset.index); });
      it.addEventListener("focus", function () { activate(it.dataset.index); });
      it.addEventListener("click", function () { activate(it.dataset.index); });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".acc").forEach(function (acc) {
    var head = acc.querySelector(".acc__head");
    acc.addEventListener("click", function () {
      var open = !acc.classList.contains("is-open");
      acc.classList.toggle("is-open", open);
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- Magnetic dot grid (hero) ---------- */
  var grid = document.getElementById("magneticGrid");
  if (grid) {
    var dots = [];
    var SCALE = 0.6, INTENSITY = 1.2, RADIUS = 220;
    var build = function () {
      var cols = DESKTOP.matches ? 24 : (PHONE.matches ? 8 : 18);
      var rows = DESKTOP.matches ? 8 : 10;
      grid.style.setProperty("--cols", cols);
      grid.style.setProperty("--rows", rows);
      grid.innerHTML = "";
      dots = [];
      for (var i = 0; i < cols * rows; i++) {
        var cell = document.createElement("div");
        cell.className = "magnetic-grid__cell";
        var dot = document.createElement("div");
        dot.className = "magnetic-grid__dot";
        cell.appendChild(dot);
        grid.appendChild(cell);
        dots.push(dot);
      }
      size();
    };
    var size = function () {
      var first = grid.firstElementChild;
      if (!first) return;
      var r = first.getBoundingClientRect();
      grid.style.setProperty("--dot", Math.max(2, Math.min(r.width, r.height)) + "px");
    };
    var raf = 0, px = -9999, py = -9999;
    var update = function () {
      raf = 0;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var b = d.parentNode.getBoundingClientRect();
        var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        var dist = Math.hypot(px - cx, py - cy);
        var s = SCALE;
        if (dist < RADIUS) s = SCALE * (1 + INTENSITY * (1 - dist / RADIUS));
        d.style.setProperty("--s", s.toFixed(3));
      }
    };
    var area = grid.parentElement;
    area.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    });
    area.addEventListener("pointerleave", function () {
      px = py = -9999;
      if (!raf) raf = requestAnimationFrame(update);
    });
    build();
    window.addEventListener("resize", size);
    DESKTOP.addEventListener("change", build);
    PHONE.addEventListener("change", build);
  }

  /* ---------- Waitlist form ----------
     Framer handled submissions on its servers. Set FORM_ENDPOINT to your own
     endpoint (Formspree, Supabase function, etc.) to receive entries.
     With no endpoint the button plays the same Loading → Success states. */
  var FORM_ENDPOINT = "";
  var form = document.getElementById("waitlistForm");
  var formBtn = document.getElementById("formBtn");
  if (form && formBtn) {
    var status = formBtn.querySelector(".form-btn__t--status");
    var setState = function (state, text) {
      formBtn.setAttribute("data-state", state);
      status.textContent = text || "";
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formBtn.getAttribute("data-state") === "loading") return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      setState("loading", "Loading");
      var done = function (ok) {
        if (ok) { setState("success", "Your message has been sent"); form.reset(); }
        else { setState("error", "An error has occured"); }
        setTimeout(function () { setState("idle"); }, 4000);
      };
      if (!FORM_ENDPOINT) { setTimeout(function () { done(true); }, 1200); return; }
      fetch(FORM_ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { done(r.ok); })
        .catch(function () { done(false); });
    });
  }

  /* ---------- Smooth scroll (Framer "Smooth Scroll", intensity 10) ---------- */
  var lenis = null;
  function scrollToHash(hash) {
    var target = hash === "#" ? document.body : document.querySelector(hash);
    if (!target) return false;
    if (lenis) lenis.scrollTo(target === document.body ? 0 : target);
    else target.scrollIntoView({ behavior: REDUCED.matches ? "auto" : "smooth" });
    return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute("href");
    if (scrollToHash(hash)) {
      e.preventDefault();
      if (hash.length > 1) history.replaceState(null, "", hash);
    }
  });

  if (!REDUCED.matches) {
    var s = document.createElement("script");
    s.src = "https://unpkg.com/lenis@1.1.20/dist/lenis.min.js";
    s.async = true;
    s.onload = function () {
      if (!window.Lenis) return;
      lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
      var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    };
    document.head.appendChild(s);
  }
})();
