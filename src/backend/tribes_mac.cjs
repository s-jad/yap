const { pg_client } = require("./tribes_db.cjs");
const { logger } = require('./logging.cjs');
const { hashPassword } = require("./pw_encryption.cjs");

function getTribes() {
  return new Promise((resolve, reject) => {
    pg_client.query('SELECT tribe_name, tribe_cta, tribe_description FROM tribes', (err, res) => {
      if (err) {
        logger.error(err);
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
        logger.error(err);
        reject(err);
      } else {
        if (res.rows.length < 3) {
          getRandomTribeSuggestions()
            .then(tribeSuggestions => {
              resolve(tribeSuggestions);
            })
            .catch(err => reject(err));
        } else {
          resolve(res.rows);
        }
      }
    });
  });
}

function getRandomTribeSuggestions() {
  const query = `
    SELECT tribe_name FROM tribes
    ORDER BY RANDOM()
    LIMIT 3;
  `;

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err)
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
          sender.user_color AS sender_color,
          receiver.user_name AS receiver_name,
          receiver.user_color AS receiver_color
        FROM 
          chatroom_messages msg 
        INNER JOIN 
          users sender ON msg.sender_id = sender.user_id
        INNER JOIN 
          users receiver ON msg.receiver_id = receiver.user_id
        WHERE 
          msg.tribe_name = \$1
          AND msg.message_timestamp >= CURRENT_DATE::timestamp
          AND msg.message_timestamp < (CURRENT_DATE + INTERVAL '1 day')::timestamp
        ORDER BY
          msg.message_timestamp ASC;
      `,
      values: [tribe],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        resolve(res.rows);
      }
    });
  });
}

function postGlobalMessage(messageData) {
  const { 
    tribe_name,
    message_content, 
    message_timestamp,
    global,
    sender_id } = messageData;

  const query = {
    text: `
      INSERT into chatroom_messages (tribe_name, message_content, sender_id, receiver_id, message_timestamp, message_global)
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
      RETURNING *;
    `,
    values: [
      tribe_name,
      message_content,
      sender_id,
      sender_id,
      message_timestamp,
      global
    ],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('Error posting message.'));
      } else if (res.rows.length === 0) {
        logger.error(err);
        reject(new Error('Error posting message.'));
      } else {
        resolve(true);
      }
    })
  })
}

function postPersonalMessage(messageData) {
  const { 
    tribe_name, 
    message_content, 
    receiver_name,
    message_timestamp,
    sender_id,
    global } = messageData;

  const receiverIdQuery = {
    text: `
      SELECT user_id FROM users WHERE user_name = \$1;
    `,
    values: [receiver_name],
  };
  console.log("postPersonalMessage::sender => ", sender_id);
  return new Promise((resolve, reject) => {
    pg_client.query(receiverIdQuery)
      .then(res => {
        if (res.rows.length === 0) {
          logger.warn('postPersonalMessage::res.rows.length === 0');
          reject(new Error('Error executing receiverIdQuery.'));
        } else {
          const receiverId = res.rows[0].user_id;
          const postMessageQuery = {
            text: `
              INSERT into chatroom_messages (tribe_name, message_content, sender_id, receiver_id, message_timestamp, message_global)
              VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
              RETURNING *;
            `,
            values: [
              tribe_name,
              message_content,
              sender_id,
              receiverId,
              message_timestamp,
              global
            ],
          };

          return pg_client.query(postMessageQuery);
        }
      })
      .then(res => {
        resolve(true);
      })
      .catch((err) => {
        logger.error(err);
        reject(new Error('Error executing postMessageQuery.'));
      });
  });
}

function backupChatroomMessages(messageData) {
  console.log("Inside backupChatroomMessages!")
  const { global } = messageData;
  console.log("messageData => ", messageData);
  if (global) {
    logger.info("Posting global message");
    const res = postGlobalMessage(messageData);
    return res;
  } else {
    logger.info("Posting personal message");
    const res = postPersonalMessage(messageData);
    return res;
  }
}

function getInboxMessages(userId) {
  const query = {
    text: `
      SELECT
        msg.message_id,
        msg.message_content,
        msg.message_timestamp,
        sender.user_name as sender_name,
        sender.user_color as sender_color,
        receiver.user_name as receiver_name,
        receiver.user_color as receiver_color,
        msg.message_read,
        msg.parent_message_id
      FROM
        user_messages msg
      INNER JOIN
        users sender ON msg.sender_id = sender.user_id
      INNER JOIN
        users receiver ON msg.receiver_id = receiver.user_id
      WHERE (
        msg.receiver_id = \$1
        OR msg.sender_id = \$1
      )
      AND NOT (
        (msg.receiver_id = \$1 AND msg.receiver_deleted = TRUE)
        OR (msg.sender_id = \$1 AND msg.sender_deleted = TRUE)
      )
      ORDER BY
        msg.message_timestamp DESC
    `,
    values: [userId],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('Error fetching inbox messages'));
      } else {
        resolve(res.rows);
      }
    });
  });
}

async function deleteInboxMessage(deleteMsgData) {
  const { msgIds, userId } = deleteMsgData;

  const query = {
    text: `
      UPDATE user_messages
      SET 
        sender_deleted = CASE WHEN sender_id = \$2 THEN TRUE ELSE sender_deleted END,
        receiver_deleted = CASE WHEN receiver_id = \$2 THEN TRUE ELSE receiver_deleted END
      WHERE message_id = ANY(\$1)
      RETURNING *;
    `,
    values: [msgIds, userId],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('Can not delete user messages'));
      } else {
        resolve(res);
      }
    });
  });
}

async function replyToInboxMessage(replyMsgData) {
  const { parentMsgId, newMsg, userId } = replyMsgData;
  const query = {
    text: `
      INSERT INTO user_messages (sender_id, receiver_id, message_content, parent_message_id)
      VALUES (
        \$1, 
        (SELECT sender_id FROM user_messages WHERE message_id = \$3), 
        \$2, 
        \$3
      );
    `,
    values: [userId, newMsg, parentMsgId],
  };

  const updateQuery = {
    text: `
      UPDATE user_messages
      SET sender_deleted = FALSE
      WHERE message_id = \$1;
    `,
    values: [parentMsgId],
  };

  try {
    const { insertRes, updateRes } = await Promise.all([
      new Promise((resolve, reject) => {
        pg_client.query(query, (err, res) => {
          if (err) {
            logger.error(err);
            reject(new Error('Can not insert reply message.'));
          } else {
            const insertRes = true; 
            resolve(insertRes);
          }
        });
      }),
      new Promise((resolve, reject) => {
        pg_client.query(updateQuery, (err, res) => {
          if (err) {
            logger.error(err);
            reject(new Error('Can not update message.'));
          } else {
            const updateRes = true;
            resolve(updateRes);
          }
        });
      }),
    ]);
    return { insertRes, updateRes };
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function createUser(newUserData) {
  const { user, pw, joined, userColor } = newUserData;
  const pwHash = await hashPassword(pw);

  const query = {
    text: `
      INSERT into users (user_name, password, joined, last_login, user_color)
      VALUES (\$1, \$2, \$3, \$4, \$5)
      RETURNING *; 
    `,
    values: [user, pwHash, joined, joined, userColor],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('Cant create user.'));
      } else if (res.rows.length === 0) {
        logger.error(err);
        reject(new Error('Cant create user.'));
      } else {
        const row = res.rows[0];
        resolve({
          username: row.user_name,
          userId: row.user_id,
          userColor: row.user_color
        });
      }
    })
  });
}

function userExists(userData) {
  console.log("userData => ", userData);
  const query = `
    SELECT user_name FROM users WHERE user_id = ${userData};
  `;

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('Error checking user exists'));
      } else if (res.rows.length === 0) {
        resolve(false);
      } else {
        console.log("userExists res.rows[0] => ", res.rows[0]);
        const user = res.rows[0]
        resolve(user);
      }
    });
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
        logger.error(err);
        reject(new Error('Cant create tribe.'));
      } else if (res.rows.length === 0) {
        logger.error(err);
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
    const query = `SELECT user_id, password, user_color FROM users WHERE user_name = '${user}'`;

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('User with that password does not exist'));
      } else if (res.rows.length === 0) {
        reject(new Error('User with that password does not exist'));
      } else {
        const row = res.rows[0];
        resolve({
          userId: row.user_id,
          passwordHash: row.password,
          userColor: row.user_color
        });
      }
    });
  });
}

function getTribeMembers(tribe) {
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        SELECT 
          users.user_name,
          tribe_members.last_login,
          tribe_members.last_logout
        FROM users
        JOIN tribe_members ON users.user_id = tribe_members.member_id
        JOIN tribes ON tribe_members.tribe_id = tribes.tribe_id
        WHERE tribes.tribe_name = \$1;
      `,
      values: [tribe],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else if (res.rows.length === 0) {
        logger.error('Tribe has no members');
        reject(new Error('Tribe has no members'));
      } else {
        const members = res.rows;
        console.log("tribesMac::getTribeMembers::members => ", members);
        resolve(members);
      }
    });
  });
}

function updateTribeMemberLogin(loginData) {
  console.log("INSIDE updateTribeMemberLogin");
  const { timestamp, tribe, member } = loginData;
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        UPDATE tribe_members
        SET last_login = \$1
        WHERE (
          tribe_id = (
            SELECT tribe_id FROM tribes WHERE tribe_name = \$2
          )
          AND member_id = \$3
        )
        RETURNING *;
      `,
      values: [timestamp, tribe, member],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        console.log(res);
        resolve(res);
      }
    })
  });
}

function updateTribeMemberLogout(logoutData) {
  const { timestamp, tribe, member } = logoutData;
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        UPDATE tribe_members
        SET last_logout = \$1
        WHERE (
          tribe_id = (
            SELECT tribe_id FROM tribes WHERE tribe_name = \$2
          )
          AND member_id = \$3
        )
        RETURNING *;
      `,
      values: [timestamp, tribe, member],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        console.log(res);
        resolve(res);
      }
    })
  });
}

async function tribesMac(req, data) {
  switch (req) {
    case 'create-user':
      const user = await createUser(data);
      return user;

    case 'user-exists':
      const exists = await userExists(data);
      return exists;

    case 'update-tribe-member-login':
      const login = await updateTribeMemberLogin(data);
      return login;

    case 'update-tribe-member-logout':
      const logout = await updateTribeMemberLogout(data);
      return logout;

    case 'get-tribes':
      const tribes = await getTribes();
      return tribes;

    case 'get-last-tribe-logins':
      const lastLogins = await getLastTribeLogin(data);
      return lastLogins;

    case 'get-random-tribe-suggestions':
      const suggestions = await getRandomTribeSuggestions();
      return suggestions;

    case 'get-tribe-members':
      const members = await getTribeMembers(data);
      return members;

    case 'create-tribe':
      const tribe = await createTribe(data);
      return tribe;

    case 'get-messages':
      const messages = await getChatroomMessages(data);
      return messages;

    case 'delete-inbox-message':
      const deleted = await deleteInboxMessage(data);
      return deleted;

    case 'reply-to-inbox-message':
      const reply = await replyToInboxMessage(data);
      return reply;

    case 'get-inbox-messages':
      const inboxMessages = await getInboxMessages(data);
      return inboxMessages;

    case 'backup-chatroom-messages':
      const msg = await backupChatroomMessages(data);
      console.log("tribesMac::msg => ", msg);
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
