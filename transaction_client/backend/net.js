const utils = require("../../depends/utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../constant")
const Account = require("../../depends/account");
const Block = require("../../depends/block");
const rp = require("request-promise");
const assert = require("assert");

const options = {
    method: "POST",
    uri: "",
    body: {
        
    },
    json: true // Automatically stringifies the body to JSON
};

/**
 * @param {String} url
 * @param {String} tx
 */
module.exports.sendTransaction = async function(url, tx)
{
	assert(typeof url === "string", `chat sendTransaction, url should be a String, now is ${typeof url}`);
	assert(typeof tx === "string", `chat sendTransaction, tx should be a String, now is ${typeof tx}`);

	tx = `0x${utils.padToEven(tx)}`;

	options.uri = `${url}/sendTransaction`;
	options.body = {
		tx: tx
	}
	
	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve();
		}).catch(e => {
			reject(e.toString());
		});
	});

	return promise;
}

/**
 * @param {String} url
 * @param {String} transactionHash
 */
module.exports.getTransactionState = async function(url, transactionHash)
{
	assert(typeof url === "string", `chat getTransactionState, url should be a String, now is ${typeof url}`);
	assert(typeof transactionHash === "string", `chat getTransactionState, transactionHash should be a String, now is ${typeof transactionHash}`);

	transactionHash = `0x${utils.padToEven(transactionHash)}`;

	options.uri = `${url}/getTransactionState`;
	options.body = {
		hash: transactionHash
	}

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve(response.data);
		}).catch(e => {
			reject(e.toString());
		});
	});

	return promise;
}

/**
 * @param {String} url
 * @param {String} address
 */
module.exports.getAccountInfo = async function(url, address)
{
	assert(typeof url === "string", `chat getAccountInfo, url should be a String, now is ${typeof url}`);
	assert(typeof address === "string", `chat getAccountInfo, address should be a String, now is ${typeof address}`);

	address = `0x${utils.padToEven(address)}`;

	options.uri = `${url}/getAccountInfo`;
	options.body = {
		address: address
	}

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}
			
			resolve(new Account(response.data));
		}).catch(e => {
			reject(e);
		});
	});

	return promise;
}

/**
 * @param {String} url
 */
module.exports.getLastestBlock = async function(url)
{
	assert(typeof url === "string", `chat getAccountInfo, url should be a String, now is ${typeof url}`);

	options.uri = `${url}/getLastestBlock`;

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve(new Block(response.data));
		}).catch(e => {
			reject(e);
		})
	});

	return promise;
}