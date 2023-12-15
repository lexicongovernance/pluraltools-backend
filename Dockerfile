FROM node:20-bullseye-slim as builder

RUN npm install -g pnpm

WORKDIR /app

# Install the dependencies.
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:20-bullseye-slim as runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/dist ./dist
EXPOSE 8080

ENTRYPOINT [ "node", "dist/index.js" ]




