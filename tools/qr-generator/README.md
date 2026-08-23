# Native QR Code Generator

Phase 11.6 browser-side QR generator for `bikrambhujel.com.np`.

- Original QR encoder implementation in this repository.
- UTF-8 byte mode.
- QR versions 1–10.
- Error correction L/M/Q/H.
- URL, text, Wi-Fi, email, phone and SMS payload helpers.
- PNG and SVG export.
- No iframe, CDN JavaScript, generation API, or Supabase dependency.

The encoder follows public QR Code structural rules for data encoding, Reed-Solomon error correction, function patterns, masks, format/version information and quiet zones.

Validation includes JavaScript syntax tests, engine tests, and real decode round-trip checks using OpenCV for URL, plain text, Wi-Fi, Unicode/Nepali text and mailto payloads.