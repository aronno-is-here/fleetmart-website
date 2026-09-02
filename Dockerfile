FROM node:20-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Install client dependencies and build
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client ./client
RUN cd client && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy server
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server ./server

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p server/uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/server.js"]
