# deploy/Dockerfile
# Multi-stage production container build for Google Cloud Run

FROM python:3.9-slim as builder

WORKDIR /app

# Install build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Runtime Image
FROM python:3.9-slim

WORKDIR /app

# Copy python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Copy application source code and knowledge base
COPY app/ ./app/
COPY core/ ./core/
COPY agents_pool/ ./agents_pool/
COPY knowledge_base/ ./knowledge_base/
COPY requirements.txt .

EXPOSE 8080

CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
