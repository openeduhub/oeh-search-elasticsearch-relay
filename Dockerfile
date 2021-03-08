FROM node:14-alpine

ENV NODE_ENV production
ENV PORT 80

EXPOSE 80

WORKDIR /home/node/app

COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist

CMD [ "npm", "run", "start:prod" ]
