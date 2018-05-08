const mongoService = require('./mongoservice');

const track = (id, payload) => new Promise((resolve, reject) => {
  mongoService.connect().then((client) => {
    const db = client.db();
    const collection = db.collection(id);

    collection.insertOne(payload, (insertError, result) => {
      client.close();
      if (insertError) {
        return reject(insertError);
      }
      resolve(result);
    });
  });
});

module.exports = {
  track,
};
