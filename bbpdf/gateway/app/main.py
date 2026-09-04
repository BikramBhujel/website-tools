from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

ENGINE_URL = os.getenv("BBPDF_ENGINE_URL", "http://pdf-engine:8080").rstrip("/")
MAX_FILE_MB = int(os.getenv("BBPDF_MAX_FILE_MB", "50"))
MAX_FILES = int(os.getenv("BBPDF_MAX_FILES", "20"))
RATE_LIMIT = int(os.getenv("BBPDF_RATE_LIMIT_PER_MINUTE", "20"))
TIMEOUT = float(os.getenv("BBPDF_ENGINE_TIMEOUT_SECONDS", "300"))
ALLOWED_ORIGINS = [x.strip() for x in os.getenv("BBPDF_ALLOWED_ORIGINS", "").split(",") if x.strip()]

app = FastAPI(title="BBPDF API", version="1.0.0", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=False, allow_methods=["POST", "GET", "OPTIONS"], allow_headers=["Content-Type"])
_hits: dict[str, deque[float]] = defaultdict(deque)

def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    return forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

def enforce_rate_limit(request: Request) -> None:
    now = time.monotonic(); bucket = _hits[client_ip(request)]
    while bucket and now - bucket[0] >= 60: bucket.popleft()
    if len(bucket) >= RATE_LIMIT: raise HTTPException(429, "Too many requests. Please try again later.")
    bucket.append(now)

def validate_file(upload: UploadFile) -> None:
    if not (upload.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, f"Only PDF files are accepted: {upload.filename or 'unnamed file'}")

def check_count(files: list[UploadFile]) -> None:
    if not files: raise HTTPException(400, "At least one PDF file is required.")
    if len(files) > MAX_FILES: raise HTTPException(400, f"Maximum {MAX_FILES} files per operation.")
    for upload in files: validate_file(upload)

def normalize_filename(name: str | None, fallback: str) -> str:
    raw = os.path.basename(name or fallback).replace("\x00", "")
    return raw if raw.lower().endswith((".pdf", ".zip")) else f"{raw}.pdf"

async def call_engine(endpoint: str, files: list[UploadFile], fields: dict[str, str] | None = None, output_name: str = "bbpdf-result.pdf") -> Response:
    multipart = []
    for upload in files:
        await upload.seek(0)
        multipart.append(("fileInput", (upload.filename or "input.pdf", upload.file, upload.content_type or "application/pdf")))
    client = httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT, connect=15.0), follow_redirects=True)
    try:
        req = client.build_request("POST", f"{ENGINE_URL}{endpoint}", data=fields or {}, files=multipart)
        upstream = await client.send(req, stream=True)
        if upstream.status_code >= 400:
            detail = (await upstream.aread())[:2000].decode("utf-8", "replace")
            await upstream.aclose(); await client.aclose()
            raise HTTPException(upstream.status_code, detail or "PDF engine rejected the request.")
        media_type = upstream.headers.get("content-type", "application/octet-stream")
        content_length = upstream.headers.get("content-length")
        async def body() -> AsyncIterator[bytes]:
            try:
                async for chunk in upstream.aiter_bytes(1024 * 1024): yield chunk
            finally:
                await upstream.aclose(); await client.aclose()
        headers = {"Content-Disposition": f'attachment; filename="{normalize_filename(output_name, "bbpdf-result.pdf")}"', "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"}
        if content_length: headers["Content-Length"] = content_length
        return StreamingResponse(body(), media_type=media_type, headers=headers)
    except HTTPException: raise
    except httpx.TimeoutException as exc:
        await client.aclose(); raise HTTPException(504, "PDF processing timed out.") from exc
    except httpx.HTTPError as exc:
        await client.aclose(); raise HTTPException(502, "PDF engine is temporarily unavailable.") from exc

@app.get("/health")
async def health() -> dict[str, str]: return {"status": "ok", "service": "bbpdf"}

@app.get("/api/health")
async def api_health() -> dict[str, str]: return {"status": "ok", "service": "bbpdf"}

@app.post("/api/merge")
async def merge(request: Request, files: list[UploadFile] = File(...)) -> Response:
    enforce_rate_limit(request); check_count(files)
    if len(files) < 2: raise HTTPException(400, "Select at least two PDF files to merge.")
    return await call_engine("/api/v1/general/merge-pdfs", files, {"sortType": "orderProvided"}, "bbpdf-merged.pdf")

@app.post("/api/split")
async def split(request: Request, file: UploadFile = File(...), page_numbers: str = Form("all")) -> Response:
    enforce_rate_limit(request); check_count([file]); pages = page_numbers.strip() or "all"
    if len(pages) > 1000 or any(c not in "0123456789,- all" for c in pages.lower()): raise HTTPException(400, "Invalid page selection.")
    return await call_engine("/api/v1/general/split-pages", [file], {"pageNumbers": pages}, "bbpdf-split.zip")

@app.post("/api/compress")
async def compress(request: Request, file: UploadFile = File(...), optimize_level: int = Form(3)) -> Response:
    enforce_rate_limit(request); check_count([file])
    if optimize_level < 1 or optimize_level > 5: raise HTTPException(400, "Compression level must be between 1 and 5.")
    return await call_engine("/api/v1/misc/compress-pdf", [file], {"optimizeLevel": str(optimize_level)}, "bbpdf-compressed.pdf")
