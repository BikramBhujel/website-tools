# BikramBhujel Website Tools

Native, self-hosted technical utilities for [bikrambhujel.com.np](https://www.bikrambhujel.com.np/).

## Phase 11 rules

- No iframes.
- No embedded third-party calculators.
- No runtime CDN JavaScript dependencies.
- No external service is required for core calculations.
- Open-source components may be vendored into this repository only after license review and attribution.
- Existing production membership, LMS, payment, contact, premium-content and authentication systems are outside this repository and must not be changed as part of Phase 11.

## Planned tools

1. IPv4 Subnet Calculator — in progress
2. PoE Budget Calculator
3. Wi-Fi AP Planner
4. QR Code Generator
5. Nepali Date Converter

## Repository layout

```text
website-tools/
├── tools/
│   ├── subnet-calculator/
│   ├── poe-budget-calculator/
│   ├── wifi-ap-planner/
│   ├── qr-generator/
│   └── nepali-date-converter/
└── blogger/
```

Each tool is developed and tested independently before a Blogger-ready bundle is produced.
