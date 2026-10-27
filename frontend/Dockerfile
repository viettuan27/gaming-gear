FROM node:22-alpine AS build

WORKDIR /app

ARG APP_TARGET=storefront
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_STOREFRONT_URL=http://localhost:5173

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_STOREFRONT_URL=${VITE_STOREFRONT_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:${APP_TARGET} && cp -r "dist/${APP_TARGET}" /app-output

FROM nginx:1.27-alpine

COPY --from=build /app-output /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
