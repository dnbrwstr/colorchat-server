import { merge, pick } from 'ramda';
import uuid from 'uuid';

export let processMessageData = messageData => {
  let allowedKeys = [
    'id',
    'senderId',
    'recipientId',
    'color',
    'createdAt',
    'width',
    'height'
  ];
  let id = uuid.v4();

  return pick(allowedKeys, merge(messageData, {
    id,
    createdAt: new Date()
  }));
};
