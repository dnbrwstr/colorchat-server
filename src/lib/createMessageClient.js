import amqp from 'amqplib';
import { once, partial, merge } from 'ramda';

const REQUEUE_TIMEOUT = 5000;

let createMessageClient = async function () {
  let id = Math.random();
  let messageCallbacks = [];
  let consumers = {};
  let exchange = 'colorchat';

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

    messageCallbacks.forEach(function (cb) {
      cb(messageData, ack);
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

    subscribeToUserMessages: async function (userId) {
      let queueHandle = getQueueHandle(userId);
      await channel.assertQueue(queueHandle);
      await channel.bindQueue(queueHandle, exchange, queueHandle);
      await channel.bindQueue(queueHandle, exchange, getComposeBinding(userId));
      let consumer = await channel.consume(queueHandle, handleMessage);
      consumers[userId] = consumer.consumerTag;
    },

    unsubscribeFromUserMessages: async function (userId) {
      let queueHandle = getQueueHandle(userId);
      await channel.unbindQueue(queueHandle, exchange, getComposeBinding(userId));
      await channel.cancel(consumers[userId]);
      consumers[userId] = null;
    }
  };
};

module.exports = createMessageClient;
