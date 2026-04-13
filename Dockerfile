FROM node:20-alpine AS deps
WORKDIR /app

# Copy all package manifests so npm can resolve workspaces
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Single root install wires up both workspaces
RUN npm install

# ---- Build client ----
FROM deps AS build
WORKDIR /app

# Copy full source
COPY . .

# Vite builds into server/public
RUN cd client && npm run build

# ---- Production image ----
FROM node:20-alpine AS production
WORKDIR /app

# Only copy what the server needs at runtime
COPY package.json ./
COPY server/package.json ./server/
COPY shared/ ./shared/

# Install server deps only (no devDeps, no client)
RUN npm install --workspace=server --omit=dev

# Copy server source and the built client assets
COPY server/ ./server/
COPY --from=build /app/server/public ./server/public

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
