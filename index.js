const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();

const port = (process.env.PORT || 3000);
app.set('port', port);

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.enable('trust proxy');

app.post('/track/:siteID', (req, res) => {
  MongoClient.connect(process.env.MONGO_URL, (err, client) => {
    const db = client.db();
    const collection = db.collection(req.params.siteID);

    const document = Object.assign({}, req.body, {
      ip: req.ip,
    });

    collection.insertOne(document, (error, result) => {
      client.close();
      if (error) {
        res.sendStatus(500);
      }
      res.status(200).send(result.insertedId);
    });
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
