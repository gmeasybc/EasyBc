const accountTrie = process[Symbol.for("accountTrie")];
const { checkTxType, checkAccountType } = require("../../consensus_constracts/index.js");
const { ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION } = require("../../consensus_constracts/constant");
const sideChainConstractId = require("../../consensus_constracts/sideChainConstract").id;
const assert = require("assert");
const utils = require("../../depends/utils");

const rlp = utils.rlp;
const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

/**
 * @param {Buffer} blockNumber
 * @param {Array} transactions
 */
module.exports = async (blockNumber, transactions) =>
{
  assert(Buffer.isBuffer(blockNumber), `broadCastSpv, blockNumber should be an Buffer, now is ${typeof blockNumber}`)
  assert(Array.isArray(transactions), `broadCastSpv, transactions should be an Array, now is ${typeof transactions}`)

  const block = await blockDb.getBlockByNumber(blockNumber);
  const stateRoot = block.header.stateRoot.toString("hex");

  // init account tire
  this.trie = accountTrie.copy();
  trie.root = Buffer.from(stateRoot, "hex");

  // init get account function
  const getAccount = async address => {
    assert(Buffer.isBuffer(address), `broadCastSpv, address should be an Buffer, now is ${typeof address}`)

    await new Promise((resolve, reject) => {
      trie.get(address, (err, result) => {
        if (!!err) {
          reject(err);
        }

        resolve(new Account(result));
      })
    });
  }

  // broadCast spv
  for (let tx of transactions) {
    // check if an normal tx
    if (checkTxType(tx) !== TX_TYPE_TRANSACTION) {
      continue;
    }

    // check if to address is an constract
    const account = await getAccount(tx.to);
    if (checkAccountType(account) !== ACCOUNT_TYPE_CONSTRACT) {
      continue;
    }

    let constractId;
    let chainCode;
    try {
      const decodedConstractDataArray = rlp.decode(account.data);
      constractId = decodedConstractDataArray[0].toString("hex");
      chainCode = decodedConstractDataArray[2];
    }
    catch (e) {
      continue;
    }

    // check if is a sideChainConstract
    if (constractId !== sideChainConstractId) {
      continue;
    }

    // save spv request
    mysql.saveSpv(blockNumber, tx, chainCode)
  }
}