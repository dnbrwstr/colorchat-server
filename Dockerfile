FROM node:10.15.2
ADD . /var/www
WORKDIR /var/www
RUN npm install
CMD /var/www/init.sh
