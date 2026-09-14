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
    const get = (name) => form.elements[name]?.value?.trim() || "";

    const requestType =
      get("request_type") ||
      (get("format").startsWith("Групове") ? "Group lesson" :
       get("format").startsWith("Індивідуальне") ? "Individual lesson" :
       get("format").startsWith("Заняття в парі") ? "Pair lesson" : "Not specified");

    const data = new URLSearchParams({
      action: "booking",
      name: get("name"),
      age: get("age"),
      level: get("level"),
      contact: get("contact"),
      goal: get("goal"),
      format: get("format"),
      teacher: get("teacher"),
      lessons_per_week: get("lessons_per_week"),
      preferred_time: get("preferred_time"),
      experience: get("experience"),
      skills: get("skills"),
      wishes: get("wishes"),
      source: get("source"),
      request_type: requestType,
    });

    status.textContent = "";
    status.className = "form-status";
    button.disabled = true;
    button.innerHTML = "Надсилання...";

    try {
      const response = await fetch(BOOKING_API_URL, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Booking request failed");
      }

      form.reset();

      if (form.elements.request_type) {
        form.elements.request_type.value = "Not specified";
      }

      if (form.elements.format) {
        form.elements.format.value = "";
      }

      const selected = document.querySelector("#selected-format");
      if (selected) {
        selected.innerHTML = "Формат заняття: <strong>не обрано</strong>";
        selected.classList.remove("is-selected");
      }

      document.querySelector(".modal")?.classList.add("hidden");
      document.body.style.overflow = "";
      showSuccess();
    } catch (error) {
      console.error("Booking request error:", error);
      status.textContent = error.message === "Please enter a valid age" ? "Будь ласка, введи правильний вік (від 10 до 100 років)." : "Щось пішло не так. Спробуй ще раз за хвилину.";
      status.className = "form-status error";
    } finally {
      button.disabled = false;
      button.innerHTML = 'Надіслати заявку <span>→</span>';
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideSuccess();
});
