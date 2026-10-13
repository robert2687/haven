FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ffmpeg: audio decode for STT uploads. curl: container HEALTHCHECK.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /srv/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Only the app package: never COPY . . (that would bake .env secrets in).
COPY app ./app

# OpenShift-friendly non-root user (platform may still override the UID).
RUN useradd -u 1001 -r -s /usr/sbin/nologin haven && chown -R haven:root /srv/app
USER 1001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
