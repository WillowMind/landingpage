(function () {
  const faqButtons = Array.from(document.querySelectorAll("#faqList button"));
  faqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const opening = btn.getAttribute("aria-expanded") !== "true";
      faqButtons.forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        document.getElementById(b.getAttribute("aria-controls")).hidden = true;
      });
      if (opening) {
        btn.setAttribute("aria-expanded", "true");
        document.getElementById(btn.getAttribute("aria-controls")).hidden = false;
      }
    });
  });
})();
