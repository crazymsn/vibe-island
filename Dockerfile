# Static site served by an unprivileged nginx (runs as uid 101, listens on 8080).
FROM nginxinc/nginx-unprivileged:1.28-alpine

LABEL org.opencontainers.image.title="vibe-island" \
      org.opencontainers.image.description="Vibe Island open-source website" \
      org.opencontainers.image.source="https://github.com/crazymsn/vibe-island" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY index.html /usr/share/nginx/html/index.html
COPY assets/ /usr/share/nginx/html/assets/
COPY downloads/ /usr/share/nginx/html/downloads/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
