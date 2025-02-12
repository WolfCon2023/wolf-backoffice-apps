# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json first (for caching layers)
COPY package.json package-lock.json ./

# Install dependencies (without --force)
RUN npm install

# Copy all project files
COPY . . 

# Ensure `public/` is copied before building
RUN mkdir -p public && cp -r public/ /app/public/

# Build React app
RUN npm run build

# Ensure `build/` exists before deployment
RUN ls -l /app/build || echo "WARNING: build/ is missing"

# Set environment variable for ports (Use Railway's default)
ENV PORT=8080

# Expose port for external access
EXPOSE 8080

# Serve the React app correctly
CMD ["npx", "serve", "-s", "build", "-l", "8080"]
