FROM node:18-alpine as build

WORKDIR /app

ARG VITE_API_URL
ARG VITE_ROUTER_BASENAME
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ROUTER_BASENAME=${VITE_ROUTER_BASENAME}

# Copy package files
COPY package*.json ./

# Install dependencies (build needs dev dependencies like Vite)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
