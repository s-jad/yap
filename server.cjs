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
const { redisClient } = require('./src/backend/redis-client.cjs');

redisClient.on('ready', function() {
  logger.info('Redis client is ready');
});

const app = express();

app.use(connectLiveReload());

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

app.use('/', express.static(path.join(__dirname, '/')));
app.use('/assets/imgs', express.static(path.join(__dirname, '/assets/imgs')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.REDIS_KEY,
  resave: false,
  saveUninitialized: true,
  // change to https to use secure true
  cookie: { secure: false }
}));

app.get('/', function(req, res) {
  redisClient.getAsync('numVisits', function(err, numVisits) {
    if (err) {
       logger.error(err);
       res.status(500).send('An error occurred while getting the number of visits');
       return;
    }
    numVisitsToDisplay = parseInt(numVisits) + 1;
    if (isNaN(numVisitsToDisplay)) {
      numVisitsToDisplay = 1;
    }
    logger.info(`Number of visits: ${numVisitsToDisplay}`);
    res.send('Number of visits is: ' + numVisitsToDisplay);
    numVisits++;
    redisClient.setAsync('numVisits', numVisits, function(err) {
      if (err) {
        logger.error(err);
        res.status(500).send('An error occurred while setting the number of visits');
      }
    });
  });
});

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
          userId,
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

app.post('/api/protected/delete-inbox-message', async (req, res) => {
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

app.post('/api/protected/post-message', async (req, res) => {
  try {
    await tribesMac('post-message', req.body);
    res.status(201).json({ message: 'Message succesfully posted.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'An error occured while posting message.' });
  }
})


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

app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    logger.error('User tried to access unknown API route');
    res.status(404).send('API route not found');
  } else {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  }
});

app.use('/', function(err, req, res) {
  logger.warn("Request failed => ", req);
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(process.env.SERVER_PORT || port, () => logger.info(`Server is running on port ${port}`));
