const modal = document.querySelector('.modal');
const openButtons = document.querySelectorAll('#openModal, .open-booking');
const closeElements = document.querySelectorAll('[data-close]');
const modalMobileMenu = document.querySelector('.mobile-menu');
const selectedFormat = document.querySelector('#selected-format');
const modalForm = document.querySelector('.modal-form');

function openBooking(type = 'Not specified') {
  modalMobileMenu?.classList.remove('open');

  const normalizedType = type || 'Not specified';
  modal?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (modalForm) {
    const requestType = modalForm.elements.request_type;
    const format = modalForm.elements.format;

    if (requestType) {
      requestType.value = normalizedType;
    }

    // Pre-select a sensible format when the user came from a lesson-format card.
    if (format && normalizedType !== 'Not specified') {
      if (normalizedType === 'Individual lesson') {
        format.value = 'Індивідуальне заняття — 55 хв';
      } else if (normalizedType === 'Group lesson') {
        format.value = 'Групове заняття — 75 хв';
      }
    }
  }

  updateSelectedFormat();
}

function updateSelectedFormat() {
  if (!selectedFormat || !modalForm) return;

  const format = modalForm.elements.format?.value || '';
  const requestType = modalForm.elements.request_type?.value || 'Not specified';
  const label = format || requestType;

  selectedFormat.innerHTML = `Формат заняття: <strong>${label}</strong>`;
  selectedFormat.classList.toggle('is-selected', Boolean(format || requestType !== 'Not specified'));

  if (format && modalForm.elements.request_type) {
    modalForm.elements.request_type.value =
      format.startsWith('Групове') ? 'Group lesson' :
      format.startsWith('Індивідуальне') ? 'Individual lesson' :
      format.startsWith('Заняття в парі') ? 'Pair lesson' : format;
  }
}

modalForm?.elements.format?.addEventListener('change', updateSelectedFormat);

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
