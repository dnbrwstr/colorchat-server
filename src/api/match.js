import express from 'express';
import wrapAsyncRoute from '../lib/wrapAsyncRoute';
import authenticate from '../lib/authenticate';
import User from '../models/User';
import { normalize } from '../lib/PhoneNumberUtils';

let app = express();

let processNumbers = (numbers, baseNumber) => {
  let numberData = numbers.reduce((memo, n, i) => {
    if (n instanceof Array) {
      memo.numbers = memo.numbers.concat(n);
      n.forEach(o => memo.numberMap[o] = i);
    } else {
      memo.numbers = memo.numbers.concat([n]);
      memo.numberMap[n] = i;
    }
    return memo;
  }, {
    numbers: [],
    numberMap: {}
  });
  numberData.numbers = numberData.numbers.filter(n => !!n);
  return numberData;
};

app.post('/', [authenticate], wrapAsyncRoute(async (req, res, next) => {
  let { numbers, numberMap } = processNumbers(normalize(req.body.phoneNumbers, req.user.phoneNumber));
  let matches = await User.wherePhoneNumberIn(numbers);

  let results = matches.map(m => ({
    index: numberMap[m.phoneNumber],
    userId: m.id
  }));

  res.json(results);
}));

export default app;
