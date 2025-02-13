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

# Build React app (Ensures `/app/build` is created)
RUN npm run build

# Debugging: Confirm `build/` exists after build
RUN ls -l /app/build

# Set environment variable for ports
ENV PORT=5000

# Expose port for external access
EXPOSE 5000

# Start the application using `serve`
CMD ["npx", "serve", "-s", "build", "-l", "5000"]
