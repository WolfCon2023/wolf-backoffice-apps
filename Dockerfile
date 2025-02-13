# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies efficiently
RUN npm install --force

# Copy all project files
COPY . . 

# Ensure `build/` exists before running the build
RUN mkdir -p build

# Build React app
RUN npm run build

# Confirm `build/` directory exists after build
RUN ls -l /app/build

# Set environment variable for ports
ENV PORT=5000

# Expose port for external access
EXPOSE 5000

# Start the application using `serve`
CMD ["npx", "serve", "-s", "build"]
