FROM node:lts-buster

RUN apt update && apt install -y curl python3 python3-pip ffmpeg && \
    pip3 install -U yt-dlp

RUN git clone https://github.com/Ainz-devs/ytdl--ovl.git /root/ytdl

WORKDIR /root/ytdl

COPY package.json .
RUN npm install
COPY . .

EXPOSE 8000

CMD ["npm", "run", "start"]
