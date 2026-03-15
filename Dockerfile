FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts && npm cache clean --force

FROM node:22-slim
RUN groupadd -r dragonclaw && useradd -r -g dragonclaw -m dragonclaw
WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Data directory
RUN mkdir -p /data && chown -R dragonclaw:dragonclaw /data /app
VOLUME /data

# Run as non-root
USER dragonclaw

ENV NODE_ENV=production
ENV DRAGONCLAW_DATA_DIR=/data

EXPOSE 18789

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:18789/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
