import amqp from 'amqplib';
import { once, partial, merge } from 'ramda';
import UserActionQueue from './UserActionQueue';

const REQUEUE_TIMEOUT = 5000;

let createMessageClient = async function () {
  let id = Math.random();
  let messageCallbacks = [];
  let consumers = {};
  let exchange = 'colorchat';
  let queue = new UserActionQueue();

  let connection = await amqp.connect(process.env.RABBITMQ_URL);
  let channel = await connection.createChannel();

  await channel.assertExchange(
    exchange,
    'direct',
    { durable: true, autoDelete: false }
  );

  function handleMessage (message) {
    let messageData = decodeMessage(message);

    let requeueTimeout = setTimeout(() => {
      channel.nack(message);
    }, REQUEUE_TIMEOUT);

    let ack = once(() => {
      clearTimeout(requeueTimeout);
      channel.ack(message);
    });

    let nack = once(() => {
      clearTimeout(requeueTimeout);
      channel.nack(message);
    });

    messageCallbacks.forEach(function (cb) {
      cb(messageData, ack, nack);
    });
  }

  let getQueueHandle = userId => `user-${userId}`;
  let getComposeBinding = userId => getQueueHandle(userId) + '-compose';

  function encodeMessage (message) {
    return new Buffer(JSON.stringify(message));
  }

  function decodeMessage (message) {
    return JSON.parse(message.content.toString());
  }

  return {
    sendMessage: async function (userId, message, opts) {
      let options = merge({
        persistent: true
      }, opts);

      let patternFn = message.type === 'composeevent' ?
        getComposeBinding : getQueueHandle;

      await channel.publish(
        exchange,
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
        console.log('enqueue subscribe', userId);
        queue.enqueueAction(userId, async () => {
          console.log('start subscribe', userId);

          if (consumers[userId]) {
            console.log('bailing on subscribe', userId)
            return;
          }

          let queueHandle = getQueueHandle(userId);
          await channel.assertQueue(queueHandle);
          await channel.bindQueue(queueHandle, exchange, queueHandle);
          await channel.bindQueue(queueHandle, exchange, getComposeBinding(userId));
          let consumer = await channel.consume(queueHandle, handleMessage);
          consumers[userId] = consumer.consumerTag;
          console.log('finish subscribe', userId)
          resolve();
        })
      });
    },

    unsubscribeFromUserMessages: function (userId) {
      return new Promise((resolve, reject) => {
        console.log('enqueue unsubscribe', userId)
        queue.enqueueAction(userId, async () => {
          console.log('start unsubscribe', userId);
          if (!consumers[userId]) {
            console.log('bailing on unsubscribe', userId)
            return;
          }
          let queueHandle = getQueueHandle(userId);
          await channel.cancel(consumers[userId]);
          // Compose events are only relevant to the user while
          // they're active in app.
          await channel.unbindQueue(queueHandle, exchange, getComposeBinding(userId));
          consumers[userId] = null;
          console.log('finish unsubscribe', userId)
          resolve();
        });
      });
    }
  };
};

module.exports = createMessageClient;
