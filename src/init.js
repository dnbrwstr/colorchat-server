import db from './lib/db';
import createServer from './lib/createServer';
import logError from './lib/logError';

(async () => {
  try {
    await db.sync();
    await createServer(process.env.PORT);
  } catch (e) {
    console.log('Unable to start Color Chat');
    logError(e);
    process.exit();
  }
})();
