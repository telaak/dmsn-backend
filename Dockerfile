FROM node:18-alpine as base

WORKDIR /app
COPY . .
USER node
RUN npm i
RUN npx tsc

FROM node:18-alpine as runner
WORKDIR /app
COPY --from=base ./app/dist ./dist
COPY package*.json ./
ENV NODE_ENV production
USER node
RUN npm i
EXPOSE 4500

CMD [ "node", "./dist/index.js" ]