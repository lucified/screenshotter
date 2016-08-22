FROM node:6

WORKDIR /code
ENV NODE_ENV production
COPY package.json /code/package.json
RUN npm install

COPY ./dist/src /code/dist/src
COPY ./docker-entrypoint.sh /code/docker-entrypoint.sh

#RUN apt-get update && apt-get install -y --no-install-recommends \
#		resolvconf \
#    && rm -rf /var/lib/apt/lists/*
#RUN echo "foobar" >> /etc/resolv.conf
#RUN cd /etc/ && mv resolv.conf resolv.conf.docker && ln -s ./resolv.conf.docker resolv.conf
ENTRYPOINT ["/code/docker-entrypoint.sh"]
CMD ["npm", "start"]