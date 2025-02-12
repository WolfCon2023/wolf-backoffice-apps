# Use official Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all project files, including `app/public/` and `src/`
COPY . .

# Debugging: Ensure `app/public/` exists
RUN ls -al /app/public || echo "WARNING: /app/public is missing"

# Build the React app
RUN npm run build

# Ensure the build folder exists
RUN ls -al /app/build || echo "WARNING: /app/build is missing"

# Expose the correct port
EXPOSE 8080

# Serve the React app using `serve`
CMD ["npx", "serve", "-s", "build", "-l", "8080"]
