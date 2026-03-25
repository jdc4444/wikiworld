FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 4174
ENV PORT=4174
CMD ["node", "server.js"]
