let Sequelize = require('sequelize'),
  sequelize = require('../lib/sequelize');

import { PermissionsError } from '../lib/errors';

let maxCodesCreated = 20;
let maxConfirmationAttempts = 6;

let NumberConfirmation = sequelize.define('NumberConfirmation', {
  phoneNumber: {
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
  },
  codesCreated: {
    type: Sequelize.INTEGER,
    required: true,
    defaultValue: 0
  },
  codeLocked: {
    type: Sequelize.BOOLEAN,
    required: true,
    defaultValue: false
  },
  phoneNumberLocked: {
    type: Sequelize.BOOLEAN,
    require: true,
    defaultValue: false
  }
}, {
  classMethods: {
    createOrUpdateFromNumber: async function (phoneNumber) {
      let confirmation = await NumberConfirmation.findWithNumber(phoneNumber);
      let code = Math.floor(Math.random() * 999999).toString();

      if (confirmation) {
        if (confirmation.phoneNumberLocked) {
          throw new PermissionsError('You have created the maximum number of confirmation codes');
        }

        await confirmation.increment('codesCreated');
        await confirmation.reload();

        if (confirmation.codesCreated >= maxCodesCreated) {
          await confirmation.update({
            phoneNumberLocked: true
          });

          throw new PermissionsError('You have created the maximum number of confirmation codes');
        } else {
          await confirmation.update({
            code: code,
            codeLocked: false,
            attempts: 0
          });

          return confirmation;
        }
      } else {
        return NumberConfirmation.create({
          code: code,
          phoneNumber: phoneNumber
        });
      }
    },

    attemptValidationWhere: async function (data) {
      let confirmation = await NumberConfirmation.findWithNumber(data.phoneNumber);

      if (!confirmation) {
        throw new PermissionsError('No matching confirmation found');
      } else {
        if (confirmation.codeLocked) {
          throw new PermissionsError('Too many confirmation attempts');
        }

        await confirmation.increment('attempts');
        await confirmation.reload();

        if (confirmation.attempts >= maxConfirmationAttempts) {
          await confirmation.update({
            codeLocked: true
          });
          throw new PermissionsError('Too many confirmation attempts');
        } else if (confirmation && confirmation.code == data.code) {
          return confirmation;
        } else {
          throw new PermissionsError('Invalid code');
        }
      }
    },

    findWithNumber: (phoneNumber) => NumberConfirmation.find({ where: { phoneNumber } })
  }

});

module.exports = NumberConfirmation;
