import Sequelize from 'sequelize';
import db from '../lib/db';

let DeviceToken = db.define('DeviceToken', {
  platform: {
    type: Sequelize.STRING,
    require: true,
  },
  token: {
    type: Sequelize.STRING,
    require: true,
    unique: true
  },
  deviceId: {
    type: Sequelize.STRING,
    require: true,
    unique: true
  }
});

export default DeviceToken;
