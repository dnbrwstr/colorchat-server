import redis from 'redis';

let getMessageEvent = userId => `user:${userId}:message`;
let getQueueKey = userId => `user:${userId}:messages`;

let createRedisClient = function () {
  let client = redis.createClient(process.env.REDIS_URL);
  let subscriptionClient = redis.createClient(process.env.REDIS_URL);
  let deliveryHandler;

  subscriptionClient.on('message', function (channel, userId) {
    methods.deliverPendingMessages(userId);
  });

  let methods = {
    onUserConnect: function (userId) {
      subscriptionClient.subscribe(getMessageEvent(userId));
      this.deliverPendingMessages(userId);
    },

    onUserDisconnect: userId =>
      subscriptionClient.unsubscribe(getMessageEvent(userId)),

    sendMessages: async messageData => {
      // Assuming we're grouping batched messages by
      // recipient on the client
      let userId = messageData[0].recipientId;
      let messageStrings = messageData.map(JSON.stringify);
      let multi = client.multi()

      return multi.lpush.apply(multi, [getQueueKey(userId)].concat(messageStrings))
        .publish(getMessageEvent(userId), userId)
        .execAsync();
    },

    deliverPendingMessages: async function (userId) {
      let messages = await this.getPendingMessages(userId);

      let onDeliverySuccess = function () {
        let multi = client.multi();
        messages.forEach(m => multi.lrem(m));
        multi.exec();
      };

      deliveryHandler(userId, messages, onDeliverySuccess);
    },

    getPendingMessages: async function (userId) {
      let messageStrings = await client.lrangeAsync(getQueueKey(userId), 0, -1);
      return messageStrings.map(JSON.parse);
    },

    setDeliveryHandler: function (fn) {
      deliveryHandler = fn;
    }
  };

  return methods;
}

export default createRedisClient;