const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const assert = require("assert");
const Transaction = require("../../../depends/transaction");
const { RIPPLE_STAGE_AMALGAMATE, PROTOCOL_CMD_CANDIDATE_AMALGAMATE, PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST, PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE } = require("../../constant");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Amalgamate extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.candidates = [];
	}

	handler(ifSuccess)
	{
		console.time(`Amalgamate handler`);

		if(ifSuccess)
		{
			logger.info("Amalgamate handler success")
		}
		else
		{
			logger.info("Amalgamate handler success because of timeout")
		}
		
		const transactionRawsMap = new Map();
		this.candidates.forEach(candidate => {
			const rawTransactions = rlp.decode(candidate.transactions);

			rawTransactions.forEach(rawTransaction => {
				transactionRawsMap.set(rawTransaction.toString("hex"), rawTransaction);
			});
		});

		console.timeEnd(`Amalgamate handler`);

		this.ripple.candidateAgreement.run([...transactionRawsMap.values()]);

		this.reset();
	}

	/**
	 * @param {Array} transactionRaws
	 */
	run(transactionRaws)
	{
		console.time(`Amalgamate run`)

		assert(Array.isArray(transactionRaws), `Amalgamate run, transactionRaws should be an Array, now is ${typeof transactionRaws}`);

		this.ripple.stage = RIPPLE_STAGE_AMALGAMATE;
		this.start();
		
		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactionRaws)
		});
		candidate.sign(privateKey);

		// broadcast candidate
		p2p.sendAll(PROTOCOL_CMD_CANDIDATE_AMALGAMATE, candidate.serialize());

		//
		this.candidates.push(candidate);

		console.timeEnd(`Amalgamate run`)
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `Amalgamate handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Amalgamate handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Amalgamate handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case PROTOCOL_CMD_CANDIDATE_AMALGAMATE:
			{
				this.handleAmalgamate(address, data);
			}
			break;
			default:
			{
				super.handleMessage(address, cmd, data);
			}
		}
	}

	/**
	 * @param {Buffer} address
	 * @param {Buffer} data
	 */
	handleAmalgamate(address, data)
	{
		assert(Buffer.isBuffer(address), `Amalgamate handleAmalgamate, address should be an Buffer, now is ${typeof address}`);
		assert(Buffer.isBuffer(data), `Amalgamate handleAmalgamate, data should be an Buffer, now is ${typeof data}`);

		const candidate = new Candidate(data);

		if(candidate.validate())
		{
			if(address.toString("hex") !== candidate.from.toString("hex"))
			{
				this.cheatedNodes.push(address.toString('hex'));
				
				logger.info(`Amalgamate handleAmalgamate, address should be ${address.toString("hex")}, now is ${candidate.from.toString("hex")}`);
			}
			else
			{
				if(this.checkIfNodeFinishDataExchange(address.toString("hex")))
				{
					logger.info(`Amalgamate handleAmalgamate, address: ${address.toString("hex")}, send the same exchange data`);
				
					this.cheatedNodes.push(address.toString('hex'));
				}
				else
				{
					this.candidates.push(candidate);
				}
			}
		}
		else
		{
			this.cheatedNodes.push(address.toString('hex'));

			logger.info(`Amalgamate handleAmalgamate, address: ${address.toString("hex")}, validate failed`);
		}

		this.recordDataExchangeFinishNode(address.toString("hex"));
	}

	reset()
	{
		super.reset();
		this.candidates = [];
	}
}

module.exports = Amalgamate;