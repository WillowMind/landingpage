// Owner: Poorna
// 0. Splash screen
// Logo rises in, then after 1.5s the cream panel wipes up (0.9s) and we remove it.
(function () {
  const splash = document.getElementById("splash");
  const root = document.documentElement;
  if (!splash || !root.classList.contains("has-splash")) return;

  function finish() {
    if (!document.getElementById("splash")) return;
    splash.remove();
    root.classList.remove("has-splash");
    window.dispatchEvent(new Event("splash-done"));
  }
  setTimeout(() => {
    splash.classList.add("leaving");
    setTimeout(finish, 950);
  }, 1500);
  // Safety net so the page can never stay hidden
  setTimeout(finish, 5000);
})();
