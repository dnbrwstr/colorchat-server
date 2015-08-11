var Sequelize = require('sequelize'),
  crypto = require('crypto'),
  sequelize = require('../lib/sequelize');

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
    createFromConfirmation: async (confirmation) => {
      let tokenBuffer = await crypto.randomBytesAsync(64)
      let token = tokenBuffer.toString('hex');
      let user = await User.create({
        number: confirmation.number,
        tokens: [token]
      });

      return user;
    }
  }
});

module.exports = User;
