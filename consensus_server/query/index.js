const process = require("process");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const { host, port } = require("../config.json").http;
const Mysql = require("../mysql");

const log4js= require("../logConfig");
const logger = log4js.getLogger();

process[Symbol.for("loggerMysql")] = log4js.getLogger("mysql");
process[Symbol.for("loggerQuery")] = log4js.getLogger("query");
process[Symbol.for("mysql")] = new Mysql();

// express
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));
app.use(cors({
  credentials: true, 
  origin: 'http://localhost:8080'
}));

process[Symbol.for('app')] = app;

require('./block_chain');
require('./resource');

log4js.useLogger(app, logger);

//
const server = app.listen(port, host, function() {
    logger.info(`query server listening at http://${host}:${port}`);
});

