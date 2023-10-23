const Redis = require('redis');

const redisClient = new Redis.createClient({
  host: process.env.DEV_HOST,
  port: process.env.REDIS_PORT,
});

redisClient.connect();

module.exports = {
  redisClient,
};
