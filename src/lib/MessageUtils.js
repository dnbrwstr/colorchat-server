import { merge, pick } from 'ramda';
import chalk from 'chalk';
import uuid from 'uuid';

export let processChatMessageData = messageData => {
  let allowedKeys = [
    'id',
    'senderId',
    'recipientId',
    'color',
    'createdAt',
    'width',
    'height'
  ];

  return pick(allowedKeys, merge(messageData, {
    id: uuid.v4(),
    createdAt: new Date()
  }));
};

export let logChatMessage = message => {
  let { senderId, recipientId } = message;
  console.log(chalk.blue('Message:', senderId, '=>', recipientId));
}
