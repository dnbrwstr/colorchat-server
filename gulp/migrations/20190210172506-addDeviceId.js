'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('DeviceTokens', 'deviceId', {
      type: Sequelize.STRING,
      require: true,
      unique: true
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('DeviceTokens', 'deviceId')
  }
};
