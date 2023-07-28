# FROM node:18-bullseye as bot
# WORKDIR /app
# COPY package*.json ./
# RUN npm i
# COPY . .
# ARG RAILWAY_STATIC_URL
# ARG PUBLIC_URL
# ARG PORT
# CMD ["npm", "start"]

FROM --platform=linux/amd64 node:18-bullseye as bot
# RUN npm cache clean --force
# RUN npm install -g ts-node ts-express
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
# RUN npm run tsc

# WORKDIR /app

# COPY . /app
ENV DB_URI=mongodb+srv://molledafreddy:freddy2..@cluster0.1e16p.mongodb.net
ENV MONGO_DB_NAME='db_bot'
ENV URL='https://api-manager-o3iu9.ondigitalocean.app'

# RUN npm install

# ENV NODE_ENV=production

EXPOSE 3000

CMD [ "npm", "run", "start" ]
