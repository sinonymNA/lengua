FROM node:20-alpine AS deps
WORKDIR /app

# better-sqlite3 needs a native build
RUN apk add --no-cache python3 make g++

COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install

# ── Build client ──────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app

COPY . .

# Vite outputs to server/public/
RUN cd client && npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Need python3/make/g++ in production too (better-sqlite3 native module)
RUN apk add --no-cache python3 make g++

COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY shared/ ./shared/

RUN npm install --workspace=server --omit=dev

COPY server/ ./server/
COPY --from=build /app/server/public ./server/public

# The DB file lives here; mount a Railway volume at /data to persist it
RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/lengua.db

CMD ["node", "server/index.js"]
