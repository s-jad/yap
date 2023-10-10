const bcrypt = require('bcrypt');
const saltRounds = 10;

async function testHashPassword() {
  const password = '';

  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);

  console.log('TEST::Hash: ', hash);
}

async function comparePwHash(password, hash) {
  try {
    const result = await bcrypt.compare(password, hash);
    return result;
  } catch (err) {
    console.error(err);
    return false;
  }
} 

module.exports = {
  comparePwHash
};
