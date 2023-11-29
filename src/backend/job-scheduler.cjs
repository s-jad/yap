const scheduler = require('node-schedule');
const { logger } = require('./logging.cjs');
const { redisChatroomClient, logRedisInfo } = require('./redis-client.cjs');
const { tribesMac } = require('./tribes_mac.cjs');

function backupChatMessages() {
  logRedisInfo("redisChatroomClient", redisChatroomClient);
  return scheduler.scheduleJob('*/30 * * * *', async function() {
    const msgKeys = await redisChatroomClient.keys('*');
    const backupCheck = [];

    for (let msgKey of msgKeys) {
      try {
        const msgData = await redisChatroomClient.get(msgKey);
        console.log("msgData => ", msgData);
        try {
          const parsedData = JSON.parse(msgData);

          try {
            const result = await tribesMac('backup-chatroom-messages', parsedData);
            backupCheck.push({result: result, msgKey});
            console.log("Somehow succesfully backed up chat messages");
          } catch (error) {
            logger.error("Error 400: ", error);
            backupCheck.push({result: false, msgKey});
          }
        } catch (error) {
          logger.error("Error 401: ", error);
          backupCheck.push({result: false, msgKey});
        }
      }
      catch (error) {
        logger.error("Error 402 ", error);
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
