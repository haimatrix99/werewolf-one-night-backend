FROM node:18-alpine3.14
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD [ "npm", "start" ]
EXPOSE 5000