import chalk from 'chalk';
import http from 'http';
import app from '../api';
import createMessageClient from '../messager';

let createServer = async (port=3000) => {
  let server = http.createServer(app);
  let socketApp = await createMessageClient();
  socketApp.attach(server);
  server.listen(port);
  console.log(chalk.green('Now listening on port ' + port));
  return server;
};

export default createServer;
