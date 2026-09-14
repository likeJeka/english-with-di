const BOOKING_API_URL =
  "https://script.google.com/macros/s/AKfycbxuUdGX97TR3mcTENaJiIyE6oEVKHsY36u0CwGNpcmzzXWDl4UmTeph69U37eIl4tHU/exec";

const successModal = document.querySelector("#successModal");

function showSuccess() {
  successModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function hideSuccess() {
  successModal?.classList.add("hidden");
  if (!document.querySelector(".modal:not(.hidden), .mobile-menu.open")) {
    document.body.style.overflow = "";
  }
}

document.querySelectorAll("[data-success-close]").forEach((element) => {
  element.addEventListener("click", hideSuccess);
});

document.querySelectorAll(".contact-form").forEach((form) => {
  const status = document.createElement("div");
  status.className = "form-status";
  status.setAttribute("role", "status");
  form.appendChild(status);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('[type="submit"]');
    const requestType = form.elements.request_type?.value?.trim() || "Not specified";
    const data = new URLSearchParams({
      action: "booking",
      name: form.elements.name.value.trim(),
      level: form.elements.level.value,
      contact: form.elements.contact.value.trim(),
      request_type: requestType,
    });

    status.textContent = "";
    status.className = "form-status";
    button.disabled = true;
    button.innerHTML = 'Sending...';

    try {
      const response = await fetch(BOOKING_API_URL, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Booking request failed");
      }

      form.reset();
      if (form.elements.request_type) {
        form.elements.request_type.value = "Not specified";
      }

      document.querySelector(".modal")?.classList.add("hidden");
      document.body.style.overflow = "";
      showSuccess();
    } catch (error) {
      console.error("Booking request error:", error);
      status.textContent = "Something went wrong. Please try again in a moment.";
      status.className = "form-status error";
    } finally {
      button.disabled = false;
      button.innerHTML = 'Send request <span>→</span>';
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideSuccess();
});
