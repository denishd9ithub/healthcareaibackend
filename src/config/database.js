const mongoose = require('mongoose');
const config = require('./env');

function connect() {
  return mongoose.connect(config.mongodbUri);
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

module.exports = { connect, mongoose };
