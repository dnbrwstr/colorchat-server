import amqp from 'amqplib';
import { once, merge } from 'ramda';
import UserActionQueue from './UserActionQueue';
import chalk from 'chalk';
import { getMessageString } from './MessageUtils';

const EXCHANGE_NAME = 'colorchat';
const REQUEUE_TIMEOUT = 5000;

const getQueueHandle = userId => `user-${userId}`;
const getComposeQueueHandle = userId => getQueueHandle(userId) + '-compose';

const encodeMessage = (message) =>  new Buffer(JSON.stringify(message));
const decodeMessage = (message) => JSON.parse(message.content.toString());

let createMessageClient = async function () {
  let messageCallbacks = [];
  let consumers = {};
  let queue = new UserActionQueue();

  let connection = await amqp.connect(process.env.RABBITMQ_URL);
  let channel = await connection.createChannel();

  await channel.assertExchange(
    EXCHANGE_NAME,
    'direct',
    { durable: true, autoDelete: false }
  );

  function handleMessage (message) {
    const messageData = decodeMessage(message);
    const respond = once(responder => responder());

    const nack = () => respond(() => {
      console.log(chalk.red('NACK', getMessageString(messageData.content)));
      channel.nack(message);
    });

    const ack = () => respond(() => {
      console.log(chalk.green('ACK', getMessageString(messageData.content)));
      channel.ack(message);
    });

    // Requeue message if it's not ACKed 
    setTimeout(nack, REQUEUE_TIMEOUT);

    messageCallbacks.forEach(function (cb) {
      cb(messageData, ack, nack);
    });
  }

  return {
    sendMessage: async function (userId, message, opts) {
      let options = merge({
        persistent: true
      }, opts);

      let patternFn = message.type === 'composeevent' ?
        getComposeQueueHandle : getQueueHandle;

      await channel.publish(
        EXCHANGE_NAME,
        patternFn(userId),
        encodeMessage(message),
        options
      );
    },

    onMessage: function (cb) {
      messageCallbacks.push(cb);
    },

    subscribeToUserMessages: function (userId) {
      return new Promise((resolve, reject) => {
        queue.enqueueAction(userId, async () => {
          if (consumers[userId]) {
            resolve();
            return;
          }

          let queueHandle = getQueueHandle(userId);
          await channel.assertQueue(queueHandle);
          await channel.bindQueue(queueHandle, EXCHANGE_NAME, queueHandle);
          await channel.bindQueue(queueHandle, EXCHANGE_NAME, getComposeQueueHandle(userId));
          let consumer = await channel.consume(queueHandle, handleMessage);
          consumers[userId] = consumer.consumerTag;
          console.log('subscribed', userId)
          resolve();
        })
      });
    },

    unsubscribeFromUserMessages: function (userId) {
      return new Promise((resolve, reject) => {
        queue.enqueueAction(userId, async () => {
          if (!consumers[userId]) {
            return;
          }
          let queueHandle = getQueueHandle(userId);
          await channel.cancel(consumers[userId]);
          // Compose events are only relevant to the user while
          // they're active in app.
          await channel.unbindQueue(queueHandle, EXCHANGE_NAME, getComposeQueueHandle(userId));
          consumers[userId] = null;
          console.log('unsubscribed', userId)
          resolve();
        });
      });
    }
  };
};

module.exports = createMessageClient;
