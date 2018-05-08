const express = require('express');
const trackingService = require('../services/trackingservice');

const router = express.Router();

router.use('/:siteID', (req, res) => {
  const document = Object.assign({}, req.body, {
    datetime: new Date(),
  });

  trackingService.track(req.params.siteID, document)
    .then((result) => {
      res.status(200).send(result.insertedId);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

module.exports = router;
