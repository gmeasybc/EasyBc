const nodes = require("../nodes.json")
const Pool = require("../processor/pool")
const Transaction = require("../../transaction")
const {getNodeNum} = require("../nodes")

const rlp = util.rlp;

class Candidate extends Pool
{
	constructor(data)
	{
		super();

		const self = this;

		data = data || {}

		// Define Properties
    const fields = [{
      name: "transactions",
      allowZero: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "v",
      length: 1,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.from([0x1c])
    }, {
      name: "r",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }];

    /**
     * Returns the rlp encoding of the candidate
     * @method serialize
     * @memberof Transaction
     * @return {Buffer}
     */

    // attached serialize
    util.defineProperties(this, fields, data);

    /**
     * @property {Buffer} from (read only) sender address of this candidate, mathematically derived from other parameters.
     * @memberof Transaction
     */
    Object.defineProperty(this, "from", {
      enumerable: true,
      configurable: true,
      get: this.getSenderAddress.bind(this)
    });
	}

  reset()
  {
    this.data = [];
  }

	/**
   * Computes a sha3-256 hash of the serialized txs
   * @param {Boolean} [includeSignature=true] whether or not to inculde the signature
   * @return {Buffer}
   */
  hash(includeSignature)
  {
    if(includeSignature === undefined)
    {
      includeSignature = true;
    }

    let items;
    if(includeSignature)
    {
      items = this.raw;
    }
    else
    {
      items = this.raw.slice(0, 1);
    }

    // create hash
    return util.keccak(util.rlp.encode(items));
  }

  /**
   * Returns the sender's address
   * @return {Buffer}
   */
  getSenderAddress()
  {
    if(this._from)
    {
      return this._from;
    }
    const pubkey = this.getSenderPublicKey();
    this._from = util.publicToAddress(pubkey);
    return this._from;
  }

  /**
   * Returns the public key of the sender
   * @return {Buffer}
   */
  getSenderPublicKey()
  {
    if(!this._senderPubKey || !this._senderPubKey.length)
    {
      const msgHash = this.hash(false);
      let v = util.bufferToInt(this.v);
      this._senderPubKey = util.ecrecover(msgHash, v, this.r, this.s);
    }
    return this._senderPubKey;
  }

  /**
   * Determines if the signature is valid
   * @return {Boolean}
   */
  verifySignature()
  {
    // compute publickey
    this.getSenderPublicKey();

    const msgHash = this.hash(false);

    return util.ecverify(msgHash, this.r, this.s, this._senderPubKey);
  }

  /**
   * sign a candidate with a given private key
   * @param {Buffer} privateKey
   */
  sign(privateKey)
  {
    const msgHash = this.hash(false);
    const sig = util.ecsign(msgHash, privateKey);

    // copy sig's properties v, s, r to this
    Object.assign(this, sig);
  }

  /**
   * Validates the signature
   * Checks candidate's property and signature
   * @param {Boolean} [stringError=false] whether to return a string with a description of why the validation failed or return a Boolean
   * @return {Boolean|String}
   */
  validate(stringError)
  {
    const errors = [];

    // verify candidate
    if(!this.verifySignature())
    {
      errors.push("class Candidate validate, Invalid Candidate Signature");
    }

    // check address
    if(!nodes.checkNodeAddress(this.from))
    {
    	errors.push("class Candidate validate, Invalid Candidate address");
    }

  	// verify transactions of candidate
  	let rawTransactions = rlp.decode(this.transactions);
  	for(let i = 0; i < rawTransactions.length; i++)
  	{
  		let transaction = new Transaction(rawTransactions[i]);
  		if(!transaction.verifySignature())
  		{
  			errors.push(`class Candidate validate, Invalid Transaction Signature ${JSON.stringify(transaction.toJSON(true))}`);
  		}
  	}

    if(stringError === undefined || stringError === false)
    {
      return errors.length === 0;
    }
    else
    {
      return errors.join(" ");
    }
  }

  /**
   *
   */
  poolDataToCandidateTransactions()
  {
  	let transactions = [];
  	for(let i = 0; i < this.length; i++)
  	{
  		transactions.push(this.get(i).serialize())
  	}

  	this.transactions = rlp.encode(transactions);
  }

  /**
   *
   */
  candidateTransactionsToPoolData()
  {
  	let transactions = rlp.decode(this.transactions);
  	for(let i = 0; i < this.length; i++)
  	{
  		this.push(new Transaction(transactions[i]))
  	}
  }

  /**
   * @param {Number} threshhold
   */
  clearInvalidTransaction(threshhold)
  {
    let transactions = {};
    for(let i = 0; i < this.length; i++)
    {
      let transaction = this.data[i];
      if(!transactions[transaction.from])
      {
        transactions[transaction.from] = 1;
      }
      else
      {
        transactions[transaction.from] += 1;
      }
    }

    //
    let invalidTransactions = [];
    nodeNum = getNodeNum();
    for(key in transactions)
    {
      if(transactions[key] / nodeNum < threshhold)
      {
        invalidTransactions.push(key);
      }
    }

    //
    this.batchDel(invalidTransactions);
  }
}