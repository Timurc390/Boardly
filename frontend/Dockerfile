ARG REACT_APP_API_URL=http://localhost:8000

FROM node:18-alpine AS build
WORKDIR /app
ENV REACT_APP_API_URL=$REACT_APP_API_URL
COPY frontend/package*.json ./
RUN npm ci
COPY frontend /app
RUN npm run build

FROM nginx:alpine
COPY frontend/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
