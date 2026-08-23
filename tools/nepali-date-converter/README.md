# Nepali Date Converter

Phase 11.4 self-hosted AD ↔ BS converter for `bikrambhujel.com.np`.

## Upstream

The calendar data and core conversion approach are adapted from the MIT-licensed project:

- `remotemerge/nepali-date-converter`
- https://github.com/remotemerge/nepali-date-converter
- Upstream copyright: © 2026 Madan Sapkota

The original license is retained in `vendor/LICENSE-remotemerge-nepali-date-converter.txt`.

## Local changes

- Browser/CommonJS wrapper
- Strict Gregorian and BS date validation
- UTC-only arithmetic to prevent timezone drift
- English and Nepali month/day labels
- Nepali numeral formatting
- Responsive Blogger page UI aligned to the BikramBhujel 2026 design system
- No iframe, CDN JavaScript, external converter, or runtime API

## Supported range

- BS: 1975–2099
- AD: approximately 1918-04-13 through 2043-04-13

## Validation examples

- `2080-01-15 BS` → `2023-04-28 AD`
- `2023-04-28 AD` → `2080-01-15 BS`
- `2083-05-07 BS` → `2026-08-23 AD`
- `2026-08-23 AD` → `2083-05-07 BS`
