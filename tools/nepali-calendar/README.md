# Native Bikram Sambat calendar engine

This directory is an isolated implementation for the website-tools repository. It does not modify any previously deployed production tool.

## Files

- `calendar-data.js` — explicit BS month-length dataset for 2000–2090 BS
- `calendar-engine.js` — native AD↔BS conversion and formatting functions
- `calendar.test.js` — structural, validation, and round-trip tests

## API

```js
import { adToBsIso, bsToAdIso, daysInMonth, formatBs } from './calendar-engine.js';

adToBsIso('2024-07-24');
bsToAdIso(2081, 4, 9);
daysInMonth(2081, 4);
formatBs(2081, 4, 9, 'ne');
```

## Validation

Run with Node's built-in test runner in an ES-module project:

```bash
node --test tools/nepali-calendar/calendar.test.js
```

The dataset and engine are intentionally independent from the legacy/prod calendar implementation. The next phase should compare this engine against trusted reference anchors before wiring it into any user-facing page.
