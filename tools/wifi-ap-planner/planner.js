(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BBWifiPlanner = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ENVIRONMENTS = {
    open: { label: 'Open office / classroom', baseRadius5: 12, baseRadius6: 10, capacityFactor: 0.80 },
    mixed: { label: 'Mixed office with partitions', baseRadius5: 9, baseRadius6: 7.5, capacityFactor: 0.75 },
    dense: { label: 'Dense rooms / masonry walls', baseRadius5: 6.5, baseRadius6: 5.5, capacityFactor: 0.70 },
    warehouse: { label: 'Warehouse / open industrial', baseRadius5: 14, baseRadius6: 11, capacityFactor: 0.75 }
  };

  function finite(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function targetRssiFactor(rssi) {
    const value = finite(rssi, -67);
    if (value >= -62) return 0.68;
    if (value >= -65) return 0.82;
    if (value >= -67) return 1.0;
    if (value >= -70) return 1.16;
    return 1.28;
  }

  function heightFactor(heightM) {
    const h = finite(heightM, 2.8);
    if (h <= 3) return 1;
    if (h <= 4) return 0.92;
    if (h <= 6) return 0.82;
    return 0.72;
  }

  function makeGrid(lengthM, widthM, count) {
    const aspect = lengthM / widthM;
    const columns = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
    const rows = Math.max(1, Math.ceil(count / columns));
    const points = [];

    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      points.push({
        x: ((col + 0.5) / columns) * lengthM,
        y: ((row + 0.5) / rows) * widthM,
        row: row + 1,
        column: col + 1
      });
    }

    return { columns, rows, points };
  }

  function estimate(input) {
    const lengthM = clamp(finite(input.lengthM, 20), 1, 1000);
    const widthM = clamp(finite(input.widthM, 15), 1, 1000);
    const clients = Math.max(1, Math.round(finite(input.clients, 60)));
    const environment = ENVIRONMENTS[input.environment] ? input.environment : 'mixed';
    const env = ENVIRONMENTS[environment];
    const band = input.band === '6' ? '6' : '5';
    const targetRssi = clamp(finite(input.targetRssi, -67), -75, -55);
    const ceilingHeightM = clamp(finite(input.ceilingHeightM, 2.8), 2, 20);
    const maxClientsPerAp = clamp(Math.round(finite(input.maxClientsPerAp, 35)), 5, 200);
    const reservePercent = clamp(finite(input.reservePercent, 20), 0, 80);

    const areaM2 = lengthM * widthM;
    const baseRadius = band === '6' ? env.baseRadius6 : env.baseRadius5;
    const radiusM = baseRadius * targetRssiFactor(targetRssi) * heightFactor(ceilingHeightM);
    const effectiveCoverageM2 = Math.PI * radiusM * radiusM * 0.65;
    const coverageAps = Math.max(1, Math.ceil(areaM2 / effectiveCoverageM2));

    const reserveFactor = 1 - reservePercent / 100;
    const effectiveClientLimit = Math.max(1, Math.floor(maxClientsPerAp * env.capacityFactor * reserveFactor));
    const capacityAps = Math.max(1, Math.ceil(clients / effectiveClientLimit));
    const recommendedAps = Math.max(coverageAps, capacityAps);
    const driver = coverageAps > capacityAps ? 'coverage' : capacityAps > coverageAps ? 'capacity' : 'balanced';
    const averageClientsPerAp = clients / recommendedAps;
    const grid = makeGrid(lengthM, widthM, recommendedAps);

    return {
      lengthM, widthM, areaM2, clients, environment, environmentLabel: env.label,
      band, targetRssi, ceilingHeightM, maxClientsPerAp, reservePercent,
      radiusM, effectiveCoverageM2, coverageAps, capacityAps, recommendedAps, driver,
      effectiveClientLimit, averageClientsPerAp, grid,
      spacing: {
        horizontalM: lengthM / Math.max(1, grid.columns),
        verticalM: widthM / Math.max(1, grid.rows)
      }
    };
  }

  function riskFlags(result) {
    const flags = [];
    if (result.averageClientsPerAp > result.effectiveClientLimit * 0.9) {
      flags.push('Client load is close to the selected design limit; validate application mix and concurrency.');
    }
    if (result.ceilingHeightM > 6) {
      flags.push('High mounting height can reduce usable signal at client level; directional antennas or lower mounting may be preferable.');
    }
    if (result.environment === 'dense') {
      flags.push('Dense walls make simple area models unreliable; perform an on-site or predictive RF survey before final placement.');
    }
    if (result.band === '6') {
      flags.push('6 GHz has shorter practical indoor reach than 5 GHz; confirm client support and wall attenuation.');
    }
    return flags;
  }

  return { ENVIRONMENTS, estimate, makeGrid, riskFlags, targetRssiFactor, heightFactor };
});