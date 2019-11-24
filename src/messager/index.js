import io from "socket.io";
import logError from "../lib/logError";
import { sendChatMessageNotification } from "../lib/NotificationUtils";
import wrap from "../lib/wrapSocketMiddleware";
import authenticate from "../lib/authenticateSocket";
import {
  processChatMessageData,
  logChatMessage,
  processComposeMessageData
} from "../lib/MessageUtils";
import createMessageClient from "../lib/createMessageClient";
import rateLimit from "../lib/rateLimit";
import { ap, partial, always, set, _, lensProp, merge, includes } from "ramda";
import filterBlockedMessages from "../lib/filterBlockedMessages";

const makeArray = o => (o instanceof Array ? o : [o]);

const handleError = function(socket, next) {
  socket.on("error", logError);
  next();
};

const createMessageApp = async function() {
  const userSockets = {};
  let messageClient;

  // Socket management

  const addUserSocket = async function(user, socket) {
    userSockets[user.id] = socket;
    await messageClient.subscribeToUserMessages(user.id);
  };

  const removeUserSocket = function(user) {
    // Since user can no longer receive messages at the point
    // this is called, we don't wait for the unsubscribe to complete
    // before deleting their mailbox. Anything that arrives during
    // unsubscribe will get nack'd.
    messageClient.unsubscribeFromUserMessages(user.id);
    delete userSockets[user.id];
  };

  // Handle messages from socket

  const handleComposeEventReceived = async function(user, data, cb) {
    const composeEvents = makeArray(data)
      .map(processComposeMessageData)
      .map(set(lensProp("senderId"), user.id));

    cb && cb(data);

    const allowedComposeEvents = await filterBlockedMessages(
      user.id,
      composeEvents
    );

    allowedComposeEvents.forEach(message => {
      sendComposeEvent(message.recipientId, message);
    });
  };

  const handleMessageReceived = async function(user, data, cb) {
    const messages = makeArray(data)
      .map(processChatMessageData)
      .map(set(lensProp("senderAvatar"), user.avatar))
      .map(set(lensProp("senderName"), user.name))
      .map(set(lensProp("senderId"), user.id));

    cb && cb(messages);

    const allowedMessages = await filterBlockedMessages(user.id, messages);

    allowedMessages.forEach(async message => {
      sendChatMessageNotification(message);
      logChatMessage(message);
      sendMessage("messagedata", message.recipientId, message);
    });
  };

  const sendComposeEvent = (recipientId, data) =>
    sendMessage("composeevent", recipientId, data, {
      expiration: 500,
      persistent: false
    });

  const sendMessage = function(type, recipientId, data, options) {
    messageClient.sendMessage(
      recipientId,
      {
        type,
        content: data
      },
      options
    );
  };

  // Handle messages from queue

  let handleMessageDelivered = function(message, ack, nack) {
    let socket = userSockets[message.content.recipientId];

    if (socket) {
      socket.emit(message.type, message.content, ack);
    } else {
      console.log(
        `Socket delivery failed. User: ${
          message.content.recipientId
        }, Message: ${message.content.id}. Requeuing...`
      );
      nack(message);
    }
  };

  // Application setup

  const handleConnection = async function(socket, next) {
    const user = socket.user;
    socket.on("messagedata", rateLimit(partial(handleMessageReceived, [user])));
    socket.on("composeevent", partial(handleComposeEventReceived, [user]));
    socket.on("disconnect", partial(removeUserSocket, [user]));
    await addUserSocket(user, socket);
    socket.emit("ready");
  };

  messageClient = await createMessageClient();
  messageClient.onMessage(handleMessageDelivered);

  const app = io({
    maxHttpBufferSize: 10000
  });
  app.use(handleError);
  app.use(wrap(authenticate));
  app.on("connection", wrap(handleConnection));
  return app;
};

export default createMessageApp;
