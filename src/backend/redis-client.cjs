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
        logger.error("Error 300: ", error);
      }
    }
  }
}

async function updateTribeCache() {
  logger.info('redisGeneralClient => updating tribes cache');
  const tribes = await tribesMac('get-tribes');
  
  try {
    redisGeneralClient.del('tribes');
    for (const tribe of tribes) {
      const tribeString = JSON.stringify(tribe);
      try {
        await redisGeneralClient.lPush('tribes', tribeString);
      } catch (error) {
        logger.error("Error 301: ", error);
      }
    }
  } catch (error) {
    logger.error("Error 302: ", error)
  }
}


async function addMemberToTribeCache(tribe, memberData) {
  console.log('redisGeneralClient::adding ', memberData, ' to ', tribe);
  
  try {
    const memberString = JSON.stringify(memberData);
    try {
      await redisGeneralClient.lPush(`${tribe}-active`, memberString)
    } catch (error) {
      logger.error("Error 303: ", error);
    }
  } catch (error) {
    logger.error("Error 304: ", error)
  }
}

async function removeMemberFromTribeCache(tribe, memberData) {
  console.log('redisGeneralClient::removing ', memberData, ' from ', tribe);
  
  try {
    const memberString = JSON.stringify(memberData);
    try {
      await redisGeneralClient.lRem(`${tribe}-active`, 1, memberString)
    } catch (error) {
      logger.error("Error 305: ", error);
    }
  } catch (error) {
    logger.error("Error 306: ", error)
  }
}

async function getCachedActiveMembers(tribe) {
  const exists = await redisGeneralClient.exists(`${tribe}-active`);

  if (exists === 1) {
    try {
      const activeMembers = await redisGeneralClient.lRange(`${tribe}-active`, 0, -1);
      try {
        const memberArr = [];
        for (const member of activeMembers) {
          const memberJson = JSON.parse(member);
          memberArr.push(memberJson)
        }
        console.log('getCachedActiveMembers::memberArr => ', memberArr);
        return memberArr;
      } catch (error) {
        logger.error("Error 307: ", error);
      }
    } catch (error) {
      logger.error("Error 308: ", error);
    }
  } else {
    logger.info(`The list ${tribe}-active doesnt currently exist`);
  } 
}

setTimeout(() => {
  cacheTribes();
}, 2000);

module.exports = {
  redisChatroomClient,
  redisGeneralClient,
  updateTribeCache,
  addMemberToTribeCache,
  removeMemberFromTribeCache,
  getCachedActiveMembers,
};
