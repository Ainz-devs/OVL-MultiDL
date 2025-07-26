FROM node:lts-alpine

RUN apk add --no-cache \
    git

RUN git clone https://github.com/Ainz-devs/OVL-MultiDL.git /app

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .

EXPOSE 8000

CMD ["npm", "run", "start"]
