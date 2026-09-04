# BBPDF

BBPDF is a single-page PDF workspace for Bikram Bhujel's website. The public UI and API are BBPDF-branded. The PDF engine runs privately inside the Docker network.

## Architecture

Blogger -> BBPDF frontend -> BBPDF Gateway (FastAPI) -> private PDF engine

The PDF engine is pinned by commit in `engine/VERSION`. The vendor script can materialize the upstream source into `engine/stirling-pdf/` when building the image.

## Important licensing note

BBPDF does not remove or misrepresent third-party copyright/license notices. Stirling-PDF has license boundaries in its repository, so only permitted components should be distributed. The vendor workflow intentionally keeps the upstream LICENSE/NOTICE files with the vendored source. Do not add proprietary/editor/desktop/saas components unless their applicable license permits your intended use.

## v1 tools

- Merge PDF
- Split PDF by page numbers
- Compress PDF

More tools will be added behind the same BBPDF API and single-page Blogger UI.

## Quick start

1. Copy `.env.example` to `.env`.
2. Run `./engine/vendor-stirling.sh` to materialize the pinned upstream source.
3. Build and start: `docker compose up -d --build`.
4. Verify: `curl http://127.0.0.1:8081/health`.
5. Put Nginx/Cloudflare in front of port 8081 for HTTPS.
6. Paste `blogger/bbpdf.html` into a Blogger Page in HTML view and set `BBPDF_API_BASE` to your public API hostname.

## Production rules

- Do not expose the PDF engine port to the Internet.
- Do not expose the engine's web UI publicly.
- Set a real `BBPDF_ALLOWED_ORIGINS` value.
- Keep uploads temporary and enforce size/concurrency limits.
- Pin the engine version before production deployment.
