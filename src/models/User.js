import Sequelize from 'sequelize';
import crypto from 'crypto';
import { pick } from 'ramda';
import db from '../lib/db';
import DeviceToken from './DeviceToken';

let User = db.define('User', {
  name: {
    type: Sequelize.STRING,
    require: false
  },
  phoneNumber: {
    type: Sequelize.STRING,
    required: true,
    unique: true
  },
  tokens: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    required: true
  },
  deviceTokens: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    defaultValue: []
  },
  unreadCount: {
    type: Sequelize.INTEGER,
    required: true,
    default: 0
  }
}, {
  classMethods: {
    createOrUpdateFromConfirmation: async confirmation => {
      let tokenBuffer = await crypto.randomBytesAsync(64);
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
      let matches = await db.query(queryString, {
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
  },
  instanceMethods: {
    addDeviceToken: async function (token, platform) {
      let type;

      const existingToken = await DeviceToken.find({ where: { token } });
      if (existingToken) return;

      return DeviceToken.create({
        token,
        platform,
        UserId: this.id
      });
    },
    serialize: function () {
      return pick(['id', 'name', 'phoneNumber'], this.get());
    }
  }
});

User.hasMany(DeviceToken, { as: 'pushTokens' });

export default User;
