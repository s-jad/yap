const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use('/', express.static('./src/frontend/pages/'));
app.use('/', express.static('./src/frontend/styles/'));
app.use('/', express.static('./src/frontend/components/'));
// TODO: figure out what this should be when not in a dev env

const corsOptions = {
  origin: 'http://localhost:8080'
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
console.log("corsOptions => ", corsOptions);

app.get('/', (req, res) => {
  console.log('req for / => ', req);
  res.send('Welcome to the index page!');
});

app.get('/report-user-issue', (req, res) => {
  console.log('req for /report-user-issue => ', req);
  const filePath = path.join(__dirname, 'src/frontend/pages/report-user-issue.html');
  console.log(filePath);
  res.sendFile(filePath);
});

app.listen(process.env.PORT || port, () => console.log(`Server is running on port ${port}`));
