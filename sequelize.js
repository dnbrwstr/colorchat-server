require('dotenv').load();

module.exports = {
  logging: console.log,
  url: process.env.DATABASE_URL
};
