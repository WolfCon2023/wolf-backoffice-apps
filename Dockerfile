# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --force

# Copy public/ **before** building
COPY public/ public/

# Copy all files to container
COPY . .

# Build React app
RUN npm run build

# Ensure `build/` exists
RUN ls -l /app/build

# Set environment variable for ports
ENV PORT=8080

# Expose port for external access
EXPOSE 8080

# Start the application with `serve`
CMD ["npx", "serve", "-s", "build"]
