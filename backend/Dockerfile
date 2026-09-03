# syntax=docker/dockerfile:1

# Nest analogy: this replaces `FROM node:XX` + `npm ci`. `uv` is the
# package manager (like npm/pnpm) and its official image ships a
# static `uv` binary we copy in rather than installing via pip.
FROM python:3.12-slim

# Bring in the uv binary itself (no separate install step needed)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Environment tuning for containers:
# - bytecode compile on install for faster cold start
# - copy instead of symlink (safer across bind mounts, esp. on podman)
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

# Install dependencies first (cache-friendly layer), separate from app code —
# same reasoning as copying package.json before the rest of a Nest app.
COPY pyproject.toml ./
RUN uv sync --no-install-project

# Now copy the actual app code and sync again to pick up local changes
COPY . .
RUN uv sync

# Make the venv's binaries (uvicorn, etc.) available directly on PATH
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# --reload watches for file changes, same purpose as `nest start --watch`.
# Swap this out for a plain `uvicorn app.main:app --host 0.0.0.0 --port 8000`
# (no --reload) once you move towards a production image.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
