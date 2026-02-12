# Base stage
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy shared package
COPY packages/shared packages/shared

# Copy api service package
COPY services/api/package.json services/api/package.json

# Install dependencies using legacy-peer-deps due to React 19 conflicts in other apps
# (Though API doesn't use React, we are in a workspace)
RUN npm install --legacy-peer-deps

# Copy the rest of the files needed for the API
COPY services/api services/api

# Final stage
FROM node:20-slim
WORKDIR /app
COPY --from=base /app /app

EXPOSE 5000
WORKDIR /app/services/api
CMD ["npm", "start"]
