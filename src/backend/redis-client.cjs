const Redis = require('redis');

const redisChatroomClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_CHATROOM_PORT,
});


const redisNotificationsClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_NOTIFICATIONS_PORT,
});

redisChatroomClient.connect();
redisNotificationsClient.connect();

module.exports = {
  redisChatroomClient,
  redisNotificationsClient,
};
