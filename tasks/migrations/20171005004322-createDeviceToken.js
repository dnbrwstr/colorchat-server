require('@babel/register');
var db = require('../../src/lib/db').default;
var User = require('../../src/models/User').default;
var DeviceToken = require('../../src/models/DeviceToken').default;

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('DeviceTokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      platform: {
        allowNull: false,
        type: Sequelize.STRING
      },
      token: {
        allowNull: false,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      UserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }).then(function () {
      return db.sync();
    }).then(function () {
      return User.findAll();
    }).then(function (users) {
      const updatePromises = users.map(u => {
        const tokens = u.deviceTokens.map(t => {
          return {
            platform: 'ios',
            token: t,
            UserId: u.id
          };
        });

        return DeviceToken.bulkCreate(tokens);
      });

      return Promise.all(updatePromises);
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('DeviceTokens');
  }
};