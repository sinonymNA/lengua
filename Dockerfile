FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install --workspace=server
RUN npm install --workspace=client

# Build client
COPY client/ ./client/
RUN npm run build --workspace=client

# Copy server
COPY server/ ./server/
COPY shared/ ./shared/

# Expose port
EXPOSE 3000

# Start server
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
