const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const liveReload = require('livereload');
const connectLiveReload = require('connect-livereload');
const session = require('express-session');
const RedisStore = require('connect-redis').default;

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
const { redisClient } = require('./src/backend/redis-client.cjs');

redisClient.on('ready', function() {
  logger.info('Redis client is ready');
});

backupChatMessages(redisClient);
logger.info('Chat message backup is ready');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');

const io = new Server(httpServer, {
  cors: {
    origin: process.env.SERVER_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['*'],
    credentials: true,
  },
});

async function handleTribeLoginDbUpdate(socket, chatroom) {
  console.log("inside handleTribeLoginDbUpdate");
  try {
    const member = socket.decoded.id;
    const tribe = chatroom;
    const timestamp = new Date().toISOString();
    const patchData = { timestamp, tribe, member };
    const res = await tribesMac('update-tribe-member-login', patchData);
    console.log("result of login => ", res);
  } catch (error) {
    console.error(`Error updating ${member} login of ${tribe}`);
  }
}

async function handleTribeLogoutDbUpdate(socket, chatroom) {
  console.log("inside handleTribeLogoutDbUpdate");
  try {
    const member = socket.decoded.id;
    const tribe = chatroom;
    const timestamp = new Date().toISOString();
    const patchData = { timestamp, tribe, member };
    const res = await tribesMac('update-tribe-member-logout', patchData);
    console.log("result of logout => ", res);
  } catch (error) {
    console.error(`Error updating ${member} logout of ${tribe}`);
  }
}

io.on("connection_error", (err) => {
  logger.error(err.req);
  logger.error(err.code);
  logger.error(err.message);
  logger.error(err.context);
});

io.use(function(socket, next) {
  if (socket.request.headers.cookie){
    console.log(socket.request.headers);
    const cookies = socket.request.headers.cookie;
    const parts = cookies.split(';');
    const signature = parts[1].split('=')[1];
    const payload = parts[2].split('=')[1];
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
});

io.on('connection', (socket) => {
  try {
    console.log(`A new client connected: ${socket.id}`);
    socket.emit('connection', { message: `A new client has connected! with socket id of ${socket.id}`});
  } catch (error) {
    console.log(`Error connecting client: ${error}`);
  }

  socket.use((packet, next) => {
    console.log('Received packet: ', packet);
    next();
  });
  
  // For page refreshes
  const referer = socket.request.headers.referer
  if (referer.includes('/tribe-chat')) {
    const tribe = referer.slice(referer.lastIndexOf('/'), referer.length);

    const chatroom = tribe
      .replace(/-([a-z])/g, function(g) { return ' ' + g[1].toUpperCase(); })
      .replace(/\/([a-z])/g, function(g) { return '' + g[1].toUpperCase(); });
  

    if (!socket.rooms.has(chatroom)) {
      try {
        console.log("joining chatroom via page refresh");
        socket.join(chatroom);
        console.log(`Socket ${socket.id} joined chatroom ${chatroom}`);
        handleTribeLoginDbUpdate(socket, chatroom);
      } catch (error) {
        console.log(`Error joining ${chatroom}: ${error}`);
      }
    }
  }

  socket.on('join chatroom', (chatroom) => {
    if (!socket.rooms.has(chatroom)) {
      try {
        console.log("joining chatroom via page socket.on('join chatroom')");
        socket.join(chatroom);
        console.log(`Socket ${socket.id} joined chatroom ${chatroom}`);
        handleTribeLoginDbUpdate(socket, chatroom);
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
    } catch (error) {
      console.log(`Error leaving ${chatroom}: ${error}`);
    }
  })

  socket.on('message', (data) => {
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
        console.log("msgKey =>", msgKey);
        console.log('msgStr =>', msgStr);
        redisClient.set(msgKey, msgStr);

        io.to(tribe_name).emit('message', msgStr);

      } catch (error) {
        logger.error(`Error parsing JSON => ${error}`);
      }
    }
  });

  socket.on('user disconnect', () => {
    console.log(`Disconnecting socket id: ${socket.id}`);
    socket.disconnect()
  });

});

// FOR DEBUGGING!
app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  next();
});

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

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.REDIS_KEY,
  resave: false,
  saveUninitialized: true,
  // change to https to use secure true
  cookie: { 
    secure: false,
    sameSite: 'strict',
  }
}));

app.use('/api/protected', authorization);

app.post('/api/authenticate-user', async (req, res) => {
  const username = req.body.user;
  const password = req.body.pw;

  try {
    const userData = await tribesMac('get-password', username);
    const { userId, passwordHash, userColor } = userData;

    try {
      const authenticated = await comparePwHash(password, passwordHash);

      if (!authenticated) {
        res.status(401).json({ message: 'Incorrect Password.' })    
      } else {
        const token = jwt.sign({ userName: username, id: userId }, jwtSecret, { expiresIn: '3h' });
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
          message: 'Login Succesful.',
          userColor,
        });
      } 
    } catch (error) {
      if (error.message === 'Password does not match.') {
        logger.info('User entered a password that failed comparePwHash');
        res.status(401).json({ message: 'Incorrect Password.' });
      } else {
        logger.error(error);
        res.status(500).json({ message: 'An error occured.' });
      }
    }

  } catch (error) {
    if (error.message === 'Username or password are incorrect.') {
      logger.info('User entered an incorrect username or password');
      res.status(401).json({ message: 'Incorrect username or password.' });
    } else {
      logger.error(error);
      res.status(500).json({ message: 'Database Error.' });
    }
  }
});

app.post('/api/create-user', async (req, res) => {
  try {
    const { username, userId, userColor } = await tribesMac('create-user', req.body);

    const token = jwt.sign({ userName: username, id: userId }, jwtSecret, { expiresIn: '3h' });
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
      userId,
      userColor
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while creating the user.' });
  }
});

// PROTECTED ROUTES

app.get('/api/protected/get-last-tribe-logins', async (req, res) => {
  try {
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const userId = payload.id;
    const lastLogins = await tribesMac('get-last-tribe-logins', userId);
    res.send(lastLogins);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured whilst getting last tribe logins.' });
  }
});

app.get('/api/protected/get-inbox-message-count', async (req, res) => {
  try {
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const userId = payload.id;
    console.log("get-inbox-message-count::userId => ", userId);
    const count = await tribesMac('get-inbox-message-count', userId);
    console.log("get-inbox-message-count::count => ", count);
    res.send(count);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured whilst getting inbox message count.' });
  }
});

app.get('/api/protected/get-inbox-messages', async (req, res) => {
  try {
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const userId = payload.id;
    const messages = await tribesMac('get-inbox-messages', userId);
    res.send(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured whilst getting inbox messages.' });
  }
});


app.get('/api/protected/get-random-tribe-suggestions', async (req, res) => {
  try {
    const randomSuggestions = await tribesMac('get-random-tribe-suggestions');
    res.send(randomSuggestions);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured whilst getting random tribe suggestions.' })
  }
});

app.get('/api/protected/join-a-tribe', async (req, res) => {
  try {
    const tribes = await tribesMac('get-tribes');
    res.send(tribes);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while getting tribes.' })
  }
});

app.get('/api/protected/get-chatroom-messages', async (req, res) => {
  const tribeUrl = req.query.tribeUrl;

  try {
    const messages = await tribesMac('get-messages', tribeUrl);
    res.send(messages);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while getting chatroom messages.'});
  }
});

app.get('/api/protected/get-tribe-members', async (req, res) => {
  const tribe = req.query.tribe;
  logger.info(`request members from ${tribe}`);

  try {
    const members = await tribesMac('get-tribe-members', tribe);
    res.send(members);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while fetching tribe member list.' });
  }
});

// POST ROUTES 

app.post('/api/protected/reply-to-inbox-message', async (req, res) => {
  try {
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const userId = payload.id;
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
    logger.error(error);
    res.status(500).json({ message: 'An error occured whilst getting inbox messages.' });
  }
});

app.post('/api/protected/post-message', async (req, res) => {
  try {
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const sender = payload.id;
    const postData = { ...req.body, sender };
    await tribesMac('post-message', postData);
    res.status(201).json({ message: 'Message succesfully posted.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while posting message.' });
  }
});


app.post('/api/protected/create-a-tribe', async (req, res) => {
  try {
    const tribe = await tribesMac('create-tribe', req.body);

    res.status(200).json({ tribe });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occurred while creating the tribe.' });
  }
});

app.post('/api/protected/report-user-issue', (req, res) => {
  logger.info(req.body);
  res.send(`form data received ${req.body}`);
});

// DELETE ROUTES 

app.delete('/api/protected/delete-inbox-message', async (req, res) => {
  try {
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const userId = payload.id;
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
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const { timestamp, tribe } = req.body;
    const member = payload.id;
    const patchData = { timestamp, tribe, member };
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
    const tokenParts = req.cookies.jwt_signature.split('.');
    let payload;
    try {
      payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (error) {
      logger.error('Error parsing JWT payload: ', error);
      throw new Error('JWT payload is not valid JSON');
    }
    const { timestamp, tribe } = req.body;
    const member = payload.id;
    const patchData = { timestamp, tribe, member };
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
    logger.info(error);
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
        logger.error(error);
        res.status(500).send('An error occurred');
      }
    }
  }
});

app.use('/', function(err, req, res) {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

httpServer.listen(process.env.SERVER_PORT || port, () => logger.info(`Server is running on port ${port}`));
