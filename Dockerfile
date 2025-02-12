# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json first (for caching layers)
COPY package.json ./

# Install dependencies efficiently
RUN npm install --force

# Copy all files to container
COPY . .

# Build React app
RUN npm run build

# Set environment variable for ports
ENV PORT=3000

# Expose port for external access
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
