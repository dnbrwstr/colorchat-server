import amqp from 'amqplib';
import { once, partial } from 'ramda';

let createMessageClient = async function () {
  let id = Math.random();
  let messageCallbacks = [];
  let consumers = {};
  let exchange = 'colorchat';

  let connection = await amqp.connect();
  let channel = await connection.createChannel();

  await channel.assertExchange(
    exchange,
    'direct',
    { durable: true, autoDelete: false }
  );

  function handleMessage (message) {
    let ack = once(partial(channel.ack.bind(channel), message));
    let messageData = decodeMessage(message);

    messageCallbacks.forEach(function (cb) {
      cb(messageData, ack);
    });
  }

  let getQueueHandle = userId => `user-${userId}`;

  function encodeMessage (message) {
    return new Buffer(JSON.stringify(message));
  }

  function decodeMessage (message) {
    return JSON.parse(message.content.toString());
  }

  return {
    sendMessage: async function (userId, message) {
      await channel.publish(
        exchange,
        getQueueHandle(userId),
        encodeMessage(message),
        { persistent: true }
      );
    },

    onMessage: function (cb) {
      messageCallbacks.push(cb);
    },

    subscribeToUserMessages: async function (userId) {
      let queueHandle = getQueueHandle(userId);
      await channel.assertQueue(queueHandle);
      await channel.bindQueue(queueHandle, exchange, queueHandle);
      let consumer = await channel.consume(queueHandle, handleMessage);
      consumers[userId] = consumer.consumerTag;
    },

    unsubscribeFromUserMessages: async function (userId) {
      await channel.cancel(consumers[userId]);
      consumers[userId] = null;
    }
  };
};

module.exports = createMessageClient;
