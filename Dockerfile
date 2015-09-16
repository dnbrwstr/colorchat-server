FROM node
ADD . /var/www
WORKDIR /var/www
RUN npm install
CMD npm start
