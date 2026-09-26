# Step 1: Base build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (sharp, bcrypt)
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Step 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache vips

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Create storage directory
RUN mkdir -p /data/storage

EXPOSE 8080

CMD ["node", "dist/server.js"]
