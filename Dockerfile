# syntax = docker/dockerfile:1

FROM node:22-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Piper is the server-side primary voice. Native Web Speech remains the
# browser fallback when Piper is unavailable or has no model for a language.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
	&& python3 -m venv /opt/piper-venv \
	&& /opt/piper-venv/bin/pip install --no-cache-dir piper-tts==1.8.0 \
	&& mkdir -p /opt/piper \
	&& /opt/piper-venv/bin/python -m piper.download_voices --data-dir /opt/piper \
		fr_FR-siwis-medium de_DE-thorsten-medium es_ES-davefx-medium \
		zh_CN-huayan-medium pt_BR-faber-medium \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

ENV PIPER_BIN=/opt/piper-venv/bin/piper
ENV PIPER_MODEL_FR=/opt/piper/fr_FR-siwis-medium.onnx
ENV PIPER_MODEL_DE=/opt/piper/de_DE-thorsten-medium.onnx
ENV PIPER_MODEL_ES=/opt/piper/es_ES-davefx-medium.onnx
ENV PIPER_MODEL_ZH=/opt/piper/zh_CN-huayan-medium.onnx
ENV PIPER_MODEL_PT=/opt/piper/pt_BR-faber-medium.onnx

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p data

EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
