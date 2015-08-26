import Sequelize from 'sequelize';
import crypto from 'crypto';
import sequelize from '../lib/sequelize';

var User = sequelize.define('User', {
  phoneNumber: {
    type: Sequelize.STRING,
    required: true,
    unique: true
  },
  tokens: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    required: true
  }
}, {
  classMethods: {
    createOrUpdateFromConfirmation: async confirmation => {
      let tokenBuffer = await crypto.randomBytesAsync(64)
      let token = tokenBuffer.toString('hex');

      let user = await User.find({ where: { phoneNumber: confirmation.phoneNumber } });

      if (user) {
        user = await user.update({
          tokens: user.tokens.concat([token])
        });
      } else {
        user = await User.create({
          phoneNumber: confirmation.phoneNumber,
          tokens: [token]
        });
      }

      return user;
    },

    wherePhoneNumberIn: async numbers => {
      let numberString = numbers.map(n => `'${n.replace(/[^\+0-9]/g, '')}'`).join(', ');
      let queryString = `select * from "Users" where "phoneNumber" like any (array[${numberString}])`;
      let matches = await sequelize.query(queryString, {
        model: User
      });

      return matches;
    },

    findByToken: async token => {
      let user = await User.find({  where: {
        tokens: { $contains: [token] }
      } });

      return user;
    }
  }
});

module.exports = User;
