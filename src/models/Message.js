let Sequelize = require('sequelize'),
  sequelize = require('../lib/Sequelize');

let Message = sequelize.define('Message', {
  senderId: {
    type: Sequelize.INTEGER,
    required: true
  },
  recipientId: {
    type: Sequelize.INTEGER,
    required: true
  },
  color: {
    type: Sequelize.STRING,
    required: true
  }
}, {
  classMethods: {
    findAllByRecipientId: (userId) =>
      Message.findAll({ where: { recipientId: userId } })
  }
});

export default Message;
