const modal = document.querySelector('.modal');
const openButtons = document.querySelectorAll(
  '#openModal, .mobile-btn, .primary-btn'
);
const closeElements = document.querySelectorAll('[data-close]');

openButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
});

closeElements.forEach(el => {
  el.addEventListener('click', () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
});
