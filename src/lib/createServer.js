import chalk from 'chalk';
import http from 'http';
import app from '../api';
import socketApp from '../messager';

let createServer = (port=3000) => {
  let server = http.createServer(app);
  socketApp.attach(server);
  server.listen(port);
  console.log(chalk.green('Now listening on port ' + port));
  return server;
};

export default createServer;
