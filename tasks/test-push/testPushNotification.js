import minimist from 'minimist';
import { sendChatMessageNotification } from '../src/lib/NotificationUtils';

const args = require('minimist')(process.argv.slice(2));

export let generateId = () =>
  Math.floor(Math.random() * Math.pow(10, 10)).toString(16);

export let rand = max => Math.floor(Math.random() * max);

export let getTimestamp = message =>
  message.createdAt || message.clientTimestamp;

const testPushNotification = () => {
  const toUserId = parseInt(args.to);
  const fromUserId = parseInt(args.from);

  const message = {
    id: generateId(),
    senderId: fromUserId,
    recipientId: toUserId,
    width: 75 + Math.floor(Math.random() * 200),
    height: 75 + Math.floor(Math.random() * 300),
    color: '#' + ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6)
  };

  return sendChatMessageNotification(message);
};

export default testPushNotification;
