
(() => {
  'use strict';

  const PHONE = '525638944059';
  const commonDrives = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  function numberValue(element, fallback = 0) {
    if (!element) return fallback;
    const value = Number.parseFloat(String(element.value).replace(',', '.'));
    return Number.isFinite(value) ? value : fallback;
  }

  function formatNumber(value, digits = 2) {
    return new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0
    }).format(value);
  }

  function setStatus(element, message, type = '') {
    if (!element) return;
    element.textContent = message;
    element.className = `status-message${type ? ` ${type}` : ''}`;
  }

  function whatsappUrl(lines) {
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
  }

  function trackTool(name) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'tool_calculation', {
      event_category: 'tool',
      tool_name: name
    });
  }

  // Calculadora de consumo eléctrico
  const loadForm = document.querySelector('#load-calculator');
  if (loadForm) {
    const list = document.querySelector('#appliance-list');
    const addButton = document.querySelector('#add-appliance');
    const result = document.querySelector('#load-result');
    const status = document.querySelector('#load-status');
    const whatsapp = document.querySelector('#load-whatsapp');
    const template = document.querySelector('#appliance-template');

    function addRow(values = {}) {
      if (!template || !list) return;
      const fragment = template.content.cloneNode(true);
      const row = fragment.querySelector('.appliance-row');
      row.querySelector('[name="device-name"]').value = values.name || '';
      row.querySelector('[name="device-watts"]').value = values.watts || '';
      row.querySelector('[name="device-qty"]').value = values.qty || 1;
      row.querySelector('[name="device-hours"]').value = values.hours || '';
      row.querySelector('.remove-appliance').addEventListener('click', () => {
        row.remove();
        if (!list.querySelector('.appliance-row')) addRow();
      });
      list.appendChild(fragment);
    }

    addButton?.addEventListener('click', () => addRow());
    document.querySelectorAll('[data-load-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        addRow({
          name: button.dataset.name,
          watts: button.dataset.watts,
          qty: 1,
          hours: button.dataset.hours
        });
      });
    });

    addRow();

    loadForm.addEventListener('reset', () => {
      window.setTimeout(() => {
        if (list) list.innerHTML = '';
        addRow();
        if (result) {
          result.innerHTML = '<p class="result-empty">Agrega tus aparatos y calcula para ver potencia, corriente y consumo mensual aproximado.</p>';
        }
        setStatus(status, '');
        if (whatsapp) whatsapp.href = 'https://wa.me/525638944059';
      }, 0);
    });

    loadForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const voltage = numberValue(document.querySelector('#load-voltage'), 127);
      const days = numberValue(document.querySelector('#load-days'), 30);
      const rows = [...list.querySelectorAll('.appliance-row')];
      const items = rows.map((row) => ({
        name: row.querySelector('[name="device-name"]').value.trim() || 'Aparato',
        watts: numberValue(row.querySelector('[name="device-watts"]')),
        qty: Math.max(0, numberValue(row.querySelector('[name="device-qty"]'), 1)),
        hours: Math.max(0, numberValue(row.querySelector('[name="device-hours"]')))
      })).filter((item) => item.watts > 0 && item.qty > 0);

      if (voltage <= 0 || days <= 0 || !items.length) {
        setStatus(status, 'Completa al menos un aparato con potencia y cantidad válidas.', 'error');
        return;
      }

      const connectedWatts = items.reduce((sum, item) => sum + item.watts * item.qty, 0);
      const current = connectedWatts / voltage;
      const dailyKwh = items.reduce((sum, item) => sum + (item.watts * item.qty * item.hours) / 1000, 0);
      const monthlyKwh = dailyKwh * days;

      const detail = items.map((item) =>
        `${item.name}: ${formatNumber(item.watts, 0)} W × ${formatNumber(item.qty, 0)}`
      ).join(', ');

      result.innerHTML = `
        <div id="load-result-text">
          <div class="result-grid">
            <div class="metric"><span>Potencia conectada</span><strong>${formatNumber(connectedWatts / 1000)} kW</strong></div>
            <div class="metric"><span>Corriente aproximada a ${formatNumber(voltage, 0)} V</span><strong>${formatNumber(current)} A</strong></div>
            <div class="metric"><span>Consumo diario estimado</span><strong>${formatNumber(dailyKwh)} kWh</strong></div>
            <div class="metric"><span>Consumo en ${formatNumber(days, 0)} días</span><strong>${formatNumber(monthlyKwh)} kWh</strong></div>
          </div>
          <p class="result-summary">La corriente se calcula suponiendo factor de potencia igual a 1. Motores, compresores, bombas y equipos electrónicos pueden tener corriente de arranque o factor de potencia distinto.</p>
        </div>
      `;

      whatsapp.href = whatsappUrl([
        'Hola, quiero revisar la carga de un circuito.',
        `Voltaje usado: ${formatNumber(voltage, 0)} V.`,
        `Potencia conectada aproximada: ${formatNumber(connectedWatts / 1000)} kW.`,
        `Corriente aproximada: ${formatNumber(current)} A.`,
        `Consumo mensual estimado: ${formatNumber(monthlyKwh)} kWh.`,
        `Aparatos: ${detail}.`,
        'Mi colonia es: '
      ]);

      setStatus(status, 'Cálculo actualizado. Verifica la placa de datos de cada aparato para mayor precisión.', 'success');
      trackTool('consumo_electrico');
    });
  }

  // Estimador preliminar de calibre y caída de tensión
  const wireForm = document.querySelector('#wire-calculator');
  if (wireForm) {
    const result = document.querySelector('#wire-result');
    const status = document.querySelector('#wire-status');
    const whatsapp = document.querySelector('#wire-whatsapp');
    const modeInputs = [...wireForm.querySelectorAll('[name="wire-mode"]')];
    const currentFields = document.querySelector('#wire-current-fields');
    const powerFields = document.querySelector('#wire-power-fields');

    const copper = [
      { label: '14 AWG', area: 2.08, ampacity: 15 },
      { label: '12 AWG', area: 3.31, ampacity: 20 },
      { label: '10 AWG', area: 5.26, ampacity: 30 },
      { label: '8 AWG', area: 8.37, ampacity: 40 },
      { label: '6 AWG', area: 13.3, ampacity: 55 },
      { label: '4 AWG', area: 21.2, ampacity: 70 },
      { label: '3 AWG', area: 26.7, ampacity: 85 },
      { label: '2 AWG', area: 33.6, ampacity: 95 },
      { label: '1 AWG', area: 42.4, ampacity: 110 },
      { label: '1/0 AWG', area: 53.5, ampacity: 125 },
      { label: '2/0 AWG', area: 67.4, ampacity: 145 },
      { label: '3/0 AWG', area: 85.0, ampacity: 165 },
      { label: '4/0 AWG', area: 107.2, ampacity: 195 },
      { label: '250 kcmil', area: 126.7, ampacity: 215 },
      { label: '300 kcmil', area: 152.0, ampacity: 240 },
      { label: '350 kcmil', area: 177.3, ampacity: 260 },
      { label: '400 kcmil', area: 202.7, ampacity: 280 },
      { label: '500 kcmil', area: 253.4, ampacity: 320 }
    ];

    const aluminum = [
      { label: '8 AWG', area: 8.37, ampacity: 30 },
      { label: '6 AWG', area: 13.3, ampacity: 40 },
      { label: '4 AWG', area: 21.2, ampacity: 55 },
      { label: '3 AWG', area: 26.7, ampacity: 65 },
      { label: '2 AWG', area: 33.6, ampacity: 75 },
      { label: '1 AWG', area: 42.4, ampacity: 85 },
      { label: '1/0 AWG', area: 53.5, ampacity: 100 },
      { label: '2/0 AWG', area: 67.4, ampacity: 115 },
      { label: '3/0 AWG', area: 85.0, ampacity: 130 },
      { label: '4/0 AWG', area: 107.2, ampacity: 150 },
      { label: '250 kcmil', area: 126.7, ampacity: 170 },
      { label: '300 kcmil', area: 152.0, ampacity: 190 },
      { label: '350 kcmil', area: 177.3, ampacity: 210 },
      { label: '400 kcmil', area: 202.7, ampacity: 225 },
      { label: '500 kcmil', area: 253.4, ampacity: 260 }
    ];

    function updateMode() {
      const mode = wireForm.querySelector('[name="wire-mode"]:checked')?.value || 'current';
      currentFields?.classList.toggle('hidden', mode !== 'current');
      powerFields?.classList.toggle('hidden', mode !== 'power');
    }

    modeInputs.forEach((input) => input.addEventListener('change', updateMode));
    updateMode();

    wireForm.addEventListener('reset', () => {
      window.setTimeout(() => {
        updateMode();
        if (result) {
          result.innerHTML = '<p class="result-empty">Completa la corriente o potencia, distancia y condiciones para obtener una referencia.</p>';
        }
        setStatus(status, '');
        if (whatsapp) whatsapp.href = 'https://wa.me/525638944059';
      }, 0);
    });

    wireForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const mode = wireForm.querySelector('[name="wire-mode"]:checked')?.value || 'current';
      const phase = document.querySelector('#wire-phase').value;
      const voltage = numberValue(document.querySelector('#wire-voltage'), 127);
      const distance = numberValue(document.querySelector('#wire-distance'));
      const targetDrop = numberValue(document.querySelector('#wire-drop'), 3);
      const material = document.querySelector('#wire-material').value;
      const continuous = document.querySelector('#wire-continuous').checked;

      let loadCurrent = 0;
      if (mode === 'current') {
        loadCurrent = numberValue(document.querySelector('#wire-current'));
      } else {
        const powerKw = numberValue(document.querySelector('#wire-power'));
        const pf = Math.min(1, Math.max(.1, numberValue(document.querySelector('#wire-pf'), .9)));
        const watts = powerKw * 1000;
        loadCurrent = phase === 'three'
          ? watts / (Math.sqrt(3) * voltage * pf)
          : watts / (voltage * pf);
      }

      if (loadCurrent <= 0 || voltage <= 0 || distance <= 0 || targetDrop <= 0 || targetDrop > 10) {
        setStatus(status, 'Ingresa corriente o potencia, voltaje, distancia y caída permitida válidos.', 'error');
        return;
      }

      const designCurrent = loadCurrent * (continuous ? 1.25 : 1);
      const table = material === 'aluminum' ? aluminum : copper;
      const rho = material === 'aluminum' ? 0.0345 : 0.0212;
      const phaseFactor = phase === 'three' ? Math.sqrt(3) : 2;
      const allowedVolts = voltage * targetDrop / 100;

      let selected = null;
      for (const size of table) {
        const dropVolts = phaseFactor * distance * designCurrent * rho / size.area;
        const dropPercent = dropVolts / voltage * 100;
        if (size.ampacity >= designCurrent && dropPercent <= targetDrop) {
          selected = { ...size, dropVolts, dropPercent };
          break;
        }
      }

      if (!selected) {
        result.innerHTML = `
          <div id="wire-result-text">
            <p class="result-empty"><strong>El cálculo queda fuera del rango de esta herramienta.</strong></p>
            <p class="result-summary">La corriente, distancia o caída solicitada requieren un estudio de alimentador, canalización, protección y condiciones de instalación.</p>
          </div>
        `;
        whatsapp.href = whatsappUrl([
          'Hola, necesito dimensionar un conductor.',
          `Corriente de diseño aproximada: ${formatNumber(designCurrent)} A.`,
          `Voltaje: ${formatNumber(voltage, 0)} V.`,
          `Distancia de un solo trayecto: ${formatNumber(distance)} m.`,
          'El estimador quedó fuera de rango.',
          'Mi colonia es: '
        ]);
        setStatus(status, 'Resultado fuera de rango. Solicita cálculo y revisión en sitio.', 'error');
        trackTool('calibre_fuera_rango');
        return;
      }

      const conditions = [...wireForm.querySelectorAll('[name="wire-condition"]:checked')]
        .map((input) => input.value);
      const conditionWarning = conditions.length
        ? `<p class="result-summary"><strong>Atención:</strong> marcaste condiciones que pueden exigir correcciones adicionales: ${conditions.join(', ')}. El calibre mostrado no debe usarse como selección final.</p>`
        : '';

      const materialName = material === 'aluminum' ? 'aluminio' : 'cobre';
      const criterion = selected.ampacity === designCurrent
        ? 'corriente y caída de tensión'
        : (selected.dropPercent > targetDrop * .75 ? 'principalmente caída de tensión' : 'principalmente corriente');

      result.innerHTML = `
        <div id="wire-result-text">
          <div class="result-grid">
            <div class="metric"><span>Calibre preliminar</span><strong>${selected.label}</strong></div>
            <div class="metric"><span>Material</span><strong>${materialName}</strong></div>
            <div class="metric"><span>Corriente de diseño</span><strong>${formatNumber(designCurrent)} A</strong></div>
            <div class="metric"><span>Caída estimada</span><strong>${formatNumber(selected.dropPercent)} %</strong></div>
            <div class="metric"><span>Caída en volts</span><strong>${formatNumber(selected.dropVolts)} V</strong></div>
            <div class="metric"><span>Área aproximada</span><strong>${formatNumber(selected.area)} mm²</strong></div>
          </div>
          <p class="result-summary">Criterio gobernante: ${criterion}. Tabla orientativa conservadora y resistividad aproximada a temperatura de operación.</p>
          ${conditionWarning}
          <p class="result-summary">No se calculó la pastilla. La protección debe coordinarse con conductor, terminales, equipo, canalización, temperatura, agrupamiento, aislamiento y norma aplicable.</p>
        </div>
      `;

      whatsapp.href = whatsappUrl([
        'Hola, necesito verificar el calibre de un conductor.',
        `Carga: ${formatNumber(loadCurrent)} A.`,
        continuous ? `Corriente de diseño con factor continuo: ${formatNumber(designCurrent)} A.` : '',
        `Sistema: ${phase === 'three' ? 'trifásico' : 'monofásico'}, ${formatNumber(voltage, 0)} V.`,
        `Distancia de un solo trayecto: ${formatNumber(distance)} m.`,
        `Material: ${materialName}.`,
        `Resultado preliminar: ${selected.label}, caída estimada ${formatNumber(selected.dropPercent)} %.`,
        conditions.length ? `Condiciones señaladas: ${conditions.join(', ')}.` : '',
        'Necesito confirmación en sitio. Mi colonia es: '
      ]);

      setStatus(status, 'Estimación calculada. No cambies una protección ni instales conductor sin verificar las condiciones reales.', 'success');
      trackTool('calibre_conductor');
    });
  }

  // Calculadora de almacenamiento para CCTV
  const cctvForm = document.querySelector('#cctv-calculator');
  if (cctvForm) {
    const result = document.querySelector('#cctv-result');
    const status = document.querySelector('#cctv-status');
    const whatsapp = document.querySelector('#cctv-whatsapp');
    const bitrateInput = document.querySelector('#cctv-bitrate');
    const recording = document.querySelector('#cctv-recording');
    const activityField = document.querySelector('#cctv-activity-field');

    const baseBitrates = {
      '1080p': 2,
      '4mp': 4,
      '5mp': 5,
      '4k': 8
    };
    const codecFactor = {
      'h265plus': .75,
      'h265': 1,
      'h264': 1.7
    };

    function suggestedBitrate() {
      const resolution = document.querySelector('#cctv-resolution').value;
      const codec = document.querySelector('#cctv-codec').value;
      const fps = numberValue(document.querySelector('#cctv-fps'), 15);
      const base = baseBitrates[resolution] || 2;
      return Math.max(.5, base * (codecFactor[codec] || 1) * (fps / 15));
    }

    function updateCctvDefaults() {
      if (bitrateInput && bitrateInput.dataset.userEdited !== 'true') {
        bitrateInput.value = suggestedBitrate().toFixed(1);
      }
      activityField?.classList.toggle('hidden', recording.value !== 'motion');
    }

    bitrateInput?.addEventListener('input', () => { bitrateInput.dataset.userEdited = 'true'; });
    ['#cctv-resolution', '#cctv-codec', '#cctv-fps'].forEach((selector) => {
      document.querySelector(selector)?.addEventListener('change', updateCctvDefaults);
    });
    recording?.addEventListener('change', updateCctvDefaults);
    updateCctvDefaults();

    cctvForm.addEventListener('reset', () => {
      window.setTimeout(() => {
        if (bitrateInput) bitrateInput.dataset.userEdited = 'false';
        updateCctvDefaults();
        if (result) {
          result.innerHTML = '<p class="result-empty">Completa los datos para estimar terabytes y una capacidad comercial mínima.</p>';
        }
        setStatus(status, '');
        if (whatsapp) whatsapp.href = 'https://wa.me/525638944059';
      }, 0);
    });

    cctvForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const cameras = Math.max(1, Math.round(numberValue(document.querySelector('#cctv-cameras'), 1)));
      const days = numberValue(document.querySelector('#cctv-days'), 15);
      const bitrate = numberValue(bitrateInput, suggestedBitrate());
      const mode = recording.value;
      const activity = mode === 'motion'
        ? Math.min(100, Math.max(1, numberValue(document.querySelector('#cctv-activity'), 30)))
        : 100;
      const margin = Math.min(100, Math.max(0, numberValue(document.querySelector('#cctv-margin'), 20)));

      if (cameras <= 0 || days <= 0 || bitrate <= 0) {
        setStatus(status, 'Ingresa número de cámaras, días y bitrate válidos.', 'error');
        return;
      }

      const seconds = days * 24 * 60 * 60;
      const rawTb = cameras * bitrate * 1e6 * seconds * (activity / 100) / 8 / 1e12;
      const withMargin = rawTb * (1 + margin / 100);
      const drive = commonDrives.find((capacity) => capacity >= withMargin);
      const driveText = drive ? `${drive} TB` : `más de ${commonDrives.at(-1)} TB`;

      result.innerHTML = `
        <div id="cctv-result-text">
          <div class="result-grid">
            <div class="metric"><span>Datos estimados</span><strong>${formatNumber(rawTb)} TB</strong></div>
            <div class="metric"><span>Con margen de ${formatNumber(margin, 0)} %</span><strong>${formatNumber(withMargin)} TB</strong></div>
            <div class="metric"><span>Capacidad comercial mínima</span><strong>${driveText}</strong></div>
            <div class="metric"><span>Bitrate total</span><strong>${formatNumber(cameras * bitrate)} Mbps</strong></div>
          </div>
          <p class="result-summary">Estimación para ${cameras} cámara${cameras === 1 ? '' : 's'}, ${formatNumber(days, 0)} días y ${mode === 'motion' ? `${formatNumber(activity, 0)} % de actividad` : 'grabación continua'}. Audio, escenas con mucho movimiento, VBR, metadatos y redundancia pueden aumentar el espacio.</p>
        </div>
      `;

      whatsapp.href = whatsappUrl([
        'Hola, necesito cotizar un sistema de cámaras.',
        `Cámaras: ${cameras}.`,
        `Retención: ${formatNumber(days, 0)} días.`,
        `Bitrate por cámara usado: ${formatNumber(bitrate)} Mbps.`,
        `Modo: ${mode === 'motion' ? `movimiento (${formatNumber(activity, 0)} % estimado)` : 'continuo'}.`,
        `Almacenamiento calculado con margen: ${formatNumber(withMargin)} TB.`,
        `Capacidad comercial mínima estimada: ${driveText}.`,
        'Mi colonia es: '
      ]);

      setStatus(status, 'Estimación calculada. Confirma el bitrate real del modelo de cámara y grabador.', 'success');
      trackTool('almacenamiento_cctv');
    });
  }
})();
