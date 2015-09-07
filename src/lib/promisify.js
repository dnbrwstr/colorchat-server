import Promise from 'bluebird';
import crypto from 'crypto';
import redis from 'redis';

Promise.promisifyAll(crypto);
Promise.promisifyAll(redis);
