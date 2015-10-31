var amqp = require('amqplib');

var createMessageClient = function () {
  var messageCallbacks = [];
  var readyCallbacks = [];
  var consumers = {};
  var queue = 'messages';
  var exchange = 'colorchat';
  var connection = null;
  var channel = null;

  amqp.connect().then(function (_connection) {
    connection = _connection;
    connection.createChannel().then(function (_channel) {
      channel = _channel;
      channel.assertExchange(exchange, 'direct', { durable: true, autoDelete: false });
      triggerReadyCallbacks();
    });
  });

  function triggerReadyCallbacks () {
    readyCallbacks.forEach(function (cb) {
      cb();
    });
  }

  function handleMessage (message) {
    var messageData = decodeMessage(message);
    var delivered = false;
    messageCallbacks.forEach(function (cb) {
      cb(messageData, function () {
        if (!delivered) {
          delivered = true;
          channel.ack(message);
        }
      });
    });
  }

  function encodeMessage (message) {
    return new Buffer(JSON.stringify(message));
  }

  function decodeMessage (message) {
    return JSON.parse(message.content.toString());
  }

  return {
    onReady: function (cb) {
      readyCallbacks.push(cb);
    },

    sendMessage: function (userId, message) {
      var queueHandle = 'user-' + userId;
      channel.publish(exchange, queueHandle, encodeMessage(message), { persistent: true });
    },

    onMessage: function (cb) {
      messageCallbacks.push(cb);
    },

    subscribeToUserMessages: function (userId) {
      var queueHandle = 'user-' + userId;
      channel.assertQueue(queueHandle);
      channel.bindQueue(queueHandle, exchange, queueHandle);
      channel.consume(queueHandle, handleMessage).then(function (consumer) {
        consumers[userId] = consumer.consumerTag;
      });
    },

    unsubscribeFromUserMessages: function (userId) {
      channel.cancel(consumers[userId]);
      consumers[userId] = null;
    },

    disconnect: function () {
      connection.close();
    }
  };
};

module.exports = createMessageClient;
