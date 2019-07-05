import User from '../models/User';
import { contains } from 'ramda';

const senderIsBlocked = async (senderId, recipientId) => {
  const [sender, recipient] = await Promise.all([
    User.findById(senderId),
    User.findById(recipientId)
  ]);
  const blockedUsers = recipient.blockedUsers || [];
  return contains(sender.id, blockedUsers)
};

const messageIsBlocked = (senderId, message) => 
  senderIsBlocked(senderId, message.recipientId);

const removeFiltered = messages => messages.filter(d => !!d);

const filterBlockedMessages = async (senderId, messages) => {
  const isArray = messages instanceof Array;
  if (isArray) {
    const allowedMessages = await Promise.all(messages.map(async (message) => {
      const blocked = await messageIsBlocked(senderId, message);
      return blocked ? false : message;
    }))
    return removeFiltered(allowedMessages);
  } else {
    const blocked = await messageIsBlocked(senderId, messages);
    if (!blocked) return [];
    else return messages;
  }
};

export default filterBlockedMessages;
