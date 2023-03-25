FROM node:18-alpine as base

WORKDIR /app
COPY . .
RUN npm i
RUN npx tsc

FROM node:18-alpine as runner
WORKDIR /app
COPY --from=base ./app/dist ./dist
COPY package*.json ./
ENV NODE_ENV production
RUN npm i
RUN rm -rf ./node_modules/content-type/HISTORY.md
EXPOSE 4500

CMD [ "node", "./dist/index.js" ]