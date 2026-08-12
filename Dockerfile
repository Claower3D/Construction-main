FROM node:18-alpine

WORKDIR /app

# 1. Install frontend dependencies and build React app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Install backend dependencies
COPY WebVersion/backend/package*.json ./WebVersion/backend/
RUN cd WebVersion/backend && npm install --only=production

# 3. Copy the rest of the backend files
COPY WebVersion/ ./WebVersion/

# 4. Copy root package json
COPY package.json ./

# Set default port
ENV PORT=3030
EXPOSE 3030

# Start the backend server (which will serve frontend/dist)
CMD ["npm", "start"]
