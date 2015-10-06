import Sequelize from 'sequelize';
import db from '../lib/db';
import { PermissionsError } from '../lib/errors';
import { normalize } from '../lib/PhoneNumberUtils';

let MAX_CODES_CREATED = 20;
let MAX_CONFIRMATION_ATTEMPTS = 6;

let generateCode = () => {
  let code = Math.floor(Math.random() * 999999).toString();
  while (code.length < 6) {
    code = `0${code}`;
  }
  return code;
};

let ConfirmationCode = db.define('ConfirmationCode', {
  phoneNumber: {
    type: Sequelize.STRING,
    required: true,
    unique: true
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
  }
}, {
  classMethods: {
    createOrUpdateFromNumber: async function (phoneNumber) {
      let confirmation = await ConfirmationCode.findWithNumber(phoneNumber);
      let code = generateCode();

      if (!confirmation) {
        return ConfirmationCode.create({
          code: code,
          phoneNumber: phoneNumber
        });
      }

      await confirmation.increment('codesCreated');
      await confirmation.reload();

      if (confirmation.codesCreated >= MAX_CODES_CREATED) {
        throw new PermissionsError('You have created the maximum number of confirmation codes');
      } else {
        // Assume that this is a new device
        // or install and reset the code
        await confirmation.update({
          code: code,
          attempts: 0
        });

        return confirmation;
      }
    },

    attemptValidationWhere: async function (data) {
      let confirmation = await ConfirmationCode.findWithNumber(data.phoneNumber);

      if (!confirmation) {
        throw new PermissionsError('No matching confirmation found');
      }

      await confirmation.increment('attempts');
      await confirmation.reload();

      if (confirmation.attempts >= MAX_CONFIRMATION_ATTEMPTS) {
        throw new PermissionsError('Too many confirmation attempts');
      } else if (confirmation.code !== data.code) {
        throw new PermissionsError('Invalid code');
      } else {
        return confirmation;
      }
    },

    findWithNumber: (phoneNumber) => ConfirmationCode.find({ where: { phoneNumber } })
  }

});

export default ConfirmationCode;
