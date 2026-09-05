# Stage 1: Build Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application and build it for production
COPY . .
RUN npx ng build --configuration production

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy the specific browser distribution folder from Angular builder
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Replace default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
