const { pg_client } = require("./tribes_db.cjs");

function getTribes() {
  return new Promise((resolve, reject) => {
    pg_client.query('SELECT tribe_name, tribe_cta, tribe_description FROM tribes', (err, res) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(res.rows);
      }
    });
  });
}

async function tribesMac(req) {
  switch (req) {
    case 'tribes':
      const tribes = await getTribes();
      return tribes;

    default:
      break;
  }
}

module.exports = {
  tribesMac,
};
