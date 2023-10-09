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

function formatTribeUrl(tribeUrl) {
  let formattedTribeUrl = tribeUrl.replace(/-/g, ' ');
  formattedTribeUrl = formattedTribeUrl.replace('/', '');
  formattedTribeUrl = formattedTribeUrl.charAt(0).toUpperCase() + formattedTribeUrl.slice(1);

  return formattedTribeUrl;
}

function getChatroomMessages(tribeUrl) {
  const tribe = formatTribeUrl(tribeUrl);

  return new Promise((resolve, reject) => {
    const query = {
      text: 'SELECT message_content, message_timestamp FROM messages WHERE tribe_name = \$1',
      values: [tribe],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(res.rows);
      }
    });
  });
}

function createTribe(newTribeData) {
  const values = newTribeData;
  const query = `
    INSERT into tribes (tribe_name, tribe_cta, tribe_description, formation_date)
    VALUES (\$1, \$2, \$3, \$4)
    RETURNING *; 
  `;

  return new Promise((resolve, reject) => {
    pg_client.query(query, values, (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(res.rows[0]);
      }
    })
  });
}

async function tribesMac(req, data) {
  switch (req) {
    case 'get-tribes':
      const tribes = await getTribes();
      return tribes;

    case 'create-tribe':
      const tribe = await createTribe(data);
      return tribe;

    case 'get-messages':
      const messages = await getChatroomMessages(data);
      return messages;
    default:
      break;
  }
}

module.exports = {
  tribesMac,
};
