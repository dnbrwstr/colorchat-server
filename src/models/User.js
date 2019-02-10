import Sequelize from "sequelize";
import crypto from "crypto";
import { pick } from "ramda";
import db from "../lib/db";
import DeviceToken from "./DeviceToken";

let User = db.define("User", {
  name: {
    type: Sequelize.STRING,
    require: false
  },
  phoneNumber: {
    type: Sequelize.STRING,
    required: true,
    unique: true
  },
  tokens: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    required: true
  },
  deviceTokens: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    defaultValue: []
  },
  unreadCount: {
    type: Sequelize.INTEGER,
    required: true,
    default: 0
  }
});

User.createOrUpdateFromConfirmation = async confirmation => {
  let tokenBuffer = await crypto.randomBytesAsync(64);
  let token = tokenBuffer.toString("hex");

  let user = await User.findOne({
    where: { phoneNumber: confirmation.phoneNumber }
  });

  if (user) {
    user = await user.update({
      tokens: user.tokens.concat([token])
    });
  } else {
    user = await User.create({
      phoneNumber: confirmation.phoneNumber,
      tokens: [token]
    });
  }

  return user;
};

User.wherePhoneNumberIn = async numbers => {
  let numberString = numbers
    .map(n => `'${n.replace(/[^\+0-9]/g, "")}'`)
    .join(", ");
  let queryString = `select * from "Users" where "phoneNumber" like any (array[${numberString}])`;
  let matches = await db.query(queryString, {
    model: User
  });

  return matches;
};

User.findByToken = async token => {
  let user = await User.findOne({
    where: {
      tokens: { $contains: [token] }
    }
  });

  return user;
};

User.prototype.addDeviceToken = async function({token, platform, deviceId}) {
  // Devices with an old version of ColorChat
  // won't set platform in request
  if (!platform) platform = "ios";

  return DeviceToken.upsert({
    platform,
    token,
    deviceId,
    UserId: this.id
  });
};

User.prototype.serialize = function() {
  return pick(["id", "name", "phoneNumber"], this.get());
};

User.hasMany(DeviceToken, { as: "pushTokens" });

export default User;
