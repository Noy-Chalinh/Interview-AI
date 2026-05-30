FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 3000

# Apply any pending migrations to the (Render-injected) database, then start.
# Keeps the production schema in sync on every deploy without a manual step.
CMD ["npm", "run", "start:prod"]
