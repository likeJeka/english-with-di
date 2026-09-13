const BOOKING_API_URL =
  "https://script.google.com/macros/s/AKfycbxuUdGX97TR3mcTENaJiIyE6oEVKHsY36u0CwGNpcmzzXWDl4UmTeph69U37eIl4tHU/exec";

document.querySelectorAll(".contact-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('[type="submit"]');
    const data = new URLSearchParams({
      action: "booking",
      name: form.elements.name.value.trim(),
      level: form.elements.level.value,
      contact: form.elements.contact.value.trim(),
    });
    button.disabled = true;
    button.textContent = "Sending...";
    try {
      const response = await fetch(BOOKING_API_URL, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Booking request failed");
      form.reset();
      alert("Thank you! Your request has been sent.");
      document.querySelector(".modal")?.classList.add("hidden");
      document.body.style.overflow = "";
    } catch (error) {
      console.error("Booking request error:", error);
      alert("The request could not be sent. Please try again later.");
    } finally {
      button.disabled = false;
      button.textContent = "Send request";
    }
  });
});
