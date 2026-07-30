
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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
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

function sendUtilityEvent(eventName, details = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, details);
}

const quoteForm = document.querySelector('#quote-form');
if (quoteForm) {
  const quoteLink = document.querySelector('#quote-whatsapp');
  const updateQuoteLink = () => {
    const data = new FormData(quoteForm);
    const service = String(data.get('servicio') || '').trim();
    const colony = String(data.get('colonia') || '').trim();
    const property = String(data.get('inmueble') || '').trim();
    const detail = String(data.get('detalle') || '').trim();

    const lines = [
      'Hola, necesito una cotización.',
      service ? `Servicio: ${service}.` : '',
      colony ? `Colonia: ${colony}.` : '',
      property ? `Inmueble: ${property}.` : '',
      detail ? `Descripción: ${detail}` : ''
    ].filter(Boolean);

    if (quoteLink) {
      quoteLink.href = `https://wa.me/525638944059?text=${encodeURIComponent(lines.join('\n'))}`;
    }
  };

  quoteForm.addEventListener('input', updateQuoteLink);
  quoteForm.addEventListener('change', updateQuoteLink);
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateQuoteLink();
    sendUtilityEvent('quote_form_ready', { event_category: 'lead_support' });
    quoteLink?.click();
  });
  updateQuoteLink();
}

document.querySelectorAll('[data-copy-text]').forEach((button) => {
  button.addEventListener('click', async () => {
    const selector = button.getAttribute('data-copy-text');
    const target = selector ? document.querySelector(selector) : null;
    if (!target) return;
    const text = target.innerText.trim();
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent;
      button.textContent = 'Copiado';
      window.setTimeout(() => { button.textContent = original; }, 1800);
      sendUtilityEvent('copy_result', { event_category: 'tool' });
    } catch (error) {
      console.warn('No fue posible copiar el texto.', error);
    }
  });
});

const diagnosticForm = document.querySelector('#breaker-diagnostic');
if (diagnosticForm) {
  const result = document.querySelector('#diagnostic-result');
  const whatsapp = document.querySelector('#diagnostic-whatsapp');

  diagnosticForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(diagnosticForm);
    const danger = data.get('danger') === 'si';
    const immediate = data.get('immediate') === 'si';
    const appliance = data.get('appliance') === 'si';
    const delayed = data.get('delayed') === 'si';

    let title = 'Se requiere diagnóstico en sitio';
    let message = 'El patrón no permite identificar una sola causa. Puede tratarse de una conexión, protección, aparato o conductor con falla.';
    let urgency = 'normal';

    if (danger) {
      title = 'Señal de riesgo: no sigas rearmando la pastilla';
      message = 'Olor a quemado, humo, chispas o calentamiento requieren desconectar la carga cuando sea seguro y solicitar revisión. No abras el centro de carga ni toques conductores.';
      urgency = 'alta';
    } else if (immediate) {
      title = 'Posible cortocircuito o falla directa';
      message = 'Cuando la pastilla se dispara de inmediato puede existir un corto, aislamiento dañado o un equipo defectuoso. Deja el circuito apagado hasta revisarlo.';
      urgency = 'alta';
    } else if (appliance) {
      title = 'Posible problema en el aparato o su circuito';
      message = 'Si ocurre al conectar un equipo específico, el aparato, el contacto o el circuito pueden estar demandando más corriente o presentar una falla.';
    } else if (delayed) {
      title = 'Posible sobrecarga o calentamiento';
      message = 'Si ocurre después de varios minutos o al usar varios aparatos, puede existir sobrecarga, conexión floja o protección inadecuada.';
    }

    if (result) {
      result.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
      result.classList.add('is-visible');
    }

    if (whatsapp) {
      const text = [
        'Hola, necesito revisar una pastilla que se baja.',
        `Resultado orientativo: ${title}.`,
        `Prioridad: ${urgency}.`,
        'Mi colonia es: '
      ].join('\n');
      whatsapp.href = `https://wa.me/525638944059?text=${encodeURIComponent(text)}`;
      whatsapp.hidden = false;
    }

    sendUtilityEvent('diagnostic_completed', {
      event_category: 'guide',
      diagnostic_priority: urgency
    });
  });
}
