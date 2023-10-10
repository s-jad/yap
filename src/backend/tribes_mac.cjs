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

function createUser(newUserData) {
  const { user, pw, joined } = newUserData;
  const query = {
    text: `
      INSERT into users (user_name, password, joined)
      VALUES (\$1, \$2, \$3)
      RETURNING *; 
    `,
    values: [user, pw, joined],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        reject(new Error('Cant create user.'));
      } else if (res.rows.length === 0) {
        console.error(err);
        reject(new Error('Cant create user.'));
      } else {
        console.log("createUser::res.rows => ", res.rows[0]);
        resolve(res.rows[0].user_name);
      }
    })
  });
}
function createTribe(newTribeData) {
  const values = newTribeData;
  const query = `
    INSERT into tribes (tribe_name, tribe_cta, tribe_description, formation_date, founding_member)
    VALUES (\$1, \$2, \$3, \$4, (SELECT user_id FROM users WHERE user_name = \$5))
    RETURNING *; 
  `;

  return new Promise((resolve, reject) => {
    pg_client.query(query, values, (err, res) => {
      if (err) {
        console.error(err);
        reject(new Error('Cant create tribe.'));
      } else if (res.rows.length === 0) {
        console.error(err);
        reject(new Error('Cant create tribe'));
      } else {
        const newTribeName = values[0];
        resolve(newTribeName);
      }
    })
  });
}

function getPwHash(user) {
  return new Promise((resolve, reject) => {
    const query = {
      text: 'SELECT password FROM users WHERE user_name = \$1',
      values: [user],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        reject(new Error('User with that password does not exist'));
      } else if (res.rows.length === 0) {
        reject(new Error('User with that password does not exist'));
      } else {
        resolve(res.rows[0].password);
      }
    });
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

    case 'create-user':
      const user = await createUser(data);
      return user;

    case 'get-messages':
      const messages = await getChatroomMessages(data);
      return messages;

    case 'get-password':
      const passwordHash = await getPwHash(data);
      return passwordHash;

    default:
      break;
  }
}

module.exports = {
  tribesMac,
};
