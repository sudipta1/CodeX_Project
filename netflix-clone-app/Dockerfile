FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
