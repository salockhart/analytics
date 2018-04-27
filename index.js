const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/dashboard/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '/dashboard/dashboard.html'));
});

app.post('/auth/login', (req, res) => {
  MongoClient.connect(process.env.MONGO_URL, (connectErr, client) => {
    const db = client.db();
    const collection = db.collection('users');

    collection.findOne({
      username: req.body.username,
    }, (findErr, result) => {
      client.close();
      if (findErr) {
        console.error(findErr);
        res.sendStatus(401);
      }
      bcrypt.compare(req.body.password, result.password, (bcryptErr, authed) => {
        if (bcryptErr) {
          console.error(bcryptErr);
          res.sendStatus(401);
        }
        if (authed) {
          return jwt.sign({
            username: result.username,
            collections: result.collections,
          }, process.env.JWT_SECRET, (jwtErr, token) => {
            res.send(token);
          });
        }
        res.sendStatus(401);
      });
    });
  });
});

function getAnalytics(db, collectionName, query) {
  const collection = db.collection(collectionName);
  return new Promise((resolve, reject) => {
    collection.aggregate(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      result.toArray((arrayErr, arr) => {
        if (arrayErr) {
          return reject(arrayErr);
        }
        resolve(arr);
      });
    });
  });
}

app.get('/analytics', (req, res) => {
  const token = req.headers.authorization.substring(7);
  jwt.verify(token, process.env.JWT_SECRET, (verifyErr, decodedToken) => {
    if (verifyErr) {
      return res.sendStatus(401);
    }
    MongoClient.connect(process.env.MONGO_URL, (connectErr, client) => {
      if (connectErr) {
        return res.sendStatus(500);
      }
      const db = client.db();
      const usersCollection = db.collection('users');
      usersCollection.findOne({
        username: decodedToken.username,
      }, (findErr, user) => {
        if (findErr) {
          return res.sendStatus(404);
        }

        const queries = Object.keys(user.queries).map(collection => ({
          collection,
          queries: user.queries[collection].map(query => ({
            name: query.name,
            query: JSON.parse(query.query),
          })),
        }));

        Promise.all(queries.map((pair) => {
          return Promise.all(pair.queries.map((query) => {
            return getAnalytics(db, pair.collection, query.query)
              .then((data) => {
                return {
                  name: query.name,
                  data,
                };
              });
          })).then((collectionData) => {
            return {
              collection: pair.collection,
              data: collectionData,
            };
          });
        })).then((results) => {
          res.send(results);
        }).catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
      });
    });
  });
});

app.post('/track/:siteID', (req, res) => {
  MongoClient.connect(process.env.MONGO_URL, (connectErr, client) => {
    const db = client.db();
    const collection = db.collection(req.params.siteID);

    const document = Object.assign({}, req.body, {
      ip: req.ip,
      datetime: new Date(),
    });

    collection.insertOne(document, (insertError, result) => {
      client.close();
      if (insertError) {
        res.sendStatus(500);
      }
      res.status(200).send(result.insertedId);
    });
  });
});

app.listen(port, () => {
  /* eslint no-console: off */
  console.log(`Listening on port ${port}`);
});
