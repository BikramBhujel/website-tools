# Wi-Fi AP Planner

Native Phase 11 tool for preliminary indoor Wi-Fi access-point planning.

## Purpose

The planner estimates AP count using two independent constraints:

1. **Coverage requirement** — floor area, environment type, primary design band, target edge RSSI and mounting height.
2. **Capacity requirement** — concurrent clients, client-per-AP design limit, environment factor and design reserve.

The recommended AP count is the higher of the coverage and capacity estimates. A simple SVG grid provides a starting placement pattern.

## Important limitation

This is a planning estimator, **not an RF propagation engine**. It does not model wall materials, attenuation maps, antenna patterns, transmit power, channel reuse, interference, DFS, neighboring WLANs, client radios, application airtime demand or roaming behavior.

Final enterprise WLAN designs should be validated using a predictive design and/or on-site survey with the intended AP model and channel/power plan.

## Files

- `index.html` — standalone UI
- `styles.css` — scoped styling
- `planner.js` — calculation engine, usable in browser or Node.js
- `app.js` — browser UI and SVG placement rendering
- `tests/planner.test.js` — Node.js unit tests

## Run locally

Open `index.html` in a browser. No runtime CDN or external service is required.

## Tests

```bash
node tests/planner.test.js
```

## Phase 11 isolation

This tool is self-contained under `tools/wifi-ap-planner/`. It does not modify or depend on production membership, LMS, authentication, payment, contact or premium-content systems.