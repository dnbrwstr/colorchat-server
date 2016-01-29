import fetch from 'node-fetch';
import getClosestColor from './getClosestColor';
import logError from './logError';
import User from '../models/User';

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
}

export let sendChatMessageNotification = async function (message) {
  let user = await User.findById(message.recipientId);
  let text = await getText(message);
  let url = "https://api.parse.com/1/push";

  let data = JSON.stringify({
    where: {
      deviceType: "ios",
      deviceToken: {
        $in: user.deviceTokens
      }
    },
    data: {
      alert: text,
      badge: 'Increment',
      sound: 'cheering.caf',
      type: 'message',
      'content-available': '1',
      messageId: message.id,
      senderId: message.senderId,
      message
    }
  });

  fetch(url, {
    method: 'post',
    headers: {
      'X-Parse-Application-Id': process.env.PARSE_APPLICATION_ID,
      'X-Parse-REST-API-Key': process.env.PARSE_REST_API_KEY,
      'Content-Type': 'application/json'
    },
    body: data
  }).then(function (res) {
    if (res.status !== 200) {
      res.text().then(logError);
    }
  });
};
