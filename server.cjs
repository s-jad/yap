const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.SERVER_PORT;
const config = require('./webpack.config.cjs');
const compiler = webpack(config);

const { tribesMac } = require('./src/backend/tribes_mac.cjs');

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

app.use('/', express.static(path.join(__dirname, '/')));
app.use('/assets/imgs', express.static(path.join(__dirname, '/assets/imgs')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// SEND TRIBE_DB DATA TO TO GRID
app.get('/api/join-a-tribe', async (req, res) => {
  const tribes = await tribesMac('get-tribes');
  res.send(tribes);
});

app.get('/api/get-chatroom-messages', async (req, res) => {
  const tribeUrl = req.query.tribeUrl;
  console.log("SERVER::tribeUrl => ", tribeUrl);
  
  const messages = await tribesMac('get-messages', tribeUrl);
  res.send(messages);
});

// CREATE A TRIBE
app.post('/api/create-a-tribe', async (req, res) => {
  try {
    const tribe = await tribesMac('create-tribe', req.body);
    res.status(201).json(tribe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the tribe.' });
  }
});

app.post('/api/report-user-issue', (req, res) => {
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
