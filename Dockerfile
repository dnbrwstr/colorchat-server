FROM node:10.15.2-alpine
ADD . /var/www
WORKDIR /var/www
RUN npm install
CMD /var/www/init.sh