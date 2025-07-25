FROM node:lts-alpine

RUN apk add --no-cache \
    curl \
    python3 \
    py3-pip \
    ffmpeg \
    git && \
    pip3 install --break-system-packages --upgrade yt-dlp

RUN git clone https://github.com/Ainz-devs/ytdl--ovl.git /app

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .

EXPOSE 8000

CMD ["npm", "run", "start"]
