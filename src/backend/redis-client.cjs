const Redis = require('redis');
const { logger } = require('./logging.cjs');
const { tribesMac } = require('./tribes_mac.cjs');

const redisChatroomClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_CHATROOM_PORT,
});


const redisGeneralClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_GENERAL_PORT,
});

redisChatroomClient.connect();
redisGeneralClient.connect();

async function cacheTribes() {
  logger.info('redisGeneralClient => preloading tribes');

  const exists = await redisGeneralClient.exists('tribes');

  if (exists === 1) {
    logger.info('redisGeneralClient => tribes list already exists')
    return;
  } else {
    logger.info('redisGeneralClient => creating tribes list');
    const tribes = await tribesMac('get-tribes');
    
    for (const tribe of tribes) {
      const tribeString = JSON.stringify(tribe);
      try {
        await redisGeneralClient.lPush('tribes', tribeString);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

setTimeout(() => {
  cacheTribes();
}, 2000);

module.exports = {
  redisChatroomClient,
  redisGeneralClient,
};
