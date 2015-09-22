#!/bin/sh
#

if [ -d /etc/secrets ] && [ "$(ls -A /etc/secrets)" ]; then
  for folder in /etc/secrets/*; do
    for file in ${folder}/env.*; do
      export `cat $file`
    done
  done
else
  echo "No secrets folder found, trying to run anyway"
fi

npm start