# Drawflow: dependencies -> build -> tests -> CDN files
# The GitHub Actions workflow (.github/workflows/test.yml) builds and tests the same way, with npm.

ARG NODE_IMAGE=node:20-bookworm-slim
ARG PLAYWRIGHT_IMAGE=mcr.microsoft.com/playwright:v1.48.2-jammy

# 1. Dependencies (the browsers come from the Playwright image, not from npm)
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build: dist/ with webpack and gulp
FROM deps AS build
COPY webpack.config.js gulpfile.js ./
COPY src ./src
RUN npm run build

# 3. Browser tests in Chromium, Firefox and WebKit, against the built dist/
FROM ${PLAYWRIGHT_IMAGE} AS test
WORKDIR /app
ENV HOME=/root PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY test ./test
COPY --from=build /app/dist ./dist
CMD ["npm", "test"]

# 4. Export: copies the CDN files to /out (a bind mount of ./dist in docker-compose.yml)
FROM busybox:1.36 AS export
COPY --from=build /app/dist /dist
CMD ["sh", "-c", "cp -r /dist/. /out/ && ls -l /out"]

# 5. Final image: only the CDN files
FROM scratch AS cdn
COPY --from=build /app/dist /dist
