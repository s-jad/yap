const Redis = require('redis');
const { logger } = require('./logging.cjs');
const { tribesMac } = require('./tribes_mac.cjs');

const chatPort = process.env.REDIS_CHATROOM_PORT;
const generalPort = process.env.REDIS_GENERAL_PORT;
const host = process.env.DEV_HOST;

const redisChatroomClient = new Redis.createClient({ url: `redis://${host}:${chatPort}` });
const redisGeneralClient = new Redis.createClient({ url: `redis://${host}:${generalPort}` });

async function connectClients() {
  try {
    await redisChatroomClient.connect();
    await redisGeneralClient.connect();

    redisChatroomClient.on('connect', function() {
      console.log('Connected to Redis chatroom server');
      console.log("redisChatroomClient::address => ", redisChatroomClient.address);
    });

    redisGeneralClient.on('connect', function() {
      console.log('Connected to Redis general server');
      console.log("redisGeneralClient::address => ", redisGeneralClient.address);
    });
  } catch (error) {
    console.log("ERROR connecting to redis servers => ", error);
  }
}

connectClients();

async function cacheTribes() {
  logger.info('redisGeneralClient => preloading tribes');
  
  // logRedisInfo("redisGeneralClient", redisGeneralClient);
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

// FOR DEBUGGING
async function logRedisInfo(clientName, client) {
  const info = await client.info();
  const infoParts = info.split('#');
  const tcpInfo = infoParts[1];
  console.log(`::${clientName} info::\n`, tcpInfo);
}

module.exports = {
  redisChatroomClient,
  redisGeneralClient,
  updateTribeCache,
  addMemberToTribeCache,
  removeMemberFromTribeCache,
  getCachedActiveMembers,
  logRedisInfo,
};
