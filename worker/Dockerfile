FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy worker-specific dependencies
COPY worker/package.json ./

# Install production dependencies
RUN npm install --production

# Copy built worker files
COPY dist-workers/workers/ ./dist-workers/workers/
COPY dist-workers/lib/ ./dist-workers/lib/

# Copy environment variables
COPY .env.production ./

# Start the worker
CMD ["npm", "start"]