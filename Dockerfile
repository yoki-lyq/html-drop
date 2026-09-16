FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY public ./public

ENV PORT=8080 \
    DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 8080

CMD ["node", "server.js"]
