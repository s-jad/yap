const scheduler = require('node-schedule');
const { logger } = require('./logging.cjs');
const { tribesMac } = require('./tribes_mac.cjs');

function backupChatMessages(redis) {
  return scheduler.scheduleJob('*/30 * * * *', async function() {
    const msgKeys = await redis.keys('*');
    const backupCheck = [];

    for (let msgKey of msgKeys) {
      const msgData = await redis.get(msgKey);
      try {
        const parsedData = JSON.parse(msgData);
        
          try {
            const result = await tribesMac('backup-chatroom-messages', parsedData);
            backupCheck.push({result: result, msgKey});
          } catch (error) {
            logger.error(error);
            backupCheck.push({result: false, msgKey});
          }
      } catch (error) {
        logger.error(error);
        backupCheck.push({result: false, msgKey});
      }
    }

    if (backupCheck.some((result) => result === false)) {
      logger.error("failed to backup redis store to pg db");
    } else {
      await redis.flushDb();
    }
  });
}
module.exports = {
  backupChatMessages,
};
