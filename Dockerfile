FROM node:6.7

WORKDIR /code
COPY package.json /code/package.json
RUN npm install && npm ls

ENV NODE_ENV production

COPY . /code
RUN npm run transpile
RUN npm prune


ENTRYPOINT ["/code/docker-entrypoint.sh"]
CMD ["npm", "start"]