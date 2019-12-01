import SeedNumbers from '../data/SeedNumbers';
import db from '../../src/lib/db';
import User from '../../src/models/User';
import { normalize } from '../../src/lib/PhoneNumberUtils'

const seed = async () => {
  await db.sync({
    force: true
  });

  const userData = SeedNumbers.slice(0, 10).map(n => ({
    phoneNumber: normalize(n),
    tokens: [normalize(n)]
  }));

  await User.bulkCreate(userData);

  db.close();
}

export default seed;
