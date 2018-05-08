const express = require('express');
const bcrypt = require('bcrypt');

const userService = require('../services/userservice');
const tokenService = require('../services/tokenservice');

const router = express.Router();

router.use('/me', (req, res, next) => {
  const token = (req.headers.authorization || '').substring(7);
  tokenService.verify(token)
    .then((userToken) => {
      req.user = userToken;
      next();
    })
    .catch((err) => {
      console.error(err);
      return res.sendStatus(401);
    });
});

router.post('/login', (req, res) => {
  userService.getUser(req.body.username)
    .then((user) => {
      bcrypt.compare(req.body.password, user.password)
        .then((authed) => {
          if (authed) {
            return tokenService.sign({
              username: user.username,
              collections: user.collections,
            });
          }
          throw new Error('not authenticated');
        })
        .then((token) => {
          res.send(token);
        })
        .catch((err) => {
          console.error(err);
          res.sendStatus(401);
        });
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.put('/me/queries/:collectionName/:queryID', (req, res) => {
  userService.setQuery(req.user.username, req.params.collectionName, req.params.queryID, req.body)
    .then((result) => {
      if (!result) {
        return res.sendStatus(404);
      }
      return userService.getQueries(
        req.user.username,
        req.params.collectionName,
        req.params.queryID,
      );
    })
    .then((query) => {
      return res.send(query);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/me/queries/:collectionName/:queryID', (req, res) => {
  userService.getQueries(req.user.username, req.params.collectionName, req.params.queryID)
    .then((query) => {
      if (!query) {
        return res.sendStatus(404);
      }

      return res.send(query);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.post('/me/queries/:collectionName', (req, res) => {
  userService.setQuery(req.user.username, req.params.collectionName, null, req.body)
    .then((result) => {
      if (!result) {
        return res.sendStatus(404);
      }
      return userService.getQueries(req.user.username, req.params.collectionName);
    })
    .then((query) => {
      return res.send(query);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/me/queries/:collectionName', (req, res) => {
  userService.getQueries(req.user.username, req.params.collectionName)
    .then((queries) => {
      if (!queries) {
        return res.sendStatus(404);
      }

      return res.send(queries);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/me/queries', (req, res) => {
  userService.getQueries(req.user.username)
    .then((queries) => {
      if (!queries) {
        return res.sendStatus(404);
      }

      return res.send(queries);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/me/analytics', (req, res) => {
  userService.resolveQueries(req.user.username)
    .then((queries) => {
      res.send(queries);
    }).catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

module.exports = router;
