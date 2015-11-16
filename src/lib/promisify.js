import Promise from 'bluebird';
import crypto from 'crypto';

Promise.promisifyAll(crypto);
