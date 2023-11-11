const Redis = require('redis');

const redisChatroomClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_CHATROOM_PORT,
});

redisChatroomClient.connect();

const redisInboxClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_INBOX_PORT,
});

redisInboxClient.connect();

module.exports = {
  redisChatroomClient,
  redisInboxClient,
};
