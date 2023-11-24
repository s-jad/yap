const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const liveReload = require('livereload');
const connectLiveReload = require('connect-livereload');
const multer = require('multer');
const upload = multer();

const liveReloadServer = liveReload.createServer();
liveReloadServer.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

const port = process.env.SERVER_PORT;
const jwtSecret = process.env.JWT_SECRET;

const config = require('./webpack.config.cjs');
const compiler = webpack(config);
const { authorization } = require('./src/backend/auth.cjs');
const { tribesMac } = require('./src/backend/tribes_mac.cjs');
const { comparePwHash } = require('./src/backend/pw_encryption.cjs');
const { logger } = require('./src/backend/logging.cjs');
const { backupChatMessages } = require('./src/backend/job-scheduler.cjs');
const {
  redisChatroomClient,
  redisGeneralClient,
  updateTribeCache,
  updateActiveMembersCache,
  getCachedActiveMembers,
  removeMemberFromTribeCache
} = require('./src/backend/redis-client.cjs');

redisChatroomClient.on('ready', function() {
  logger.info('Redis chatroom client is ready');
});

redisGeneralClient.on('ready', function() {
  logger.info('Redis general client is ready');
});

backupChatMessages(redisChatroomClient);
logger.info('Chat message backup is ready');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');

// SOCKET.IO

const io = new Server(httpServer, {
  cors: {
    origin: process.env.SERVER_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['*'],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 120 * 1000,
    skipMiddlewares: false,
  },
});

async function handleTribeLoginDbUpdate(socket, chatroom) {
  try {
    const member = socket.decoded.id;
    const tribe = chatroom;
    const timestamp = new Date().toISOString();
    const patchData = { timestamp, tribe, member };
    const res = await tribesMac('update-tribe-member-login', patchData);
  } catch (error) {
    console.error(`Error updating ${member} login of ${tribe}`);
  }
}

async function handleTribeLogoutDbUpdate(socket, chatroom) {
  try {
    const member = socket.decoded.id;
    const tribe = chatroom;
    const timestamp = new Date().toISOString();
    const patchData = { timestamp, tribe, member };
    const res = await tribesMac('update-tribe-member-logout', patchData);
  } catch (error) {
    console.error(`Error updating ${member} logout of ${tribe}`);
  }
}

io.on('connection-error', (err) => {
  logger.error(err.req);
  logger.error(err.code);
  logger.error(err.message);
  logger.error(err.context);
});

const notificationsNameSpace = io.of('/notifications');
const chatroomNameSpace = io.of('/tribe-chat');

function validateSocketJWT(socket, next) {
  if (socket.request.headers.cookie){
    const cookies = socket.request.headers.cookie;
    const parts = cookies.split(';');
    const signature = parts[0].split('=')[1];
    const payload = parts[1].split('=')[1];
    const token = `${signature}.${payload}`;
    jwt.verify(token, jwtSecret, function(err, decoded) {
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }    
}

notificationsNameSpace.use((socket, next) => {
  validateSocketJWT(socket, next);
});

chatroomNameSpace.use((socket, next) => {
  validateSocketJWT(socket, next);
});

chatroomNameSpace.on('connection', (socket) => {
  try {
    console.log(`A new client connected: ${socket.id}`);

    socket.emit('connection', { message: `A new client has connected! with socket id of ${socket.id}`});
  } catch (error) {
    socket.emit('connection-error', {
      code: err.code,
      message: err.message,
    });
    console.log(`Error connecting client userId: ${socket.decoded.userId} => ${error}`);
  }
  
  // FOR DEBUGGING ONLY - REMOVE FOR PROD
  socket.use((packet, next) => {
    console.log('Received packet: ', packet);
    next();
  });
  
  // For page refreshes
  const referer = socket.request.headers.referer
  if (referer.includes('/tribe-chat')) {
    const urlParts = referer.split('/');
    const tribe = `${urlParts[4]}`;

    const chatroom = tribe
      .replaceAll('-', ' ');
  
    if (!socket.rooms.has(chatroom)) {
      try {
        socket.join(chatroom);
        const activeMembers = getCachedActiveMembers(chatroom);
        chatroomNameSpace.to(socket).emit('get active members', activeMembers);
        console.log(`Socket ${socket.id} joined chatroom ${chatroom}`);
        handleTribeLoginDbUpdate(socket, chatroom);

        const newActiveMember = {
          username: socket.decoded.userName,
          userColor: socket.decoded.userColor,
        };
        
        updateActiveMembersCache(chatroom, newActiveMember);
        chatroomNameSpace.to(chatroom).emit('member login', newActiveMember);
      } catch (error) {
        console.log(`Error joining ${chatroom}: ${error}`);
      }
    }
  }

  socket.on('join chatroom', (chatroom) => {
    if (!socket.rooms.has(chatroom)) {
      try {
        socket.join(chatroom);
        const activeMembers = getCachedActiveMembers(chatroom);
        chatroomNameSpace.to(socket).emit('get active members', activeMembers);
        console.log(`Socket ${socket.id} joined chatroom ${chatroom}`);
        handleTribeLoginDbUpdate(socket, chatroom);
        
        const newActiveMember = {
          username: socket.decoded.userName,
          userColor: socket.decoded.userColor,
        };

        updateActiveMembersCache(chatroom, newActiveMember);
        chatroomNameSpace.to(chatroom).emit('member login', newActiveMember);
      } catch (error) {
        console.log(`Error joining ${chatroom}: ${error}`);
      }
    }
  });

  socket.on('leave chatroom', (chatroom) => {
    try {
      socket.leave(chatroom);
      console.log(`Socket ${socket.id} left chatroom ${chatroom}`);
      handleTribeLogoutDbUpdate(socket, chatroom);

      const updateActiveMembers = {
        username: socket.decoded.userName,
        userColor: socket.decoded.userColor,
      };
      
      removeMemberFromTribeCache(chatroom, updateActiveMembers);
      chatroomNameSpace.to(chatroom).emit('member logout', updateActiveMembers);
    } catch (error) {
      console.log(`Error leaving ${chatroom}: ${error}`);
    }
  });

  socket.on('posting-message', (data) => {
    let toStore;
    if (data.receiver_name === null) {
      toStore = { 
        ...data, 
        receiver_name: socket.decoded.userName, 
        sender_name: socket.decoded.userName,
        sender_id: socket.decoded.id,
      };
    } else {
      toStore = {
        ...data,
        sender_name: socket.decoded.userName,
        sender_id: socket.decoded.id,
      };
    }
    if ('message_content' in toStore) {
      try {
        const msgStr = JSON.stringify(toStore);
        const jsonData = JSON.parse(msgStr);
        const { tribe_name, message_timestamp } = jsonData;
        const msgKey = `${tribe_name}.${message_timestamp}`;
        
        redisChatroomClient.set(msgKey, msgStr);
        chatroomNameSpace.to(tribe_name).emit('message', msgStr);

      } catch (error) {
        logger.error(`Error parsing JSON => ${error}`);
      }
    }
  });

  socket.on('user disconnect', (chatroom) => {
    console.log(`Disconnecting socket id: ${socket.id}, leaving ${chatroom}`);
    handleTribeLogoutDbUpdate(socket, chatroom);
    socket.disconnect();
  });
});


async function joinNotificationRooms(socket) {
  socket.join('yapp-notifications');
  
  const friends = await tribesMac('get-friend-info', socket.decoded.id);

  const userName = socket.decoded.userName; 

  friends.forEach(async (friend) => {
    const friendId = friend.user_id.toString();
    try {
      const friendSocketId = await redisGeneralClient.get(friendId);
      console.log(`friendId = ${friendId}, friendSocketId = ${friendSocketId}`);
      if (friendSocketId !== null) {
        try {
          const friendSocket = io.sockets.sockets.get(friendSocketId);
          if (friendSocket) {

            console.log(`friendSocket.join::name of room => ${userName}'s-notifications`);
            friendSocket.join(`${userName}'s-notifications`);

            console.log(`socket.join::name of room => ${friend.user_name}'s-notifications`);
            socket.join(`${friend.user_name}'s-notifications`);
          }
        } catch (error) {
          logger.error("Error getting friendSocket from io.sockets.sockets => friendId = ", friendId);
        }
      } 
    } catch (error) {
      logger.error("Error getting friendSocketId from redisGeneralClient => friendId = ", friendId);
    }
  });

  const tribes = await tribesMac('get-users-tribe-memberships', socket.decoded.id);

  tribes.forEach((tribe) => {
    const tribeName = tribe.tribe_name.replaceAll(' ', '-').toLowerCase();
    socket.join(`${tribeName}-notifications`);
  });
}

notificationsNameSpace.on('connection', (socket) => {
  try {
    console.log(`A new client connected to notifications: ${socket.id}`);
    socket.emit('connection', { message: `A new client has connected to their inbox! with socket id of ${socket.id}`});
    const userId = socket.decoded.id.toString();
    const socketId = socket.id.toString();
    io.sockets.sockets.set(socketId, socket);
    redisGeneralClient.set(`user:${userId}`, socketId);
  } catch (error) {
    socket.emit('connection-error', {
      code: error.code,
      message: error.message,
    });
    console.log(`Error connecting client to notifications: ${error}`);
  }

  joinNotificationRooms(socket);

  socket.on('user disconnect', () => {
    socket.disconnect();
  });

  socket.on('disconnect', async () => {
    console.log(`${socket.decoded.userName} disconnected`);
    const loggedOut = await tribesMac('update-user-logout', socket.decoded.id);
    console.log(`Log out recorded: ${loggedOut}`);
  });

});


// FOR DEBUGGING!
// app.use((req, res, next) => {
//   console.log('Request URL:', req.originalUrl);
//   next();
// });

app.use(connectLiveReload());

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

app.use('/', express.static(path.join(__dirname, '/'), {
    setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.use('/assets/imgs', express.static(path.join(__dirname, '/assets/imgs')));

// Not sure if necessary yet
// app.use(session({
//   store: new RedisStore({ client: redisClient }),
//   secret: process.env.REDIS_KEY,
//   resave: false,
//   saveUninitialized: true,
//   // change to https to use secure true
//   cookie: { 
//     secure: false,
//     sameSite: 'strict',
//   }
// }));

app.use('/api/protected', authorization);

app.post('/api/authenticate-user', async (req, res) => {
  const username = req.body.user;
  const password = req.body.pw;

  try {
    const userData = await tribesMac('get-password', username);
    const { userId, passwordHash, userColor, userRole } = userData;

    try {
      const authenticated = await comparePwHash(password, passwordHash);

      if (!authenticated) {
        res.status(401).json({ message: 'Incorrect Password.' })    
      } else {
        const token = jwt.sign({ 
          userName: username,
          id: userId,
          role: userRole,
          userColor: userColor
        }, jwtSecret, { expiresIn: '3h' });

        const parts = token.split('.');
        // Set JWT header and signature in HttpOnly cookie
        res.cookie('jwt_signature', `${parts[0]}.${parts[1]}`, { 
          httpOnly: true,
          sameSite: 'strict',
        });
        // Set JWT payload in a JavaScript-accessible cookie
        res.cookie('jwt_payload', parts[2], { 
          httpOnly: false,
          sameSite: 'strict',
        });

        await tribesMac('update-user-login', userId);

        res.status(200).json({ 
          message: 'Login Succesful.',
          userColor,
          userRole,
        });
      } 
    } catch (error) {
      if (error.message === 'Password does not match.') {
        logger.info('User entered a password that failed comparePwHash');
        res.status(401).json({ message: 'Incorrect Password.' });
      } else {
        logger.error("Error 100: ", error);
        res.status(500).json({ message: 'An error occured.' });
      }
    }

  } catch (error) {
    if (error.message === 'Username or password are incorrect.') {
      logger.info('User entered an incorrect username or password');
      res.status(401).json({ message: 'Incorrect username or password.' });
    } else {
      logger.error("Error 101: ", error);
      res.status(500).json({ message: 'Database Error.' });
    }
  }
});

app.post('/api/create-user', async (req, res) => {
  try {
    const { username, userId, userColor } = await tribesMac('create-user', req.body);

    const token = jwt.sign({
      userName: username,
      id: userId,
      role: userRole,
      userColor: userColor
    }, jwtSecret, { expiresIn: '3h' });

    const parts = token.split('.');
    // Set JWT header and signature in HttpOnly cookie
    res.cookie('jwt_signature', `${parts[0]}.${parts[1]}`, { 
      httpOnly: true,
      sameSite: 'strict',
    });
    // Set JWT payload in a JavaScript-accessible cookie
    res.cookie('jwt_payload', parts[2], { 
      httpOnly: false,
      sameSite: 'strict',
    });
    res.status(200).json({ 
      message: 'User succesfully created.',
      userColor,
      userRole,
    });

  } catch (error) {
    logger.error("Error 102: ", error);
    res.status(500).json({ message: 'An error occured while creating the user.' });
  }
});

function getUserInfo(req) {
  const tokenParts = req.cookies.jwt_signature.split('.');
  let payload;
  try {
    payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  } catch (error) {
    logger.error('Error parsing JWT payload: ', error);
    throw new Error('JWT payload is not valid JSON');
  }
  
  const userId = payload.id;
  const userName = payload.userName;
  return { userId, userName };
}

app.get('/api/logout-user', async (req, res) => {
  logger.info("user logging out");
  try {
    const { userId } = getUserInfo(req);
    await tribesMac('update-user-logout', userId);
    res.json({ logout: true });
  } catch (error) {
    logger.error("Error 103: ", error);
    res.status(500).json({ message: 'An error occured whilst logging the user out.' });
  }
});

// ADMIN ROUTES 
async function verifyAdmin(req, res, next) {
  if (!req.cookies.jwt_signature) {
    return next(new Error('No JWT signature found in cookies'));
  }

  const tokenParts = req.cookies.jwt_signature.split('.');
  let admin;

  try {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const dbAuth = await tribesMac('check-admin-status', payload.id);
    admin = (payload.role === 'admin' && dbAuth);
    req.admin = admin;
  } catch (error) {
    return next(new Error('Error parsing JWT payload: ' + error));
  }

  next();
}

app.get('/api/admin/admin-tools', verifyAdmin, async(req, res) => {
  try {
   const admin = req.admin;
    console.log("user is admin = ", admin);
   if (admin) {
     res.send('')
   } else {
     res.status(404).json({ message: 'Forbidden' })
   }
  } catch (error) {
    logger.error("Error 104: ", error);
    res.status(500).json({ message: 'Admin check failed.' });
  }
});

// PROTECTED ROUTES


app.get('/api/protected/get-last-tribe-logins', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const lastLogins = await tribesMac('get-last-tribe-logins', userId);
    res.send(lastLogins);
  } catch (error) {
    logger.error("Error 105: ", error);
    res.status(500).json({ message: 'An error occured whilst getting last tribe logins.' });
  }
});

app.get('/api/protected/get-inbox-message-count', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const count = await tribesMac('get-inbox-message-count', userId);
    res.send(count);
  } catch (error) {
    logger.error("Error 106: ", error);
    res.status(500).json({ message: 'An error occured whilst getting inbox message count.' });
  }
});

app.get('/api/protected/get-notifications', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const notifications = await tribesMac('get-notifications', userId);
    res.send(notifications);
  } catch (error) {
    logger.error("Error 107: ", error);
    res.status(500).json({ message: 'An error occured whilst getting notifications.' });
  }
});

app.get('/api/protected/get-inbox-messages', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const messages = await tribesMac('get-inbox-messages', userId);
    res.send(messages);
  } catch (error) {
    logger.error("Error 108: ", error);
    res.status(500).json({ message: 'An error occured whilst getting inbox messages.' });
  }
});

app.get('/api/protected/get-friends', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const friends = await tribesMac('get-friends', userId);
    res.send(friends);
  } catch (error) {
    logger.error("Error 109: ", error);
    res.status(500).json({ message: 'An error occured whilst getting friends list.' });
  }
});

app.get('/api/protected/get-applicants', async (req, res) => {
  const tribe = req.query.tribe;
  console.log("server::tribe => ", tribe);
  try {
    const result = await tribesMac('get-applicants', tribe);

    let applicants 
    if (result.rowCount === 0) {
      applicants = { user_name: 'none', application_date: 'none' };
    } else {
      applicants = result;
    }

    res.send(applicants);
  } catch (error) {
    logger.error("Error 110: ", error);
    res.status(500).json({ message: 'An error occured whilst getting applicants for invitation' });
  }
});

app.get('/api/protected/get-random-tribe-suggestions', async (req, res) => {
  try {
    const randomSuggestions = await tribesMac('get-random-tribe-suggestions');
    res.send(randomSuggestions);
  } catch (error) {
    logger.error("Error 111: ", error);
    res.status(500).json({ message: 'An error occured whilst getting random tribe suggestions.' })
  }
});

app.get('/api/protected/join-a-tribe', async (req, res) => {
  try {
    const tribesJson = await redisGeneralClient.lRange('tribes', 0, -1);
    try {
      const tribes = tribesJson.map(tribe => JSON.parse(tribe));
      res.send(tribes);
    } catch (error) {
      console.log("JSON ERROR::", error," => ", tribesJson);
      logger.error("Error 112: ", error);
      res.status(500).json({ message: 'An error occurred while getting tribes.' })
    }
  } catch (error) {
    logger.error("Error 113: ", error);
    res.status(500).json({ message: 'An error occured while getting tribes.' })
  }
});

app.get('/api/protected/get-chatroom-messages', async (req, res) => {
  const tribeUrl = req.query.tribeUrl;

  try {
    const messages = await tribesMac('get-messages', tribeUrl);
    res.send(messages);
  } catch (error) {
    logger.error("Error 114: ", error);
    res.status(500).json({ message: 'An error occured while getting chatroom messages.'});
  }
});

app.get('/api/protected/get-tribe-members', async (req, res) => {
  const tribe = req.query.tribe;
  logger.info(`request members from ${tribe}`);

  try {
    const members = await tribesMac('get-tribe-members', tribe);
    console.log("get-tribe-members::members => ", members);
    res.send(members);
  } catch (error) {
    logger.error("Error 115: ", error);
    res.status(500).json({ message: 'An error occured while fetching tribe member list.' });
  }
});

app.get('/api/protected/check-membership', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const data = { 
      userId,
      tribeName: req.query.tribe,
    };

    const result = await tribesMac('check-role', data);

    let role;
    if (result === undefined) {
      role = { member_role: 'none' };
    } else {
      role = result;
    }

    res.send(role);
  } catch (error) {
    logger.error("Error 117: ", error);
    res.status(500).json({ message: 'An error occured whilst applying for an invitation.' });
  }
});

// POST ROUTES 

app.post('/api/protected/post-notification', async (req, res) => {
  console.log("in post-notification");
  try {
    const { userId, userName } = getUserInfo(req);
    const receiverList = req.body.receiverList;
    const content = req.body.content;
    const type = req.body.type;

    const dbData = {
      type, 
      userId, 
      content, 
      receiverList,
    };

    const dbResult = await tribesMac('post-notification', dbData);

    switch (type) {
      case 'yapp':
        notificationsNameSpace.to('yapp-notifications').emit('notification', { type, userName, content } );
        break;

      case 'friends':
        console.log(`postNotification::name of room => ${userName}'s-notifications`);
        notificationsNameSpace.to(`${userName}'s-notifications`).emit('notification', { type, userName, content });
        break;

      case 'tribe':
        notificationsNameSpace.to(`${receiverList}-notifications`).emit('notification', { type, userName, content });
        break;
    }
    res.send(dbResult);
  } catch (error) {
    logger.error("Error 118: ", error);
    res.status(500).json({ message: 'An error occured whilst posting notification.' });
  }
});

app.post('/api/protected/apply-for-invitation', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);

    const data = { 
      userId,
      tribeName: req.body.tribeName,
    };

    const rowCount = await tribesMac('apply-for-invitation', data);
    const result = { rowCount };
    logger.info(result);
    res.send(result);
  } catch (error) {
    logger.error("Error 119: ", error);
    res.status(500).json({ message: 'An error occured whilst applying for an invitation.' });
  }
});

app.post('/api/protected/report-user-incident', upload.none(), async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const uneditedUserArr = req.body.involvedUsers.split(',');
    const involvedUsers = uneditedUserArr.map((user) => user.replace(' ', ''));

    if (involvedUsers[involvedUsers.length - 1] === '') {
      involvedUsers.pop();
    }

    const data = { 
      incidentDescription: req.body.incidentDescription,
      incidentType: req.body.incidentType,
      involvedUsers,
      userId,
    };

    const rowCount = await tribesMac('report-user-incident', data);
    const result = { rowCount };
    logger.info(result);
    res.send(result);
  } catch (error) {
    logger.error("Error 120: ", error);
    res.status(500).json({ message: 'An error occured whilst reporting user incident.' });
  }
});

app.post('/api/protected/send-inbox-message', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);

    const data = { 
      newMsg: req.body.msgData.newMsg,
      receiverName: req.body.msgData.receiverName,
      userId,
    };
    const msgData = await tribesMac('send-inbox-message', data);
    
    const { receiver_id, ...toSend } = msgData;
    const receiverSocketId = await redisGeneralClient.get(receiver_id.toString());
    notificationsNameSpace.to(receiverSocketId).emit('new-inbox-message', toSend);
    logger.info(toSend);
    res.status(200).json({ message: 'Message sent!' });
  } catch (error) {
    logger.error("Error 121: ", error);
    res.status(500).json({ message: 'An error occured whilst sending inbox message.' });
  }
});

app.post('/api/protected/reply-to-inbox-message', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);

    const data = { 
      parentMsgId: req.body.parentMsgId,
      newMsg: req.body.newMsg,
      userId,
    };
    console.log("server::data => ", data);
    const result = await tribesMac('reply-to-inbox-message', data);
    logger.info(result);
    res.send(result);
  } catch (error) {
    logger.error("Error 122: ", error);
    res.status(500).json({ message: 'An error occured whilst getting inbox messages.' });
  }
});

app.post('/api/protected/create-a-tribe', upload.single('tribeIcon'), async (req, res) => {
  const { userId } = getUserInfo(req);

  const privacyChoice = req.body.tribePrivacy === 'private';
  req.body.tribePrivacy = privacyChoice;
  const tribeData = { userId, ...req.body };

  if (req.file === undefined) {
    try {
      const { newTribeName, tribeId } = await tribesMac('create-tribe', tribeData);
      logger.info(`tribe formed with tribeID = ${tribeId} and tribeName = ${newTribeName}`);
      
      try {
        const foundingMemberData = { userId, tribeId, memberRole: 'founder' };
        await tribesMac('add-user-to-tribe-members', foundingMemberData);
        updateTribeCache();
        res.status(200).json({ newTribeName });
      } catch (error) {
        logger.error("Error 123: ", error);
        res.status(500).json({ message: 'An error occurred while creating the tribe.' });
      }
    } catch (error) {
      logger.error("Error 124: ", error);
      res.status(500).json({ message: 'An error occurred while creating the tribe.' });
    }
  } else {
    const icon = req.file.buffer.toString('base64');
    const dataWithIcon = { ...tribeData, icon }; 
    try {
      const { newTribeName, tribeId } = await tribesMac('create-tribe', dataWithIcon);
      logger.info(`tribe formed with tribeID = ${tribeId} and tribeName = ${newTribeName}`);

      try {
        const foundingMemberData = { userId, tribeId, memberRole: 'founder' };
        await tribesMac('add-user-to-tribe-members', foundingMemberData);
        updateTribeCache();
        res.status(200).json({ newTribeName });
      } catch (error) {
        logger.error("Error 125: ", error);
        res.status(500).json({ message: 'An error occurred while creating the tribe.' });
      }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: 'An error occurred while creating the tribe.' });
    }
  }
});

// DELETE ROUTES 

app.delete('/api/protected/delete-inbox-message', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const data = { msgIds: req.body.msgIds, userId };
    const messages = await tribesMac('delete-inbox-message', data);
    logger.info("delete-user-message::messages");
    logger.info(messages);
    res.send(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured whilst getting inbox messages.' });
  }
});

// PATCH ROUTES 

app.patch('/api/protected/update-tribe-member-login', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const patchData = { timestamp, tribe, userId };
    const result = await tribesMac('update-tribe-member-login', patchData);
    logger.info(result);
    res.status(201).json({ message: 'Login data succesfully updated.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while updating login data.' });
  }
});

app.patch('/api/protected/update-tribe-member-logout', async (req, res) => {
  try {
    const { userId } = getUserInfo(req);
    const { timestamp, tribe } = req.body;
    const patchData = { timestamp, tribe, userId };
    const result = await tribesMac('update-tribe-member-logout', patchData);
    logger.info(result);
    res.status(201).json({ message: 'Logout data succesfully updated.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while updating logout data.' });
  }
});

function verifyJWT(req, res, next) {
  const header = req.cookies['jwt_signature'];
  const payload = req.cookies['jwt_payload'];

  if (!header || !payload) {
    console.log("No token");
    return next();
  }

  const token = `${header}.${payload}`;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;
    req.userName = decoded.userName;
    next();
  } catch (error) {
    logger.error("Error 126: ", error);
    next();
  }
}

app.get('*', verifyJWT, async (req, res) => {
  if (req.url.startsWith('/api')) {
    logger.warn('User tried to access unknown API route');
    res.status(404).send('Route not found');
  } else {
    if (req.url.startsWith('/socket.io')) {
      logger.info("socket connection");
      res.sendStatus(200);
    } else {
      logger.info("non-socket connection");
      try {
        if (req.userId !== undefined && req.userName !== undefined) {
          res.sendFile(path.resolve(__dirname, 'dist', 'main.html'));
        } else {
          logger.info("user name and userId missing");
          res.sendFile(path.resolve(__dirname, 'dist', 'login.html'));
        }
      } catch (error) {
        logger.error("Error 127: ", error);
        res.status(500).send('An error occurred');
      }
    }
  }
});

app.use('/', function(err, req, res) {
  console.log('reached generic error response.');
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

httpServer.listen(process.env.SERVER_PORT || port, () => logger.info(`Server is running on port ${port}`));

