const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const port = process.env.SERVER_PORT;
const jwtSecret = process.env.JWT_SECRET;

const config = require('./webpack.config.cjs');
const compiler = webpack(config);
const { authorization } = require('./src/backend/auth.cjs');
const { tribesMac } = require('./src/backend/tribes_mac.cjs');
const { comparePwHash } = require('./src/backend/pw_encryption.cjs');
const { strict } = require('assert');

const app = express();

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
app.use('/api/protected', authorization);

app.post('/api/authenticate-user', async (req, res) => {
  const username = req.body.user;
  const password = req.body.pw;
  try {
    const passwordHash = await tribesMac('get-password', username);

    try {
      const authenticated = await comparePwHash(password, passwordHash);

      if (!authenticated) {
        res.status(401).json({ message: 'Incorrect Password.' })    
      } else {
        const token = jwt.sign({ id: username }, jwtSecret, { expiresIn: '3h' });
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

        res.status(200).json({ token });
      } 
    } catch (error) {
      if (error.message === 'Password does not match.') {
        res.status(401).json({ message: 'Incorrect Password.' });
      } else {
        console.error(error);
        res.status(500).json({ message: 'An error occured.' });
      }
    }

  } catch (error) {
    if (error.message === 'Username or password are incorrect.') {
      res.status(401).json({ message: 'Incorrect username or password.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Database Error.' });
    }
  }
});

// SEND TRIBE_DB DATA TO TO GRID
app.get('/api/protected/join-a-tribe', async (req, res) => {
  const tribes = await tribesMac('get-tribes');

  res.send(tribes);
});

app.get('/api/protected/get-chatroom-messages', async (req, res) => {
  const tribeUrl = req.query.tribeUrl;
  const messages = await tribesMac('get-messages', tribeUrl);

  res.send(messages);
});


// CREATE A TRIBE
app.post('/api/protected/create-a-tribe', async (req, res) => {
  try {
    const tribe = await tribesMac('create-tribe', req.body);
    res.status(201).json(tribe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the tribe.' });
  }
});

app.post('/api/protected/report-user-issue', (req, res) => {
  console.log(req.body);
  res.send(`form data received ${req.body}`);
});

app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    res.status(404).send('API route not found');
  } else {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  }
});

app.use(function(err, req, res, next) {
  console.warn("Request failed => req");
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(process.env.SERVER_PORT || port, () => console.log(`Server is running on port ${port}`));
