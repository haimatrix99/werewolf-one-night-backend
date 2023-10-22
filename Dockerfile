FROM node:18-alpine3.14
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --omit=dev
COPY . /app
RUN npm run build
CMD npm start
EXPOSE 5000