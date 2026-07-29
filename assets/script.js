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

/**
 * Envía un evento a Google Analytics 4 y una conversión a Google Ads.
 */
function sendContactEvent(eventName, contactMethod, link) {
  if (typeof window.gtag !== 'function') {
    console.warn(`Google tag no disponible para el evento: ${eventName}`);
    return;
  }

  // Evento para Google Analytics 4
  window.gtag('event', eventName, {
    event_category: 'contact',
    contact_method: contactMethod,
    link_url: link.href
  });

  // Conversión para Google Ads
  window.gtag('event', 'conversion', {
    send_to: 'AW-804083603/nE_8CIbAjNgcEJOvtf8C',
    value: 1.0,
    currency: 'MXN'
  });
}

/**
 * Clics en enlaces telefónicos.
 */
document.querySelectorAll('.track-call').forEach((link) => {
  link.addEventListener('click', () => {
    sendContactEvent('click_to_call', 'phone', link);
  });
});

/**
 * Clics en enlaces de WhatsApp.
 */
document.querySelectorAll('.track-whatsapp').forEach((link) => {
  link.addEventListener('click', () => {
    sendContactEvent('click_whatsapp', 'whatsapp', link);
  });
});
