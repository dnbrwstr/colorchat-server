var http = require('http'),
  app = require('../apps/main'),
  socketApp = require('../apps/message');

import chalk from 'chalk';

let createServer = () => {
  var port = process.env.PORT || 3000;
  var server = http.createServer(app);
  socketApp.attach(server);
  server.listen(port);
  console.log(chalk.green('Now listening on port ' + port));
  return server;
}

export default createServer;
