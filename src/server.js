require('dotenv').load();
require('babel/register');

var Sequelize = require('./lib/sequelize'),
  app = require('./app');

var port = process.env.PORT || 3000;

Sequelize.sync().then(function () {
  app.listen(port);
  console.log('Now listening on port ' + port);
});
