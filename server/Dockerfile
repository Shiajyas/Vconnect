FROM node:18-alpine

WORKDIR /usr/src

RUN apk add --no-cache python3 py3-pip build-base \
    && ln -sf python3 /usr/bin/python

COPY package*.json ./
RUN npm install

# 👇 This will include the pre-built `dist/`
COPY . .

EXPOSE 3009

CMD ["node", "dist/app.js"]
