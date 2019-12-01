FROM alpine
ADD . /var/www
WORKDIR /var/www
RUN apk update && apk --no-cache add yarn git \
  && yarn install && yarn build \
  && rm -rf node_modules \
  && yarn install --prod \
  && yarn autoclean --init \
  && rm -rf .git

FROM node:10.17-alpine
RUN apk update && apk add --no-cache gcompat
WORKDIR /var/www
COPY --from=0 /var/www .
CMD /var/www/init.sh
