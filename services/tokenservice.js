const jwt = require('jsonwebtoken');

const verify = token => new Promise((resolve, reject) => {
  jwt.verify(token, process.env.JWT_SECRET, (verifyErr, decodedToken) => {
    if (verifyErr) {
      return reject(verifyErr);
    }
    resolve(decodedToken);
  });
});

const sign = payload => new Promise((resolve, reject) => {
  return jwt.sign(payload, process.env.JWT_SECRET, (signErr, token) => {
    if (signErr) {
      return reject(signErr);
    }
    resolve(token);
  });
});

module.exports = {
  verify,
  sign,
};
