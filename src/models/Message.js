import Sequelize from 'sequelize';
import db from '../lib/db';

let Message = db.define('Message', {
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
