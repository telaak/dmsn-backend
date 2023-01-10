FROM node:16-alpine as base

WORKDIR /home/node/app

COPY package*.json ./
COPY tsconfig.json ./

RUN apk add --no-cache --virtual .gyp \
            python3 \
            make \
            linux-headers \
            udev \
            g++ \
    && npm install serialport --build-from-source \
    && npm install \
    && npm install typescript -g \
    && apk del .gyp

COPY . .

EXPOSE 3000

RUN npm run build

CMD [ "node", "index.js" ]