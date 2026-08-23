# PoE Budget Calculator

Phase 11.3 native browser tool for `bikrambhujel.com.np`.

## What it checks

- Switch-wide PoE power budget
- Design reserve / planning headroom
- PoE-capable port count
- Multiple powered-device groups
- Per-port capability against IEEE 802.3af / 802.3at / 802.3bt Type 3 / Type 4 limits
- Power utilization and remaining watts
- Port utilization and remaining ports
- Near-limit and over-budget conditions

## Runtime

The calculator is fully client-side.

- No iframe
- No external calculator
- No CDN JavaScript
- No API call
- No Supabase dependency

## Power model

The calculator treats the entered per-device wattage as **PSE/switch-side budget draw**. For conservative planning, use the maximum PSE allocation or maximum switch-side draw from the relevant device/switch documentation.

| Standard | Max PSE power | Max PD power | Pairs |
| --- | ---: | ---: | ---: |
| IEEE 802.3af | 15.4 W | 12.95 W | 2 |
| IEEE 802.3at | 30 W | 25.5 W | 2 |
| IEEE 802.3bt Type 3 | 60 W | 51 W | 4 |
| IEEE 802.3bt Type 4 | 90 W | 71.3 W | 4 |

Actual PD power can be lower because of cabling losses. Always verify final deployment values against manufacturer documentation.
