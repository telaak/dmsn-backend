FROM node:18-alpine as base

WORKDIR /app
COPY . .
RUN apk add --no-cache --virtual .gyp \
            python3 \
            make \
            linux-headers \
            udev \
            g++ \
    && npm install serialport --build-from-source \
    && npm install \
    && apk del .gyp
RUN npx tsc

FROM node:18-alpine as runner
WORKDIR /app
COPY --from=base ./app/dist ./dist
COPY package*.json ./
ENV NODE_ENV production
RUN npm i

EXPOSE 4500

CMD [ "node", "./dist/index.js" ]