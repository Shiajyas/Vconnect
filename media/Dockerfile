# ---------- STAGE 1: Build ----------
FROM node:18-bullseye AS builder

WORKDIR /app

# Install essential system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  python3-pip \
  build-essential \
  git \
  pkg-config \
  libtool \
  autoconf \
  automake \
  cmake \
  libssl-dev \
  libuv1-dev \
  libsctp-dev \
  meson \
  ninja-build \
  linux-headers-amd64 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Ensure /usr/bin/python points to python3
RUN ln -sf python3 /usr/bin/python

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --prefer-offline --no-audit --progress=false

# Copy the full source code and build
COPY . .

# Build TypeScript (adjust if build script is different)
RUN npm run build

# ---------- STAGE 2: Production ----------
FROM node:18-bullseye AS prod

WORKDIR /app

# Copy only package files and install prod dependencies
COPY package*.json ./
RUN npm install --only=production --prefer-offline --no-audit --progress=false

# Copy built code and env
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env . 

# Expose app and MediaSoup ports
EXPOSE 3000
EXPOSE 40000-40100/udp

# Start app
CMD ["node", "dist/app.js"]
