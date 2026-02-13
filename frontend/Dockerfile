FROM node:18-alpine

# Install Docker CLI
RUN apk add --no-cache docker-cli git

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
