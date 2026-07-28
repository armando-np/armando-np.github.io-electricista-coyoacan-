const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

function pushLeadEvent(eventName) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName });
}

document.querySelectorAll('.track-call').forEach((link) => {
  link.addEventListener('click', () => pushLeadEvent('click_to_call'));
});

document.querySelectorAll('.track-whatsapp').forEach((link) => {
  link.addEventListener('click', () => pushLeadEvent('click_whatsapp'));
});
