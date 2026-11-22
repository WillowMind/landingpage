// Owner: Sadeesha
// Waitlist form (prototype, nothing is sent)
(function () {
  // This is a prototype, so nothing is sent anywhere. To collect real
  // sign-ups later, send `data` to your backend inside the submit handler.
  const form = document.getElementById("waitlistForm");
  const contact = document.getElementById("contact");
  const contactError = document.getElementById("contactError");
  const success = document.getElementById("formSuccess");

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isSriLankanPhone(v) {
    // 0771234567, +94771234567, 94771234567, with optional spaces or dashes
    const digits = v.replace(/[\s-]/g, "");
    return /^(\+?94|0)\d{9}$/.test(digits);
  }
  function showError(msg) {
    contact.setAttribute("aria-invalid", "true");
    contactError.textContent = msg;
    contactError.hidden = false;
  }
  function clearError() {
    contact.removeAttribute("aria-invalid");
    contactError.hidden = true;
  }

  contact.addEventListener("input", clearError);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = contact.value.trim();

    if (!value) {
      showError("Add an email or phone number so we can reach you.");
      contact.focus();
      return;
    }
    if (!isEmail(value) && !isSriLankanPhone(value)) {
      showError("That doesn’t look like an email or a Sri Lankan phone number.");
      contact.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    console.log("Waitlist sign-up (prototype, not sent):", data);

    success.hidden = false;
    success.setAttribute("tabindex", "-1");
    success.focus();
  });
})();
