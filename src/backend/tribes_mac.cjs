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

function getLastTribeLogin(userId) {
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        SELECT 
          t.tribe_name, 
          tm.last_login
        FROM 
          tribe_members tm
        JOIN 
          tribes t ON tm.tribe_id = t.tribe_id
        WHERE 
          tm.member_id = \$1 
          AND tm.last_login IN (
            SELECT 
              last_login 
            FROM 
              tribe_members 
            WHERE 
              member_id = \$1 
            ORDER BY 
              last_login DESC 
            LIMIT 
              3
          )
        ORDER BY 
          tm.last_login DESC;
      `,
      values: [userId],
    };
    
    pg_client.query(query, (err, res) => {
      if (err) {
        console.log(err);
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
      text: `
        SELECT 
          msg.message_content, 
          msg.message_timestamp, 
          sender.user_name AS sender_name, 
          receiver.user_name AS receiver_name 
        FROM 
          messages msg 
        INNER JOIN 
          users sender ON msg.sender_id = sender.user_id
        INNER JOIN 
          users receiver ON msg.receiver_id = receiver.user_id
        WHERE 
          msg.tribe_name = \$1
          AND msg.message_timestamp >= CURRENT_DATE::timestamp
          AND msg.message_timestamp < (CURRENT_DATE + INTERVAL '1 day')::timestamp;
      `,
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

function postGlobalMessage(messageData) {
  const { tribe, message, sender, _, timestamp, global } = messageData;
  const query = {
    text: `
      INSERT into messages (tribe_name, message_content, sender_id, receiver_id, message_timestamp, message_global)
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
      RETURNING *;
    `,
    values: [tribe, message, sender, sender, timestamp, global],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        reject(new Error('Error posting message.'));
      } else if (res.rows.length === 0) {
        console.error(err);
        reject(new Error('Error posting message.'));
      } else {
        console.log("postGlobalMessage::res.rows => ", res.rows[0]);
        resolve(res.rows[0]);
      }
    })
  })
}

function postPersonalMessage(messageData) {
  const { tribe, message, sender, receiver, timestamp, global } = messageData;
  const receiverIdQuery = {
    text: `
      SELECT user_id FROM users WHERE user_name = \$1;
    `,
    values: [receiver],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(receiverIdQuery)
      .then(res => {
        if (res.rows.length === 0) {
          console.error(err);
          reject(new Error('Error executing receiverIdQuery.'));
        } else {
          const receiverId = res.rows[0].user_id;
          console.log("tribesMac::receiverId => ", receiverId);
          const postMessageQuery = {
            text: `
              INSERT into messages (tribe_name, message_content, sender_id, receiver_id, message_timestamp, message_global)
              VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
              RETURNING *;
            `,
            values: [tribe, message, sender, receiverId, timestamp, global],
          };

          return pg_client.query(postMessageQuery);
        }
      })
      .then(res => {
        console.log("postPersonalMessage::res.rows => ", res.rows[0]);
        resolve(res.rows[0]);
      })
      .catch(err => {
        console.error(err);
        reject(new Error('Error executing postMessageQuery.'));
      });
  });
}

function postMessage(messageData) {
  const { global } = messageData;
  if (global) {
    console.log("Posting global message");
    postGlobalMessage(messageData);
  } else {
    console.log("Posting personal message");
    postPersonalMessage(messageData);
  }
}

function createUser(newUserData) {
  const { user, pw, joined } = newUserData;
  const query = {
    text: `
      INSERT into users (user_name, password, joined, last_login)
      VALUES (\$1, \$2, \$3, \$4)
      RETURNING *; 
    `,
    values: [user, pw, joined, joined],
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
        const row = res.rows[0];
        resolve({ username: row.user_name, userId: row.user_id });
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
      text: 'SELECT user_id, password FROM users WHERE user_name = \$1',
      values: [user],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        reject(new Error('User with that password does not exist'));
      } else if (res.rows.length === 0) {
        reject(new Error('User with that password does not exist'));
      } else {
        const row = res.rows[0];
        resolve({ userId: row.user_id, passwordHash: row.password });
      }
    });
  });
}

async function tribesMac(req, data) {
  switch (req) {
    case 'get-tribes':
      const tribes = await getTribes();
      return tribes;

    case 'get-last-tribe-logins':
      const lastLogins = await getLastTribeLogin(data);
      return lastLogins;

    case 'create-tribe':
      const tribe = await createTribe(data);
      return tribe;

    case 'create-user':
      const user = await createUser(data);
      return user;

    case 'get-messages':
      const messages = await getChatroomMessages(data);
      return messages;

    case 'post-message':
      const msg = await postMessage(data);
      return msg;

    case 'get-password':
      const result = await getPwHash(data);
      return result;

    default:
      break;
  }
}

module.exports = {
  tribesMac,
};
