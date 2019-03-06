import { merge, pick } from 'ramda';
import chalk from 'chalk';
import uuid from 'uuid';

export const processChatMessageData = messageData => {
  const allowedKeys = [
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

export const processComposeMessageData = messageData => {
  const allowedKeys = [
    'recipientId'
  ];

  return pick(allowedKeys, messageData);
};

export const logChatMessage = message => {
  console.log(chalk.blue('Message:', getMessageString(message)));
};

export const getMessageString = message => {
  const { senderId, recipientId } = message;
  return `${senderId} => ${recipientId}`;
};
