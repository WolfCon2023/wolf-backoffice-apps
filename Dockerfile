# Step 1: Use the official Node.js image
FROM node:18

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json (for caching layers)
COPY package.json package-lock.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy all project files (including `public/` and `src/`)
COPY . .

# Step 6: Build the React app
RUN npm run build

# Step 7: Ensure `build/` directory is present (for debugging purposes)
RUN ls -l /app/build || echo "build/ is missing"

# Step 8: Set environment variable for the port Railway uses
ENV PORT=8080

# Step 9: Expose port 8080 to serve the app
EXPOSE 8080

# Step 10: Serve the React app using the 'serve' command (using the `build/` directory)
CMD ["npx", "serve", "-s", "build", "-l", "8080"]
