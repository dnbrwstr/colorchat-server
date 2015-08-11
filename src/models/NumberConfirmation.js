let Sequelize = require('sequelize'),
  PermissionsError = require('../lib/errors').Permissions,
  sequelize = require('../lib/sequelize');

let maxConfirmationAttempts = 6;

let NumberConfirmation = sequelize.define('NumberConfirmation', {
  number: {
    type: Sequelize.STRING,
    required: true
  },
  code: {
    type: Sequelize.STRING,
    required: true
  },
  attempts: {
    type: Sequelize.INTEGER,
    required: true,
    defaultValue: 0
  }
}, {
  classMethods: {
    attemptValidationWhere: async function (data) {
      let confirmation = await this.find({ where: { number: data.number } });

      if (!confirmation) {
        throw new PermissionsError('No matching confirmation found');
      } else {
        confirmation = await confirmation.increment('attempts');
        confirmation = await confirmation.reload();

        if (confirmation.attempts >= maxConfirmationAttempts) {
          await confirmation.destroy();
          throw new PermissionsError('Too many confirmation attempts');
        } else if (confirmation && confirmation.code == data.code) {
          return confirmation;
        } else {
          throw new PermissionsError('Invalid code');
        }
      }
    }
  }
});

module.exports = NumberConfirmation;
