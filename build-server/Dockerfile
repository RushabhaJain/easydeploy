FROM node:alpine

RUN apk update
RUN apk add git

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

RUN chmod +x main.sh
RUN chmod +x script.js

CMD ["sh", "main.sh"]