FROM node:16-alpine

WORKDIR /app

COPY . .

RUN apk add --no-cache make
RUN yarn global add typescript --network-concurrency 1
RUN yarn install
RUN yarn build

EXPOSE 8080

CMD ["yarn", "start"]
