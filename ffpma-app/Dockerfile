# Use Node.js 20 Alpine for a lightweight, secure container
FROM node:20-alpine

# Install OS dependencies (fluent-ffmpeg needs ffmpeg)
RUN apk add --no-cache ffmpeg python3 make g++ 

WORKDIR /app

# Copy package descriptors first to maximize Docker cache leverage
COPY package*.json ./

# Install all dependencies required for the build process
RUN npm install

# Copy application source code
COPY . .

# Execute the Replit-compatible Vite + Express build 
RUN npm run build

# Setup Production Environment Variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the standard 5000 port for Cloud Run routing
EXPOSE 5000

# Initialize the backend server
CMD ["npm", "start"]
