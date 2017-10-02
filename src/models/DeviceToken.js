import Sequelize from 'sequelize';
import crypto from 'crypto';
import db from '../lib/db';
import { createNotificationBinding } from '../lib/NotificationUtils';

let DeviceToken = db.define('DeviceToken', {
  platform: {
    type: Sequelize.STRING,
    require: true
  },
  token: {
    type: Sequelize.STRING,
    require: true
  }
});

export default DeviceToken;
