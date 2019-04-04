const levelup = require("levelup");
const leveldown = require("leveldown");
const Trie = require("merkle-patricia-tree");
const path = require("path");
const utils = require("../depends/utils");
const { BLOCK_CHAIN_DATA_DIR } = require("../constant");
const BlockChain = require("../depends/block_chain");

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;

class Cache
{
	constructor()
	{
		const db = levelup(leveldown(BLOCK_CHAIN_DATA_DIR));

		this.blockChain = new BlockChain({
			trie: new Trie(db),
			db: db
		});
		this.lastestBlock = undefined;
		this.blockChainHeight = Buffer.alloc(0);
	}

	async refreshStateRoot()
	{	
		const newBlockChainHeight = await this.blockChain.getBlockChainHeight();
		if(!newBlockChainHeight)
		{
			return;
		}

		if(this.blockChainHeight.toString("hex") === newBlockChainHeight.toString("hex"))
		{
			return;
		}

		this.blockChainHeight = newBlockChainHeight;
		this.lastestBlock = await this.blockChain.getBlockByNumber(this.blockChainHeight);
		if(!this.lastestBlock)
		{
			throw new Error(`refreshStateRoot, getBlockByNumber(${this.blockChainHeight.toString()}) should not return undefined`);
		}

		this.blockChain.stateManager.resetTrieRoot(lastestBlock.header.stateRoot);
	}

	/**
	 * @param {String} address
	 */
	async getAccountInfo(address)
	{
		assert(typeof address === "string", `Cache getAccountInfo, address should be a String, now is ${typeof address}`);

		await this.refreshStateRoot();

		return await this.blockChain.stateManager.getAccount(toBuffer(address));
	}

	/**
	 * @param {String} hash
	 */
	async getTransactionState(hash)
	{
		assert(typeof hash === "string", `Cache getTransactionState, hash should be a String, now is ${typeof hash}`);

		await this.refreshStateRoot();

	  hash = toBuffer(hash);
	 
	 	const blockNumber = new BN(this.blockChainHeight);
	 	while(blockNumber.gtn(0))
	 	{
	 		const block = await this.getBlockByNumber(blockNumber.toString(16));
	 		if(!block)
	 		{
	 			throw new Error(`getTransactionState, getBlockByNumber(${blockNumber.toString(16)}) should not return undefined`);
	 		}

	 		const transaction = block.getTransaction(hash);

	 		if(transaction)
	 		{
	 			return transaction;
	 		}

	 		blockNumber.isubn(1);
	 	}

	 	return undefined;
	}

	/**
	 * @param {String} hash
	 */
	async getBlockByNumber(number)
	{
		assert(typeof number === "string", `Cache getBlockByNumber, number should be a String, now is ${typeof number}`);

		await this.refreshStateRoot();

		return await this.blockChain.getBlockByNumber(toBuffer(number));
	}

	async getLastestBlock()
	{
		await this.refreshStateRoot();

		return this.lastestBlock;
	}
}


module.exports = Cache;