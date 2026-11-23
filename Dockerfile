# syntax=docker/dockerfile:1
# Backend: Node.js/Express (Linux container). Node 22 matches node:sqlite tests.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# npm install supports a previously generated package-lock that has not yet
# been updated for the new pg dependency; commit the regenerated lock after
# running npm install locally. The versions are pinned in package.json.
RUN npm install --omit=dev --no-audit --no-fund
COPY src/ ./src/
COPY domain/ ./domain/
# Allow a standalone API container to create its local SQLite database.
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
