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

  /* ---------- Hero video: fade in once playing, then crossfade-loop ----------
     Two copies of the same video are stacked. Shortly before the visible one
     ends, the other restarts from 0 and fades in on top, so the jump from the
     last frame back to the first is never seen. */
  var vidA = document.getElementById("heroVideo");
  var vidB = document.getElementById("heroVideo2");
  if (vidA && vidB) {
    var vids = [vidA, vidB], cur = 0, fading = false;
    var XFADE = 1.2;  // seconds the two copies overlap
    var LEAD = 0.4;   // extra head start so the incoming copy is already running
    var SRC = vidA.currentSrc || vidA.src;

    var reveal = function () { vidA.style.zIndex = 1; vidA.classList.add("is-on"); };
    if (!vidA.paused && vidA.readyState > 2) reveal();
    else vidA.addEventListener("playing", reveal, { once: true });

    // Pull the whole file into memory once, so looping never waits on the
    // network/disk. Copy B uses it straight away; copy A switches over the
    // first time it is hidden. Falls back to the plain file if fetch fails.
    var blobUrl = null;
    var primeIdle = function (v) {
      v.pause();
      if (blobUrl && v.src !== blobUrl) { v.src = blobUrl; v.load(); }
      else v.currentTime = 0;
    };
    var useFile = function () { if (!vidB.src) { vidB.src = SRC; vidB.load(); } };
    if (window.fetch && window.URL && URL.createObjectURL) {
      fetch(SRC).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { blobUrl = URL.createObjectURL(b); if (!fading) primeIdle(vids[1 - cur]); })
        .catch(useFile);
    } else useFile();

    // resolve once the video has actually painted a new frame
    var onFrame = function (v, cb) {
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(function () { cb(); });
      else v.addEventListener("playing", cb, { once: true });
    };

    var crossfade = function () {
      fading = true;
      var out = vids[cur], inc = vids[1 - cur];
      if (!inc.src) useFile();
      inc.style.zIndex = 2;
      out.style.zIndex = 1;
      var p = inc.play();
      if (p && p.catch) p.catch(function () {});
      // only start fading in once frames are flowing — any startup hiccup
      // happens while the incoming copy is still invisible
      onFrame(inc, function () {
        inc.style.transition = "opacity " + XFADE + "s linear";
        inc.classList.add("is-on");
        setTimeout(function () {
          out.classList.remove("is-on");
          cur = 1 - cur;
          fading = false;
          // rewind the hidden copy well ahead of the next loop
          setTimeout(function () { primeIdle(out); }, 300);
        }, XFADE * 1000 + 60);
      });
    };

    var watch = function () {
      var v = vids[cur];
      if (!fading && v.duration && (v.ended || v.currentTime >= v.duration - XFADE - LEAD)) crossfade();
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }

  /* ---------- Magnetic dot grid (hero) ---------- */
  var grid = document.getElementById("magneticGrid");
  if (grid) {
    var dots = [];
    var SCALE = 0.55, INTENSITY = 0.8, RADIUS = 200;
    var build = function () {
      var cols = DESKTOP.matches ? 48 : (PHONE.matches ? 16 : 36);
      var rows = DESKTOP.matches ? 16 : 20;
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
      // read every position first, then write — interleaving the two forced
      // a full layout per dot and made the video underneath stutter
      var n = dots.length, scales = new Array(n), i;
      for (i = 0; i < n; i++) {
        var b = dots[i].parentNode.getBoundingClientRect();
        var dist = Math.hypot(px - (b.left + b.width / 2), py - (b.top + b.height / 2));
        scales[i] = dist < RADIUS ? SCALE * (1 + INTENSITY * (1 - dist / RADIUS)) : SCALE;
      }
      for (i = 0; i < n; i++) dots[i].style.setProperty("--s", scales[i].toFixed(3));
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
     Submissions are emailed to the Willow inbox through FormSubmit
     (formsubmit.co). The very first submission triggers an activation email
     to that inbox; nothing is delivered until the link in it is clicked. */
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/willowmind.co@gmail.com";
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
      var data = new FormData(form);
      // let "Reply" in Gmail go straight to the person, when they gave an email
      var contact = String(data.get("Email or phone") || "").trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) data.set("_replyto", contact);
      fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : { success: false }; })
        .then(function (res) { done(res && String(res.success) === "true"); })
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
