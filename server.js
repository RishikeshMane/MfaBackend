const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const server = express();
const serviceLocator = require('./app/lib/service_locator');
const logger = serviceLocator.get('logger');
const config = serviceLocator.get('configs');
const router = require('./app/router/Router');
const Database = require('./dbConnection').promise();

var corsOptions = {
  credentials: true,
  origin: ["https://[production-domain.com]", "http://localhost:3000"]
};

server.use(cors(corsOptions));

server.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');

  next();
});

server.use(express.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

server.use('/api', router);

let startAt = '';

server.use(
  bodyParser.json({
    type: '*/*',
  })
);

const startServer = async () => {
  server.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    res.status(err.statusCode).json({
      message: err.message,
    });
  });

  process.on('uncaughtException', err => {
    logger.error('Caught global exception');
    logger.debug(err);
    // eslint-disable-next-line no-process-exit
    Number(config.app.coredump) ? process.abort() : process.exit(1);
  });

  Database.getConnection(function (err) {
    if (err) {
      return res.send('Error occured');
    }
  });
  logger.info('Start listening on server changes');
  const PORT = 5005;

  server.get('/', function (req, res) {
    let current = new Date();
    let uptime = Math.abs(current - startAt) / 36e5;
    let server = {
      started: startAt,
      uptime: uptime,
      status: 'OK',
    };
    res.send(server);
  });

  server.listen(PORT, () => logger.info('Server is running on port - ' + PORT));
};

startServer();
