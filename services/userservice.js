const { ObjectId } = require('mongodb');
const mongoService = require('./mongoservice');

const getUser = (username) => {
  return mongoService.connect()
    .then((client) => {
      const db = client.db();
      const collection = db.collection('users');

      return new Promise((resolve, reject) => {
        collection.findOne({
          username,
        }, (findErr, result) => {
          client.close();
          if (findErr) {
            return reject(findErr);
          }
          resolve(result);
        });
      });
    });
};

const addCollection = (username, collectionName) => {
  return mongoService.connect()
    .then((client) => {
      const db = client.db();
      const collection = db.collection('users');

      return new Promise((resolve, reject) => {
        collection.updateOne({
          username,
        }, {
          $set: {
            [`queries.${collectionName}`]: [],
          },
        }, (findErr, result) => {
          client.close();
          if (findErr) {
            return reject(findErr);
          }
          resolve(result);
        });
      });
    });
};

const setQuery = (username, collectionName, queryID, update) => {
  const document = update;

  // eslint-disable-next-line no-underscore-dangle
  document._id = new ObjectId(update._id || queryID);
  document.query = JSON.stringify(update.query);

  return getUser(username)
    .then((user) => {
      const collectionExists = Object.keys(user.queries).includes(collectionName);

      let collectionCreationPromise = Promise.resolve();
      if (!collectionExists) {
        collectionCreationPromise = addCollection(username, collectionName);
      }

      return collectionCreationPromise;
    })
    .then(() => mongoService.connect())
    .then((client) => {
      const db = client.db();
      const collection = db.collection('users');

      if (!queryID) {
        return new Promise((resolve, reject) => {
          collection.updateOne({
            username,
          }, {
            $addToSet: {
              [`queries.${collectionName}`]: document,
            },
          }, (findErr, result) => {
            client.close();
            if (findErr) {
              return reject(findErr);
            }
            resolve(result);
          });
        });
      }

      return new Promise((resolve, reject) => {
        collection.updateOne({
          username,
          [`queries.${collectionName}._id`]: new ObjectId(queryID),
        }, {
          $set: {
            [`queries.${collectionName}.$`]: document,
          },
        }, (findErr, result) => {
          client.close();
          if (findErr) {
            return reject(findErr);
          }
          resolve(result);
        });
      });
    });
};

const getQueries = (username, collectionName, queryID) => {
  return getUser(username)
    .then((user) => {
      const queries = Object.keys(user.queries).map(collection => ({
        collection,
        queries: user.queries[collection].map(query => Object.assign({}, query, {
          query: JSON.parse(query.query),
        })),
      }));

      if (collectionName) {
        const collectionQueries = queries
          .filter(collection => collection.collection === collectionName)
          .map(collection => collection.queries);
        if (queryID && collectionQueries) {
          // eslint-disable-next-line no-underscore-dangle,no-shadow
          const query = collectionQueries[0].find(query => query._id.toString() === queryID);
          return query;
        }
        return collectionQueries[0];
      }
      return queries;
    });
};

const postProcessDate = (data) => {
  const processed = [];

  const tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
  tomorrow.setHours(0);
  tomorrow.setMinutes(0);
  tomorrow.setSeconds(0);
  tomorrow.setMilliseconds(0);
  const earliestDate = data
    .map(point => new Date(point._id.year, point._id.month - 1, point._id.day))
    .reduce((prev, current) => {
      return current < prev ? current : prev;
    });

  for (let date = earliestDate; date < tomorrow; date = new Date(date.getTime() + (24 * 60 * 60 * 1000))) {
    const dataPoint = data.find(point => point._id.year === date.getUTCFullYear() && point._id.month === date.getUTCMonth() + 1 && point._id.day === date.getUTCDate());
    processed.push(dataPoint || {
      _id: {
        day: date.getUTCDate(),
        month: date.getUTCMonth() + 1,
        year: date.getUTCFullYear(),
      },
      num: 0,
    });
  }

  return processed.map(point => ({
    _id: `${point._id.year}-${point._id.month}-${point._id.day}`,
    num: point.num,
  }));
};

const postProcessDiscrete = (data) => {
  return data;
};

const resolveQueries = (username) => {
  return Promise.all([mongoService.connect(), getQueries(username)])
    .then((tuple) => {
      const client = tuple[0];
      const db = client.db();
      const queries = tuple[1];
      return Promise.all(queries.map((pair) => {
        return Promise.all(pair.queries.map((query) => {
          const collection = db.collection(pair.collection);
          return new Promise((resolve, reject) => {
            collection.aggregate(query.query, (err, result) => {
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
          }).then((data) => {
            let processedData = data;
            switch (query.type) {
              case 'date':
                processedData = postProcessDate(data);
                break;
              case 'discrete':
                processedData = postProcessDiscrete(data);
                break;
              default:
                break;
            }
            return Object.assign({}, query, {
              data: processedData,
            });
          });
        })).then((collectionData) => {
          return {
            collection: pair.collection,
            data: collectionData,
          };
        });
      }));
    });
};

module.exports = {
  getUser,
  getQueries,
  setQuery,
  resolveQueries,
};
