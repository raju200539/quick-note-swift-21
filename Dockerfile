# Step 1: Use Node image to build the app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the Vite app (creates /dist)
RUN npm run build

# Step 2: Use NGINX to serve built files
FROM nginx:alpine

# Copy the built files to NGINX's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX when the container runs
CMD ["nginx", "-g", "daemon off;"]
