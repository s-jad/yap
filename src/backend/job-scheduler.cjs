const scheduler = require('node-schedule');
const { logger } = require('./logging.cjs');
const { tribesMac } = require('./tribes_mac.cjs');

function backupChatMessages(redisChatroomClient) {
  return scheduler.scheduleJob('*/30 * * * *', async function() {
    const msgKeys = await redisChatroomClient.keys('*');
    const backupCheck = [];

    for (let msgKey of msgKeys) {
      const msgData = await redisChatroomClient.get(msgKey);
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
      logger.error("failed to backup redisChatroomClient store to pg db");
    } else {
      await redisChatroomClient.flushDb();
    }
  });
}
module.exports = {
  backupChatMessages,
};
