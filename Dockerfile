# Multi-stage build for LogicMonitor MCP Server

# Stage 1: Build
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code (needed before npm ci because prepare script runs build)
COPY src ./src

# Install dependencies (including dev dependencies for build)
# The prepare script will automatically run npm run build
RUN npm ci

# Remove dev dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application and dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose ports for HTTP/SSE transport modes
EXPOSE 3000

# Set default environment variables
ENV NODE_ENV=production \
    MCP_TRANSPORT=stdio \
    MCP_LOG_FORMAT=json \
    MCP_LOG_LEVEL=info

# Health check (for HTTP/SSE modes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command (can be overridden)
CMD ["node", "build/servers/index.js"]

