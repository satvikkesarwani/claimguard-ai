# ClaimGuard AI — single-service image for Railway (and local Docker).
# Stage 1 builds the React app; Stage 2 serves the API + the built SPA from FastAPI.

# ---------- Stage 1: build the frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci || npm install
COPY frontend/ ./
# No VITE_API_BASE: the app calls same-origin /api in production.
RUN npm run build

# ---------- Stage 2: backend + static SPA ----------
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    STATIC_DIR=/app/static \
    CLAIMGUARD_DB=/app/data/claimguard.db

COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend/app ./app
COPY --from=frontend /fe/dist ./static
RUN mkdir -p /app/data

# Railway provides $PORT at runtime; default to 8000 locally.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
