const modal = document.querySelector('.modal');
const openButtons = document.querySelectorAll(
  '#openModal, .open-booking'
);
const closeElements = document.querySelectorAll('[data-close]');
const modalMobileMenu = document.querySelector('.mobile-menu');
const selectedFormat = document.querySelector('#selected-format');

function openBooking(type = 'Not specified') {
  modalMobileMenu?.classList.remove('open');

  const normalizedType = type || 'Not specified';
  modal?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  document.querySelectorAll('.modal .contact-form').forEach((form) => {
    if (form.elements.request_type) {
      form.elements.request_type.value = normalizedType;
    }
  });

  if (selectedFormat) {
    selectedFormat.innerHTML = `Lesson format: <strong>${normalizedType}</strong>`;
    selectedFormat.classList.toggle('is-selected', normalizedType !== 'Not specified');
  }
}

openButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    openBooking(btn.dataset.lessonType || 'Not specified');
  });
});

closeElements.forEach((el) => {
  el.addEventListener('click', () => {
    modal?.classList.add('hidden');
    if (!document.querySelector('.success-modal:not(.hidden), .mobile-menu.open')) {
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    modal?.classList.add('hidden');
    if (!document.querySelector('.success-modal:not(.hidden), .mobile-menu.open')) {
      document.body.style.overflow = '';
    }
  }
});
