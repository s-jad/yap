const { pg_client } = require("./tribes_db.cjs");
const { logger } = require('./logging.cjs');
const { hashPassword } = require("./pw_encryption.cjs");

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

function updateUserLogin(user) {
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        UPDATE 
          users
        SET
          last_login = NOW()
        WHERE
          user_id = \$1
        RETURNING last_login;
      `,
      values: [user]
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err)
        reject(new Error('Failed to update user login'));
      } else {
        const login = res.rows[0].last_login;
        logger.info('Updated user login => ', login);
        resolve(login);
      }
    })
  })
}

function updateUserLogout(user) {
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        UPDATE 
          users
        SET
          last_logout = NOW()
        WHERE
          user_id = \$1
        RETURNING last_logout;
      `,
      values: [user]
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err)
        reject(new Error('Failed to update user logout'));
      } else {
        const login = res.rows[0].last_logout;
        logger.info('Updated user login => ', login);
        resolve(login);
      }
    })
  })
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

function getFriends(userId) {
  const query = {
    text: `
      SELECT 
        u.user_name,
        u.last_login,
        u.last_logout,
        t.tribe_name,
        tm.last_login AS last_tribe_login, 
        tm.last_logout AS last_tribe_logout
      FROM users u
      JOIN friends f ON u.user_id = f.friend_id
      JOIN tribe_members tm ON u.user_id = tm.member_id
      JOIN tribes t ON tm.tribe_id = t.tribe_id
      WHERE (
        f.user_id = \$1
        AND tm.last_login = (
          SELECT MAX(last_login)
          FROM tribe_members
          WHERE member_id = u.user_id
        )
      )
      UNION ALL
      SELECT 
        u.user_name,
        u.last_login,
        u.last_logout,
        t.tribe_name,
        tm.last_login AS last_tribe_login,
        tm.last_logout AS last_tribe_logout
      FROM users u
      JOIN friends f ON u.user_id = f.user_id
      JOIN tribe_members tm ON u.user_id = tm.member_id
      JOIN tribes t ON tm.tribe_id = t.tribe_id
      WHERE (
        f.friend_id = \$1
        AND tm.last_login = (
          SELECT MAX(last_login)
          FROM tribe_members
          WHERE member_id = u.user_id
        )
      );
    `,
    values: [userId],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(new Error('Error getting friends list from db'));
      } else if (res.rows.length === 0) {
        resolve(false);
      } else {
        const friends = res.rows;
        resolve(friends);
      }
    })
  });
}

function getRandomTribeSuggestions() {
  const query = `
    SELECT 
      t.tribe_name,
      ti.tribe_icon
    FROM tribes t
    JOIN tribe_icons ti ON t.tribe_id = ti.tribe_id
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

function getLastTribeLogin(userId) {
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        SELECT 
          ti.tribe_icon, 
          t.tribe_name,
          tm.last_login
        FROM 
          tribe_members tm
        JOIN tribes t ON tm.tribe_id = t.tribe_id
        JOIN tribe_icons ti ON t.tribe_id = ti.tribe_id
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
          logger.info(res.rows);
          resolve(res.rows);
        }
      }
    });
  });
}

function createTribe(newTribeData) {
  const { userId, tribeName, tribeCta, tribeDescription, formationDate, icon, tribePrivacy } = newTribeData;
  console.log("createTribe::newTribeData => ", newTribeData);
  
  let query;
  if (icon === undefined) {
    query = {
      text: `
      INSERT into tribes (
        founding_member,
        tribe_name,
        tribe_cta,
        tribe_description,
        formation_date,
        private
      )
      VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
      RETURNING *; 
      `,
      values: [ userId, tribeName, tribeCta, tribeDescription, formationDate, tribePrivacy ],
    };
  } else {
    query = {
      text: `
      WITH new_tribe AS (
        INSERT into tribes (
          founding_member,
          tribe_name,
          tribe_cta,
          tribe_description,
          formation_date,
          private
        )
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6)
        RETURNING tribe_id
      )
      INSERT INTO tribe_icons (tribe_id, tribe_icon)
      SELECT tribe_id, decode(\$7, 'base64') FROM new_tribe
      RETURNING tribe_id;
      `,
      values: [ userId, tribeName, tribeCta, tribeDescription, formationDate, tribePrivacy, icon ],
    };
  }

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        console.log("actual error");
        logger.error(err);
        reject(new Error('Cant create tribe.'));
      } 
      else {
        const newTribeName = tribeName;
        const tribeId = res.rows[0].tribe_id;
        const returnData = { newTribeName, tribeId };
        console.log("new tribeID => ", tribeId);
        resolve(returnData);
      }
    })
  });
}

function getTribes() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        t.tribe_name,
        t.tribe_cta, 
        t.tribe_description, 
        t.private,
        ti.tribe_icon
      FROM tribes t
      LEFT JOIN tribe_icons ti ON t.tribe_id = ti.tribe_id;
    `;

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

function checkRole(checkData) {
  const { userId, tribeName } = checkData;
  return new Promise ((resolve, reject) => {
    const query = {
      text: `
        SELECT member_role 
        FROM tribe_members 
        WHERE member_id = \$1
        AND tribe_id = (SELECT tribe_id FROM tribes WHERE tribe_name = \$2);
      `,
      values: [userId, tribeName],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        logger.info(res.rows[0]);
        resolve(res.rows[0]);
      }
    })
  });
}

function getApplicants(tribeName) {
  return new Promise ((resolve, reject) => {
    const query = {
      text: `
        WITH applicants AS (
          SELECT 
            applying_user_id,
            application_date
          FROM 
            private_tribes_invitations
          WHERE tribe_id = (SELECT tribe_id FROM tribes WHERE tribe_name = \$1)
          AND application_accepted = false
          AND application_denied = false
        ) 
        SELECT
          users.user_name, 
          applicants.application_date
        FROM 
          users 
        JOIN 
          applicants ON users.user_id = applicants.applying_user_id;
      `,
      values: [ tribeName ],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        logger.info(res);
        resolve(res);
      }
    });
  });
}

function postJoinTribeApplication(applicationData) {
  const { applyingUserId, tribeName } = applicationData;
  return new Promise ((resolve, reject) => {
    const query = {
      text: `
        INSERT INTO private_tribes_invitations (
          tribe_id,
          inviting_user_id,
          applying_user_id,
          application_accepted
        ) VALUES (
          (SELECT tribe_id FROM tribes WHERE tribe_name = \$1),
          null,
          \$2,
          FALSE
        ) RETURNING *;
      `,
      values: [ tribeName, applyingUserId ],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        logger.info(res);
        resolve(res.rowCount);
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
      INSERT into chatroom_messages (
        tribe_name,
        message_content,
        sender_id,
        receiver_id,
        message_timestamp,
        message_global
      )
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
  const { global } = messageData;
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

async function sendInboxMessage(msgData) {
  const { newMsg, receiverName, userId } = msgData;
  const query = {
    text: `
      WITH msg AS (
        INSERT INTO user_messages (sender_id, receiver_id, message_content, parent_message_id)
        VALUES (
          \$1,
          (SELECT user_id FROM users WHERE user_name = \$2),
          \$3,
          NULL
        )
        RETURNING *
      )
      SELECT 
        msg.message_id,
        msg.message_content,
        msg.message_timestamp,
        sender.user_name as sender_name,
        sender.user_color as sender_color,
        receiver.user_name as receiver_name,
        receiver.user_color as receiver_color,
        msg.message_read,
        msg.parent_message_id,
        msg.receiver_id
      FROM msg 
      INNER JOIN
        users sender ON msg.sender_id = sender.user_id
      INNER JOIN
        users receiver ON msg.receiver_id = receiver.user_id;
    `,
    values: [userId, receiverName, newMsg],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        console.log("res.rows", res.rows[0]);
        resolve(res.rows[0]);
      }
    });
  });
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

function getNotifications(userId) {
  const query = {
    text: `
      SELECT 
        unique_notifications.*, 
        users.user_name AS sender_name, 
        users.user_color AS sender_color
      FROM 
        unique_notifications
      INNER JOIN
        users 
      ON unique_notifications.notification_sender = users.user_id
      WHERE
        unique_notifications.notification_id IN 
      (SELECT notification_id FROM notifications WHERE user_id = \$1);
    `,
    values: [userId],
  };

  return new Promise((resolve, reject) => {
    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        console.log(res.rows);
        resolve(res.rows);
      }
    });
  });
}

function deleteInboxMessage(deleteMsgData) {
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

function addNewTribeMember(newMemberData) {
  const { userId, tribeId, memberRole } = newMemberData;
  return new Promise((resolve, reject) => {
    const query = {
      text: `
        INSERT INTO tribe_members (member_id, tribe_id, member_role)
        VALUES (\$1, \$2, \$3)
        RETURNING *;
      `,
      values: [ userId, tribeId, memberRole ],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        logger.info(res);
        resolve(res);
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
      } else {
        console.log("tribes_mac::getTribeMembers::res => ", res);
        const members = res.rows;
        console.log("tribes_mac::getTribeMembers::members => ", members);
        resolve(members);
      }
    });
  });
}

function updateTribeMemberLogin(loginData) {
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
        resolve(res);
      }
    })
  });
}

function postUserIncidentReport(incidentData) {
  const {
    userId,
    incidentDescription,
    incidentType,
    involvedUsers,
  } = incidentData;

  return new Promise((resolve, reject) => {
    const query = {
      text: `
        WITH inserted_report AS (
          INSERT INTO user_incident_reports (reporting_user_id, incident_description, incident_type)
          VALUES (\$1, \$2, \$3)
          RETURNING report_id
        ), involved_user_ids AS (
          SELECT user_id FROM users WHERE user_name = ANY (SELECT UNNEST(\$4::text[]))
        )
        INSERT INTO user_incident_reports_involved_users (report_id, involved_user_id)
        SELECT report_id, user_id FROM inserted_report, involved_user_ids; 
      `,
       values: [userId, incidentDescription, incidentType, involvedUsers],
    };

    pg_client.query(query, (err, res) => {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        logger.info(res);
        resolve(res.rowCount);
      }
    });
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

    case 'get-friends':
      const friends = await getFriends(data);
      return friends;

    case 'get-notifications':
      const notifications = await getNotifications(data);
      return notifications;

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

    case 'apply-for-invitation':
      const inviteRes = await postJoinTribeApplication(data);
      return inviteRes;

    case 'get-applicants':
      const applicants = await getApplicants(data);
      return applicants;

    case 'check-role':
      const roleCheck = await checkRole(data);
      return roleCheck;

    case 'create-tribe':
      const tribe = await createTribe(data);
      return tribe;

    case 'add-user-to-tribe-members':
      const newMember = await addNewTribeMember(data);
      return newMember;

    case 'get-messages':
      const messages = await getChatroomMessages(data);
      return messages;

    case 'delete-inbox-message':
      const deleted = await deleteInboxMessage(data);
      return deleted;

    case 'send-inbox-message':
      const userMsg = await sendInboxMessage(data);
      return userMsg;

    case 'reply-to-inbox-message':
      const reply = await replyToInboxMessage(data);
      return reply;

    case 'get-inbox-messages':
      const inboxMessages = await getInboxMessages(data);
      return inboxMessages;

    case 'backup-chatroom-messages':
      const msg = await backupChatroomMessages(data);
      return msg;

    case 'report-user-incident':
      const reportResult = await postUserIncidentReport(data);
      return reportResult;

    case 'update-user-login':
      const userLogin = await updateUserLogin(data);
      return userLogin;

    case 'update-user-logout':
      const userLogout = await updateUserLogout(data);
      return userLogout;

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
