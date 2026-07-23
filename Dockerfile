# Railway build — explicit Node.js so auto-detection doesn't mis-identify the
# Python catalogue-generation scripts in this repo as a Python project.
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Manifests first so npm install caches across builds when deps don't change.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build (vite client + esbuild server -> dist/index.cjs)
COPY . .
RUN npm run build

ENV NODE_ENV=production

# Railway injects PORT; the server reads process.env.PORT.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT:-5000}/api/health" || exit 1

USER node
CMD ["node", "dist/index.cjs"]
