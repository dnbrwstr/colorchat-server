FROM node:10.17-buster-slim
ADD . /var/www
WORKDIR /var/www
# buster is end-of-life; its packages now live on archive.debian.org
RUN printf 'deb http://archive.debian.org/debian buster main\ndeb http://archive.debian.org/debian-security buster/updates main\n' > /etc/apt/sources.list \
  && apt-get update && apt-get -y install git \
  && npm install -g yarn \
  && yarn install && yarn build \
  && rm -rf node_modules \
  && yarn install --prod \
  && rm -rf .git \
  && apt-get clean
CMD /var/www/init.sh
