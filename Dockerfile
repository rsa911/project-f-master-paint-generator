FROM node:20-alpine

# better-sqlite3 requires native build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

RUN mkdir -p /app/data

EXPOSE 3001
CMD ["node", "server/index.js"]
