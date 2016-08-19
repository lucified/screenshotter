FROM node:6

WORKDIR /code
ENV NODE_ENV production
COPY package.json /code/package.json
RUN npm install

COPY ./dist/src /code

CMD ["npm", "start"]