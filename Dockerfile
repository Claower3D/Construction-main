FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy WebVersion frontend and project files
COPY WebVersion/ ./WebVersion/

# Set default port
ENV PORT=3030
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3030}/ || exit 1

# Start SPA server
CMD ["sh", "-c", "npx serve WebVersion -s -l ${PORT:-3030}"]
