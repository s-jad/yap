const Redis = require('redis');

const redisChatroomClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_CHATROOM_PORT,
});

redisChatroomClient.connect();

module.exports = {
  redisChatroomClient,
};
