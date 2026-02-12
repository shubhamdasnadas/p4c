# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use --force if you have peer dependency issues
RUN npm install
COPY . .

# Run the build - THIS MUST BE HERE
RUN npm run build

# Stage 2: Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# We use wildcards (*) to catch next.config.js OR next.config.mjs
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]