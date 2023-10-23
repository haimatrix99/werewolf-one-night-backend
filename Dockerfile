FROM node:18-alpine3.14
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
RUN npm install typescript
COPY . .
RUN npm run build
CMD [ "npm", "start" ]
EXPOSE 5000