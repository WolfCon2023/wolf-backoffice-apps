# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (cache layer optimization)
COPY package.json package-lock.json ./

# Install dependencies efficiently
RUN npm install --force

# Copy all project files (including `public/` & `src/`)
COPY . .

# Build React app
RUN npm run build

# ? Debugging: List directory contents to confirm where index.html is
RUN echo "Listing contents of /app after build:" && ls -l /app
RUN echo "Listing contents of /app/build after build:" && ls -l /app/build

# Ensure `build/` exists before deployment
RUN ls -l /app/build

# Set environment variable for ports
ENV PORT=8080

# Expose port for external access
EXPOSE 8080

# Start the application
CMD ["npx", "serve", "-s", "build"]
