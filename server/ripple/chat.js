const {post} = require("../../http/request")
const util = require("../../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")
const {nodeList, privateKey} = require("../nodes")

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")


/**
 * @param {Ripple} ripple
 */
module.exports.batchAmalgamateCandidate = function(ripple)
{
	ripple.candidate.sign(util.toBuffer(privateKey));

	nodeList.foreach(function(node) {
		module.exports.amalgamateCandidate(node.url, util.baToHexString(ripple.candidate.serialize()), function(err, response) {
			if(!!err)
			{
				ripple.emit("amalgamateCandidateErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				ripple.emit("amalgamateCandidateErr");
				return;
			}

			ripple.emit("amalgamateCandidateSuccess");
		});
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.batchConsensusCandidate = function(ripple)
{
	ripple.candidate.sign(util.toBuffer(privateKey));

	nodeList.foreach(function(node) {
		module.exports.consensusCandidate(node.url, util.baToHexString(ripple.candidate.serialize()), function(err, response) {
			if(!!err)
			{
				ripple.emit("consensusCandidateErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				ripple.emit("consensusCandidateErr");
				return;
			}

			ripple.emit("consensusCandidateSuccess");
		});
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.batchConsensusTime = function(ripple)
{
	ripple.time.sign(util.toBuffer(privateKey));

	nodeList.foreach(function(node) {
		module.exports.consensusTime(node.url, util.baToHexString(ripple.time), function(err, response) {
			if(!!err)
			{
				ripple.emit("consensusTimeErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				ripple.emit("consensusTimeErr");
				return;
			}

			ripple.emit("consensusTimeSuccess");
		});
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.batchConsensusBlock = function(ripple)
{
	ripple.block.sign(util.toBuffer(privateKey));
	
	nodeList.foreach(function(node) {
		module.exports.consensusBlock(node.url, util.baToHexString(ripple.block), function(err, response) {
			if(!!err)
			{
				ripple.emit("consensusBlockErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				ripple.emit("consensusBlockErr");
				return;
			}

			ripple.emit("consensusBlockSuccess");
		});
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.batchGetLastestBlock = function(processor)
{	
	nodeList.foreach(function(node) {
		module.exports.getLatestBlock(node.url, function(err, response) {
			if(!!err)
			{
				processor.emit("getLastestBlockErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("getLastestBlockErr");
				return;
			}

			processor.emit("getLastestBlockSuccess", response.data);
		});
	});
}

/**
 * @param {Buffer} number
 */
module.exports.batchGetBlockByNum = function(processor, number)
{	
	nodeList.foreach(function(node) {
		module.exports.getBlockByNum(node.url, number, function(err, response) {
			if(!!err)
			{
				processor.emit("getBlockByNumErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("getBlockByNumErr");
				return;
			}

			processor.emit("getBlockByNumSuccess", response.data);
		});
	});
}

/**
 * @param {Candidate} candidate
 */
module.exports.amalgamateCandidate = function(url, candidate, cb)
{
	post(logger, url + "/amalgamateCandidate", {candidate: util.baToHexString(candidate.serialize())}, cb);
}

/**
 * @param {Candidate} candidate
 */
module.exports.consensusCandidate = function(url, candidate,  cb)
{
	post(logger, url + "/consensusCandidate", {candidate: util.baToHexString(candidate.serialize())}, cb);
}

/**
 * @param {Number} time
 */
module.exports.consensusTime = function(url, time, cb)
{
	post(logger, url + "/consensusTime", {time: time}, cb);
}

/**
 * @param {RippleBlock} block
 */
module.exports.consensusBlock = function(url, block, cb)
{
	post(logger, url + "/consensusBlock", {block: util.baToHexString(block.serialize())}, cb);
}

/**
 *
 */
module.exports.getLatestBlock = function(url, cb)
{
	post(logger, url + "/getLatestBlock", {}, cb);
}

/**
 * @param {Buffer} number the number of the block
 */
module.exports.getBlockByNum = function(url, number, cb)
{
	post(logger, url + "/getLatestByNum", {number: util.baToHexString(number)}, cb);
}