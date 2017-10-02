import db from '../../src/lib/db';
import User from '../../src/models/User';
import DeviceToken from '../../src/models/DeviceToken';

const addPushToken = async () => {
  await db.sync();

  const users = await User.findAll();

  const updatePromises = users.map(u => {
    const tokens = u.deviceTokens.map(t => {
      return {
        platform: 'ios',
        token: t,
        UserId: u.id
      };
    });

    return DeviceToken.bulkCreate(tokens);
  });

  return Promise.all(updatePromises);
};

export default addPushToken;
