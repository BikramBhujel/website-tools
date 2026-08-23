# IPv4 Subnet Calculator

Phase 11 native tool for bikrambhujel.com.np.

## Features

- IPv4 + CIDR input
- CIDR notation input such as `192.168.1.10/24`
- Subnet mask and wildcard mask
- Network and broadcast addresses
- First and last usable host
- Total and usable address counts
- RFC 3021 `/31` handling
- `/32` single-host handling
- Private/public/special-use classification
- Binary address and mask display
- Copy-to-clipboard controls
- No API, iframe, CDN or third-party runtime dependency

## Test

From this folder:

```bash
node tests/subnet.test.js
```

The calculation engine is kept separate from the browser UI so it can be unit-tested and later bundled into the Blogger page without changing the logic.
