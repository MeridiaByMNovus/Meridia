# Use the official electron-builder image with Wine for cross-platform builds
FROM electronuserland/builder:wine

# Set working directory
WORKDIR /app

# Set environment variables
ENV ELECTRON_CACHE="/root/.cache/electron"
ENV ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder"

# Install additional dependencies if needed
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set default command
CMD ["npm", "run", "package"]
