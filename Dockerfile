# Imagen única: API (Express) + web (React) servida por la misma API.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY apps ./apps
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production WEB_DIST=/app/apps/web/dist PORT=3000
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev -w @healthleap/api && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY apps/api/db apps/api/db
RUN mkdir -p apps/api/logs && chown -R node:node apps/api/logs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1
WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
