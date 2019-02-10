import fetch from 'node-fetch';
import * as admin from 'firebase-admin';
import getClosestColor from './getClosestColor';
import logError from './logError';
import User from '../models/User';
import DeviceToken from '../models/DeviceToken';

const notificationsEnabled = 
  process.env.NOTIFICATIONS_ENABLED === "1" &&
  process.env.FIREBASE_SERVICE_ACCOUNT_FILE;

if (notificationsEnabled) {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_FILE);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
  });
}

export let getText = async function (message) {
  let user = await User.findById(message.senderId);
  let sizeDescriptor, shape;
  let color = getClosestColor(message.color);
  let w = message.width;
  let h = message.height;

  if (w > h) {
    shape = 'rectangle';
    sizeDescriptor = 'wide';
  } else if (h > w) {
    shape = 'rectangle';
    sizeDescriptor = 'tall';
  } else {
    shape = 'square';
  }

  return [
    user.name,
    'sent you a',
    sizeDescriptor && sizeDescriptor + ',',
    color,
    shape
  ].filter(i => !!i).join(' ');
};

export let sendChatMessageNotification = async function (message) {
  if (!notificationsEnabled) return;
  
  let user = await User.findById(message.recipientId);
  let newUnreadCount = user.unreadCount + 1;
  let text = await getText(message);
  
  let tokens = await DeviceToken
    .findAll({ where: { UserId: user.id }});

  const tokenPromises = tokens.map(async t => {
    let payload = {
      notification: {
        badge: newUnreadCount.toString(),
        sound: 'cheering.caf',
        color: message.color,
        icon: 'ic_notification'
      },
      data: {
        type: 'message',
        message: JSON.stringify(message)
      }
    };

    let options = {
      contentAvailable: true
    };  

    if (t.platform === 'ios') {
      payload.notification.body = text;
    } else {
      payload.notification.text = text;
    }

    try {
      let result = await admin.messaging().sendToDevice(t.token, payload, options); 
      let allResults = result.results;
      allResults.forEach(r => r.error && logError(r.error));
    } catch (error) {
      logError(error);
    }
  });

  await Promise.all(tokenPromises);

  try {
    await user.update({
      unreadCount: newUnreadCount
    });
  } catch (error) {
    logError(error);
  }
};
