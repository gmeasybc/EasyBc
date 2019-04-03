const express = require("express");
const path = require("path");
const db = require("./backend/db");
const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../constant");
const {getTransactionState, getAccountInfo, getLastestBlock} = require("./backend/chat");
const utils = require("../depends/utils");
const { port, host } = require("./config.json");

const log4js= require("./logConfig");
const logger = log4js.getLogger();
const errlogger = log4js.getLogger("err");
const othlogger = log4js.getLogger("oth");

const Buffer = utils.Buffer;
const BN = utils.BN;

const app = express();
log4js.useLogger(app, logger);
app.use("/", express.static(path.join(__dirname + "/dist")));

const server = app.listen(port, host, function() {
    logger.info(`server listening at http://${host}:${port}`);
});

app.get("/generateKeyPiar", function(req, res) {
  db.generateKeyPiar().then(() => {
    res.send({
        code: SUCCESS
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});

app.get("/getPrivateKey", function(req, res) {
  if(!req.query.address) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need address"
    });
  }

  db.getPrivateKey(req.query.address).then(privateKey => {
    res.send({
        code: SUCCESS,
        data: privateKey
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
})

app.get("/getFromHistory", function(req, res) {
  db.getFromHistory().then(fromHistory => {
    res.send({
        code: SUCCESS,
        data: fromHistory
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});

app.get("/getToHistory", function(req, res) {
  db.getToHistory().then(toHistory => {
    res.send({
        code: SUCCESS,
        data: toHistory
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});

app.get("/sendTransaction", function(req, res) {
  if(!req.query.url) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
  }

	if(!req.query.from) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need from"
    });
  }

  if(!req.query.to) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need to"
    });
  }

  if(!req.query.value) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need value"
    });
  }

  const from = Buffer.from(req.query.from, "hex");
  const to = Buffer.from(req.query.to, "hex");
  const value = Buffer.from(req.query.value, "hex");

  db.sendTransaction(req.query.url, from, to, value).then(transactionHash => {
    res.send({
        code: SUCCESS,
        data: transactionHash
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});

app.get("/getTransactionState", function(req, res) {
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }

  if(!req.query.hash) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need hash"
    });
    return;
  }

  getTransactionState(req.query.url, req.query.hash).then(state => {
    res.send({
        code: SUCCESS,
        data: state
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});

app.get("/getAccountInfo", function(req, res) {
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }
  
  if(!req.query.address) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need address"
    });
    return;
  }

  getAccountInfo(req.query.url, req.query.address).then(account => {
    res.send({
        code: SUCCESS,
        data: account.toJSON()
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});

app.get("/getLastestBlock", function(req, res) {
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }

  getLastestBlock(req.query.url).then(block => {
    res.send({
        code: SUCCESS,
        data: block.toJSON()
    });
  }).catch(e => {
    res.send({
        code: OTH_ERR,
        msg: e,
    });
  });
});