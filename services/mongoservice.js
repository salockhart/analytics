const { MongoClient } = require('mongodb');

const connect = () => new Promise((resolve, reject) => {
  MongoClient.connect(process.env.MONGO_URL, (connectErr, client) => {
    if (connectErr) {
      return reject(connectErr);
    }
    resolve(client);
  });
});

module.exports = {
  connect,
};
