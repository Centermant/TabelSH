FROM node:22-alpine

WORKDIR /app

COPY backend/package.json ./backend/package.json
WORKDIR /app/backend

RUN npm install
WORKDIR /app

COPY backend/ ./backend
COPY public/ ./public

WORKDIR /app/backend

EXPOSE 3000
CMD [ "npm", "start" ]