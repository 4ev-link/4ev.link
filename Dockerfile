# Use Node.js LTS version (Debian-based for glibc compatibility)
FROM node:20-slim

# Install required dependencies for workerd binary
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Note: .dev.vars is accessed via volume mount at runtime (see docker-compose.yml)
# No need to copy it during build

# Expose port for wrangler dev server
EXPOSE 8787

# Create volume for persistent data
VOLUME ["/app/.wrangler"]

# Default command to run wrangler dev
CMD ["npx", "wrangler", "pages", "dev", ".", "--port", "8787", "--ip", "0.0.0.0"]
