FROM node:16-alpine as base

WORKDIR /home/node/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm i

COPY . .

EXPOSE 3000

RUN npm run build

CMD [ "node", "index.js" ]