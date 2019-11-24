import { merge, pick } from 'ramda';
import chalk from 'chalk';
import uuid from 'uuid';
import getClosestColor from './getClosestColor';

export const processChatMessageData = messageData => {
  const allowedKeys = [
    'id',
    'senderId',
    'recipientId',
    'color',
    'createdAt',
    'width',
    'height',
    'colorName',
    'relativeWidth',
    'relativeHeight',
    'type',
    'echoType'
  ];

  return pick(allowedKeys, merge(messageData, {
    id: uuid.v4(),
    createdAt: new Date(),
    colorName: getClosestColor(messageData.color)
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
