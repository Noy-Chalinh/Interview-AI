FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start Vite development server, bound to all interfaces so the published
# port is reachable from the host (a stray `--` makes Vite ignore --host).
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0"]
