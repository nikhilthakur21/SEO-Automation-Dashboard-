FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY src ./src

EXPOSE 4000
CMD ["npm", "run", "worker"]
