(function () {
  'use strict';

  const planner = window.BBWifiPlanner;
  if (!planner) return;

  const $ = (id) => document.getElementById(id);
  const fields = {
    lengthM: $('bb-wifi-length'),
    widthM: $('bb-wifi-width'),
    clients: $('bb-wifi-clients'),
    environment: $('bb-wifi-environment'),
    band: $('bb-wifi-band'),
    targetRssi: $('bb-wifi-rssi'),
    ceilingHeightM: $('bb-wifi-height'),
    maxClientsPerAp: $('bb-wifi-maxclients'),
    reservePercent: $('bb-wifi-reserve')
  };

  function values() {
    return {
      lengthM: fields.lengthM.value,
      widthM: fields.widthM.value,
      clients: fields.clients.value,
      environment: fields.environment.value,
      band: fields.band.value,
      targetRssi: fields.targetRssi.value,
      ceilingHeightM: fields.ceilingHeightM.value,
      maxClientsPerAp: fields.maxClientsPerAp.value,
      reservePercent: fields.reservePercent.value
    };
  }

  function fmt(value, digits) {
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits == null ? 1 : digits });
  }

  function renderResult(result) {
    const driverText = result.driver === 'coverage'
      ? 'Coverage is the limiting factor.'
      : result.driver === 'capacity'
        ? 'Client capacity is the limiting factor.'
        : 'Coverage and capacity require the same AP count.';

    const risks = planner.riskFlags(result);
    $('bb-wifi-result').innerHTML = [
      metric('Recommended APs', result.recommendedAps),
      metric('Coverage minimum', result.coverageAps),
      metric('Capacity minimum', result.capacityAps),
      metric('Floor area', fmt(result.areaM2, 0) + ' m²'),
      metric('Planning radius', fmt(result.radiusM, 1) + ' m'),
      metric('Effective clients / AP', result.effectiveClientLimit),
      metric('Average clients / AP', fmt(result.averageClientsPerAp, 1)),
      '<div class="bb-wifi-verdict"><strong>' + escapeHtml(driverText) + '</strong><p>' +
        'Primary band: ' + escapeHtml(result.band) + ' GHz · target ' + escapeHtml(result.targetRssi) + ' dBm · ' +
        escapeHtml(result.environmentLabel) + '.</p></div>',
      risks.map(function (risk) { return '<div class="bb-wifi-risk">' + escapeHtml(risk) + '</div>'; }).join('')
    ].join('');
  }

  function metric(label, value) {
    return '<div class="bb-wifi-metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }

  function renderMap(result) {
    const vbW = 900;
    const vbH = Math.max(360, vbW * (result.widthM / result.lengthM) * 0.72);
    const pad = 48;
    const floorW = vbW - pad * 2;
    const floorH = vbH - pad * 2;
    const sx = floorW / result.lengthM;
    const sy = floorH / result.widthM;
    const cellRadiusPx = Math.min(result.radiusM * sx, result.radiusM * sy);

    let svg = '<svg viewBox="0 0 ' + vbW + ' ' + vbH + '" role="img" aria-label="Preliminary access point placement grid">';
    svg += '<rect class="floor" x="' + pad + '" y="' + pad + '" width="' + floorW + '" height="' + floorH + '" rx="4"/>';

    for (let c = 1; c < result.grid.columns; c += 1) {
      const x = pad + floorW * c / result.grid.columns;
      svg += '<line class="gridline" x1="' + x + '" y1="' + pad + '" x2="' + x + '" y2="' + (pad + floorH) + '"/>';
    }
    for (let r = 1; r < result.grid.rows; r += 1) {
      const y = pad + floorH * r / result.grid.rows;
      svg += '<line class="gridline" x1="' + pad + '" y1="' + y + '" x2="' + (pad + floorW) + '" y2="' + y + '"/>';
    }

    result.grid.points.forEach(function (point, index) {
      const x = pad + point.x * sx;
      const y = pad + point.y * sy;
      svg += '<circle class="cell" cx="' + x + '" cy="' + y + '" r="' + Math.max(16, cellRadiusPx) + '"/>';
      svg += '<circle class="ap" cx="' + x + '" cy="' + y + '" r="15"/>';
      svg += '<text class="ap-label" x="' + x + '" y="' + y + '">' + (index + 1) + '</text>';
    });

    svg += '<text class="axis" x="' + (pad + floorW / 2) + '" y="' + (vbH - 12) + '" text-anchor="middle">' + fmt(result.lengthM, 1) + ' m length</text>';
    svg += '<text class="axis" x="14" y="' + (pad + floorH / 2) + '" transform="rotate(-90 14 ' + (pad + floorH / 2) + ')" text-anchor="middle">' + fmt(result.widthM, 1) + ' m width</text>';
    svg += '</svg>';

    $('bb-wifi-map').innerHTML = svg;
  }

  function calculate() {
    const result = planner.estimate(values());
    renderResult(result);
    renderMap(result);
  }

  function setExample() {
    fields.lengthM.value = 42;
    fields.widthM.value = 24;
    fields.clients.value = 140;
    fields.environment.value = 'mixed';
    fields.band.value = '5';
    fields.targetRssi.value = '-67';
    fields.ceilingHeightM.value = 2.8;
    fields.maxClientsPerAp.value = 35;
    fields.reservePercent.value = 20;
    calculate();
  }

  function reset() {
    fields.lengthM.value = 30;
    fields.widthM.value = 18;
    fields.clients.value = 80;
    fields.environment.value = 'mixed';
    fields.band.value = '5';
    fields.targetRssi.value = '-67';
    fields.ceilingHeightM.value = 2.8;
    fields.maxClientsPerAp.value = 35;
    fields.reservePercent.value = 20;
    calculate();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  $('bb-wifi-calculate').addEventListener('click', calculate);
  $('bb-wifi-example').addEventListener('click', setExample);
  $('bb-wifi-reset').addEventListener('click', reset);
  Object.keys(fields).forEach(function (key) {
    fields[key].addEventListener('change', calculate);
  });

  calculate();
})();