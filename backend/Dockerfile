# Backend image for Render / Railway / Fly / any Docker host.
# Installs Node (for the API) + Python/ffmpeg (for yt-dlp, which does the
# actual Instagram/Facebook/YouTube extraction).
FROM node:20-slim

# python3 + pip -> yt-dlp itself; ffmpeg -> needed by yt-dlp to merge
# separate video+audio streams for some YouTube qualities.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
