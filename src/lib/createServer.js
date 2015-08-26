import chalk from 'chalk';
import http from 'http';
import app from '../apps/main';
import socketApp from '../apps/message';

let createServer = () => {
  var port = process.env.PORT || 3000;
  var server = http.createServer(app);
  socketApp.attach(server);
  server.listen(port);
  console.log(chalk.green('Now listening on port ' + port));
  return server;
}

export default createServer;
