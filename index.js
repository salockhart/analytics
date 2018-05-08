const express = require('express');

const dashboardcontroller = require('./controllers/dashboardcontroller');
const usercontroller = require('./controllers/usercontroller');
const trackingcontroller = require('./controllers/trackingcontroller');

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

app.use('/', dashboardcontroller);
app.use('/user', usercontroller);
app.use('/track', trackingcontroller);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${port}`);
});
