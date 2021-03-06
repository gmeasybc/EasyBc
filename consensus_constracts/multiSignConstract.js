const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StateManager = require("../depends/block_chain/stateManager");
const Transaction = require("../depends/transaction");
const { STATE_DESTROYED } = require("./constant");
const Constract = require("./constract");
const { MultiSignPayRequestEvent, MultiSignPayEvent } = require("./events/multiSignConstractEvents");
const ReceiptManager = require("../depends/block_chain/receiptManager");

const rlp = utils.rlp;
const BN = utils.BN;
const bufferToInt = utils.bufferToInt;

const COMMAND_SEND = 100;
const COMMAND_AGREE= 101;
const COMMAND_REJECT = 102;

class MultiSignConstract extends Constract {
    constructor(data) {
        super(MultiSignConstract.id);

        data = data || {};

        let fields = [{
            length: 32,
            name: "id",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 32,
            name: "state",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 32,
            name: "timestamp",
            allowLess: true,
            allowZero: true,
            default: Buffer.alloc(0)
        }, {
            length: 32,
            name: "expireInterval",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 20,
            name: "to",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }, {
            length: 32,
            name: "value",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }, {
            length: 2,
            name: "threshold",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 200,
            name: "authorityAddresses",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 200,
            name: "agreeAddresses",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }, {
            length: 200,
            name: "rejectAddresses",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }];

        utils.defineProperties(this, fields, data);

        /**
         * @property {Buffer} authorityAddressesArray (read only).
         * @memberof Transaction
         */
        Object.defineProperty(this, "authorityAddressesArray", {
            enumerable: false,
            configurable: true,
            get: function () {
                if (!this._authorityAddressesArray) {
                    this._authorityAddressesArray = this.authorityAddresses.length <= 0 ? [] : rlp.decode(this.authorityAddresses);
                }

                return this._authorityAddressesArray;
            }
        });

        /**
         * @property {Buffer} agreeAddressesArray (read only).
         * @memberof Transaction
         */
        Object.defineProperty(this, "agreeAddressesArray", {
            enumerable: false,
            configurable: true,
            get: function () {
                if (!this._agreeAddressesArray) {
                    this._agreeAddressesArray = this.agreeAddresses.length <= 0 ? [] : rlp.decode(this.agreeAddresses);
                }

                return this._agreeAddressesArray;
            }
        });

        /**
         * @property {Buffer} rejectAddressesArray (read only).
         * @memberof Transaction
         */
        Object.defineProperty(this, "rejectAddressesArray", {
            enumerable: false,
            configurable: true,
            get: function () {
                if (!this._rejectAddressesArray) {
                    this._rejectAddressesArray = this.rejectAddresses.length <= 0 ? [] : rlp.decode(this.rejectAddresses);
                }

                return this._rejectAddressesArray;
            }
        });
    }

    /**
     * @param {Buffer} timestamp
     * @param {StateManager} stateManager
     * @param {ReceiptManager} receiptManager
     * @param {Transaction} tx
     * @param {Account} fromAccount
     * @param {Account} toAccount
     */
    async commandHandler({ timestamp, stateManager, receiptManager, tx, fromAccount, toAccount}) {
        assert(Buffer.isBuffer(timestamp), `MultiSignConstract run, timestamp should be an Buffer, now is ${typeof timestamp}`);
        assert(stateManager instanceof StateManager, `MultiSignConstract run, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
        assert(receiptManager instanceof ReceiptManager, `MultiSignConstract run, receiptManager should be an instance of StateManager, now is ${typeof receiptManager}`);
        assert(tx instanceof Transaction, `MultiSignConstract run, tx should be an instance of Transaction, now is ${typeof tx}`);
        assert(fromAccount instanceof Account, `MultiSignConstract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
        assert(toAccount instanceof Account, `MultiSignConstract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

        const commands = rlp.decode(tx.data);

        const constractTimestampBn = new BN(this.timestamp);
        const timestampNowBn = new BN(timestamp);

        switch (bufferToInt(commands[0])) {
            case COMMAND_SEND:
                {
                    // check privilege
                    if (undefined === this.authorityAddressesArray.find(el => { 
                        return el.toString("hex") === tx.from.toString("hex")
                    })) {
                        throw new Error(`MultiSignConstract commandHandler, address ${tx.from.toString("hex")} has not privilege`)
                    }

                    // check send state
                    if(constractTimestampBn.add(new BN(this.expireInterval)).gt(timestampNowBn))
                    {
                        throw new Error(`MultiSignConstract commandHandler send, constract's send request has not expired`)
                    }

                    // check value
                    this.to = commands[1];
                    this.value = commands[2];
                    if (new BN(toAccount.balance).lt(new BN(this.value)))
                    {
                        throw new Error(`MultiSignConstract commandHandler send, constract's value is not enough, constract balance is ${bufferToInt(toAccount.balance)}, need ${bufferToInt(this.value)}`);
                    }

                    // init timestamp
                    this.timestamp = timestamp;

                    //
                    this._agreeAddressesArray = [];
                    this._rejectAddressesArray = [];
                    this.rejectAddresses = Buffer.alloc(0);

                    await this.agree(stateManager, receiptManager, tx, toAccount, timestamp);
                }
                break;

            case COMMAND_AGREE:
                {
                    // check privilege
                    if (undefined === this.authorityAddressesArray.find(el => {
                        return el.toString("hex") === tx.from.toString("hex")
                    })) {
                        throw new Error(`MultiSignConstract commandHandler, address ${tx.from.toString("hex")} has not privilege`)
                    }

                    // check send state
                    if (this.to.length <= 0 || this.value.length <= 0)
                    {
                        throw new Error(`MultiSignConstract commandHandler agree, constract's send request is not exist`)
                    }
                    if (constractTimestampBn.add(new BN(this.expireInterval)).lt(timestampNowBn)) {
                        throw new Error(`MultiSignConstract commandHandler agree, constract's send request has expired`)
                    }

                    await this.agree(stateManager, receiptManager, tx, toAccount, commands[1]);
                }
                break;

            case COMMAND_REJECT:
                {
                    // check privilege
                    if (undefined === this.authorityAddressesArray.find(el => {
                        return el.toString("hex") === tx.from.toString("hex")
                    })) {
                        throw new Error(`MultiSignConstract commandHandler, address ${tx.from.toString("hex")} has not privilege`)
                    }

                    // check send state
                    if (this.to.length <= 0 || this.value.length <= 0) {
                        throw new Error(`MultiSignConstract commandHandler reject, constract's send request is not exist`)
                    }
                    if (constractTimestampBn.add(new BN(this.expireInterval)).lt(timestampNowBn)) {
                        throw new Error(`MultiSignConstract commandHandler reject, constract's send request has expired`)
                    }

                    await this.reject(receiptManager, tx, commands[1]);
                }
                break;
            default:
                {

                }
        }
    }

    /**
     * @param {Buffer} expireInterval
     * @param {Buffer} threshold
     * @param {Buffer} authorityAddresses
     */
    async create(expireInterval, threshold, authorityAddresses) {
        assert(Buffer.isBuffer(expireInterval), `MultiSignConstract create, expireInterval should be an Buffer, now is ${typeof expireInterval}`);
        assert(Buffer.isBuffer(threshold), `MultiSignConstract create, threshold should be an Buffer, now is ${typeof threshold}`);
        assert(Buffer.isBuffer(authorityAddresses), `MultiSignConstract create, authorityAddresses should be an Buffer, now is ${typeof authorityAddresses}`);

        this.expireInterval = expireInterval;
        this.threshold = threshold;
        this.authorityAddresses = authorityAddresses;
    }

    /**
     * @param {stateManager} stateManager
     * @param {ReceiptManager} receiptManager
     * @param {Transaction} tx
     * @param {Account} constractAccount
     * @param {Buffer} timestamp
     */
    async agree(stateManager, receiptManager, tx, constractAccount, timestamp) {
        assert(stateManager instanceof StateManager, `MultiSignConstract agree, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
        assert(receiptManager instanceof ReceiptManager, `MultiSignConstract agree, receiptManager should be an instance of ReceiptManager, now is ${typeof receiptManager}`);
        assert(tx instanceof Transaction, `MultiSignConstract agree, tx should be an instance of Transaction, now is ${typeof tx}`);
        assert(constractAccount instanceof Account, `MultiSignConstract agree, constractAccount should be an instance of Account, now is ${typeof constractAccount}`);
        assert(Buffer.isBuffer(timestamp), `MultiSignConstract agree, timestamp should be an Buffer, now is ${typeof timestamp}`);

        // check timetamp
        if (this.timestamp.toString("hex") !== timestamp.toString("hex")) {
            throw new Error(`MultiSignConstract agree, invalid timestamp`)
        }

        // check repeat
        if (this.agreeAddressesArray.find(el => el.toString("hex") === tx.from.toString("hex"))) {
            throw new Error(`MultiSignConstract agree, repeat agree, address ${tx.from.toString("hex")}`);
        }
        if (this.rejectAddressesArray.find(el => el.toString("hex") === tx.from.toString("hex"))) {
            throw new Error(`MultiSignConstract agree, repeat reject, address ${tx.from.toString("hex")}`);
        }

        this.agreeAddressesArray.push(tx.from);
        
        // save receipt
        const multiSignPayRequestEvent = new MultiSignPayRequestEvent({
            id: this.id,
            address: tx.to,
            txHash: tx.hash(),
            action: "agree",
            timestamp: this.timestamp,
            to: this.to,
            value: this.value,
            sponsor: tx.from
        });
        await receiptManager.putReceipt(multiSignPayRequestEvent.hash(), multiSignPayRequestEvent.serialize())

        if (this.agreeAddressesArray.length / this.authorityAddressesArray.length >= bufferToInt(this.threshold) / 100)
        {
            // get to account
            const toAccount = await stateManager.cache.getOrLoad(this.to);

            // update toAccount balance
            toAccount.balance = new BN(toAccount.balance).add(new BN(this.value)).toBuffer();

            // update constract balance
            constractAccount.balance = new BN(constractAccount.balance).sub(new BN(this.value)).toBuffer();
            
            await stateManager.putAccount(this.to, toAccount.serialize());

            // save receipt
            const multiSignPayEvent = new MultiSignPayEvent({
                id: this.id,
                address: tx.to,
                txHash: tx.hash(),
                timestamp: this.timestamp,
                to: this.to,
                value: this.value
            });
            await receiptManager.putReceipt(multiSignPayEvent.hash(), multiSignPayEvent.serialize())

            this.reset();
        }
        else
        {
            this.agreeAddresses = this.encodeArray(this.agreeAddressesArray);
        }
    }

    /**
     * @param {ReceiptManager} receiptManager
     * @param {Transaction} tx
     * @param {Buffer} timestamp
     */
    async reject(receiptManager, tx, timestamp) {
        assert(receiptManager instanceof ReceiptManager, `MultiSignConstract reject, receiptManager should be an instance of ReceiptManager, now is ${typeof receiptManager}`);
        assert(tx instanceof Transaction, `MultiSignConstract reject, tx should be an instance of Transaction, now is ${typeof tx}`);
        assert(Buffer.isBuffer(timestamp), `MultiSignConstract reject, timestamp should be an Buffer, now is ${typeof timestamp}`);

        // check timetamp
        if(this.timestamp.toString("hex") !== timestamp.toString("hex"))
        {
            throw new Error(`MultiSignConstract reject, invalid timestamp`)
        }

        // check repeat
        if (this.agreeAddressesArray.find(el => el.toString("hex") === tx.from.toString("hex"))) {
            throw new Error(`MultiSignConstract reject, repeat agree, address ${tx.from.toString("hex")}`);
        }
        if (this.rejectAddressesArray.find(el => el.toString("hex") === tx.from.toString("hex"))) {
            throw new Error(`MultiSignConstract reject, repeat reject, address ${tx.from.toString("hex")}`);
        }

        this.rejectAddressesArray.push(tx.from);

        // save reject receipt
        const multiSignPayRequestEvent = new MultiSignPayRequestEvent({
            id: this.id,
            address: tx.to,
            txHash: tx.hash(),
            action: "reject",
            timestamp: this.timestamp,
            to: this.to,
            value: this.value,
            sponsor: tx.from
        });
        await receiptManager.putReceipt(multiSignPayRequestEvent.hash(), multiSignPayRequestEvent.serialize())
        
        if (this.rejectAddressesArray.length / this.authorityAddressesArray.length > (1 - bufferToInt(this.threshold) / 100)) {
            this.reset();
        }
        else {
            this.rejectAddresses = this.encodeArray(this.rejectAddressesArray);
        }
    }

    reset()
    {
        this.to = Buffer.alloc(0);
        this.value = Buffer.alloc(0);
        this.timestamp = Buffer.alloc(0);
        this.agreeAddresses = Buffer.alloc(0);
        this.rejectAddresses = Buffer.alloc(0);
    }
}

MultiSignConstract.id = "02";

module.exports = MultiSignConstract;