FROM node:22-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --silent

COPY frontend/ ./
COPY .env* ./

RUN npm run build

FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
