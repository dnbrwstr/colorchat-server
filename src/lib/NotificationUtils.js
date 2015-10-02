import fetch from 'node-fetch';
import getClosestColor from './getClosestColor';
import logError from './logError';
import User from '../models/User';

export let getText = function (message) {
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

  let text = 'A '
  if (sizeDescriptor) text += sizeDescriptor + ', '
  text += color + ' ';
  text += shape;

  return text;
}

export let sendMessageNotification = async function (message) {
  let user = await User.findById(message.recipientId);
  let url = "https://api.parse.com/1/push";

  let data = JSON.stringify({
    where: {
      deviceType: "ios",
      deviceToken: {
        $in: user.deviceTokens
      }
    },
    data: {
      alert: getText(message),
      badge: 'increment',
      sound: 'cheering.caf',
      type: 'message',
      messageId: message.id,
      senderId: message.senderId
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
