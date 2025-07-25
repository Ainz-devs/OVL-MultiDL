FROM node:lts-alpine

RUN apk add --no-cache \
    curl \
    python3 \
    py3-pip \
    ffmpeg \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont && \
    pip3 install --break-system-packages --upgrade yt-dlp

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN git clone https://github.com/Ainz-devs/ytdl--ovl.git /app

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .

EXPOSE 8000

CMD ["npm", "run", "start"]
