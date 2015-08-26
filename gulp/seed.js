import SeedNumbers from './data/SeedNumbers';
import sequelize from '../src/lib/sequelize';
import User from '../src/models/User';
import { normalize } from '../src/lib/PhoneNumberUtils'

let seed = async () => {
  await sequelize.sync({
    force: true
  });

  let userData = SeedNumbers.slice(0, 10).map(n => ({
    phoneNumber: normalize(n),
    tokens: [normalize(n)]
  }));

  await User.bulkCreate(userData);

  sequelize.close();
}

export default seed