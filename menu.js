const burger = document.querySelector(".burger");
const mobileMenu = document.querySelector(".mobile-menu");
const closeBtn = document.querySelector(".close-menu");

burger.addEventListener("click", () => {
  mobileMenu.classList.add("open");
  document.body.style.overflow = "hidden";
});

closeBtn.addEventListener("click", () => {
  mobileMenu.classList.remove("open");
  document.body.style.overflow = "";
});
