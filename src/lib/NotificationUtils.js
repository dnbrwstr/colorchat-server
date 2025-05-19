import * as admin from 'firebase-admin';
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
  let user = await User.findByPk(message.senderId);
  let sizeDescriptor, shape;
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

  const item = [
    sizeDescriptor && sizeDescriptor + ',',
    message.colorName,
    shape
  ].filter(i => !!i).join(' ');

  if (message.type === 'picture') {
    return `${user.name} captured a ${item} for you`
  } else if (message.type === 'echo') {
    if (message.echoType === 'partner') {
      return `${user.name} echoed your ${item}`
    } else {
      return `${user.name} echoed a ${item}`
    }
  } else {
    return `${user.name} sent you a ${item}`;
  }
};

export let sendChatMessageNotification = async function (message) {
  if (!notificationsEnabled) return;

  let user = await User.findByPk(message.recipientId);
  let newUnreadCount = user.unreadCount + 1;
  let text = await getText(message);

  let tokens = await DeviceToken
    .findAll({ where: { UserId: user.id }});

  const tokenPromises = tokens.map(async t => {
    let payload = {
      token: t.token,
      notification: {
        body: text,
      },
      data: {
        type: 'message',
        message: JSON.stringify(message)
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            badge: newUnreadCount,
            sound: 'cheering.caf',
          }
        }
      },
      android: {
        notification: {
          color: message.color,
          icon: 'ic_notification',
          sound: 'cheering.caf',
        }
      }
    };

    try {
      await admin.messaging().send(payload);
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
