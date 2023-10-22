FROM node:12-alpine3.14
WORKDIR /app
COPY package.json /app
RUN npm ci --only=production && npm cache clean --force
COPY . /app
CMD npm start
EXPOSE 5000