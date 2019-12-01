'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'DeviceTokens',
      'token',
      {
        type: Sequelize.STRING,
        require: true,
        unique: true
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'DeviceTokens',
      'token',
      {
        type: Sequelize.STRING,
        require: true,
        unique: false
      }
    );
  }
};
