import Sequelize from 'sequelize';
import crypto from 'crypto';
import sequelize from '../lib/sequelize';

var User = sequelize.define('User', {
  number: {
    type: Sequelize.STRING,
    required: true
  },
  tokens: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    required: true
  }
}, {
  classMethods: {
    createFromConfirmation: async confirmation => {
      let tokenBuffer = await crypto.randomBytesAsync(64)
      let token = tokenBuffer.toString('hex');
      let user = await User.create({
        number: confirmation.number,
        tokens: [token]
      });

      return user;
    },

    whereNumberIn: async numbers => {
      let numberString = numbers.map(n => `'${n.replace(/[^\+0-9]/g, '')}'`).join(', ');
      let queryString = `select * from "Users" where number like any (array[${numberString}])`;
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
