import Sequelize from 'sequelize';
import db from '../lib/db';
import { PermissionsError } from '../lib/errors';
import { normalize } from '../lib/PhoneNumberUtils';

let maxCodesCreated = 20;
let maxConfirmationAttempts = 6;

let ConfirmationCode = db.define('ConfirmationCode', {
  phoneNumber: {
    type: Sequelize.STRING,
    required: true
  },
  code: {
    type: Sequelize.STRING,
    required: true,
    unique: true
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
      let confirmation = await ConfirmationCode.findWithNumber(phoneNumber);
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
        return ConfirmationCode.create({
          code: code,
          phoneNumber: phoneNumber
        });
      }
    },

    attemptValidationWhere: async function (data) {
      let confirmation = await ConfirmationCode.findWithNumber(data.phoneNumber);

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

    findWithNumber: (phoneNumber) => ConfirmationCode.find({ where: { phoneNumber } })
  }

});

export default ConfirmationCode;
