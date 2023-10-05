const { config } = require('dotenv');

const { Client } = require('pg');
const  path = require('path');
const envPath = path.resolve(__dirname, '../../.env');

config({ path: envPath });

const pg_client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

pg_client.connect();

module.exports = {
  pg_client,
};

