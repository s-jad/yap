const { logger } = require('./logging.cjs');
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  logger.info(`Hash: ${hash}`);
  return hash;
}

async function comparePwHash(password, hash) {
  try {
    const result = await bcrypt.compare(password, hash);
    if (!result) {
      throw new Error('Password does not match.');
    }
    return result;
  } catch (err) {
    logger.error(err);
    throw err;
  }
} 

module.exports = {
  comparePwHash,
  hashPassword
};
