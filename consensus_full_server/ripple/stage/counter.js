const CounterData = require("../data/counter");
const utils = require("../../../depends/utils");
const { CHEAT_REASON_MALICIOUS_COUNTER_ACTION, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED, TIMEOUT_REASON_SLOW, CHEAT_REASON_INVALID_SIG, TRANSACTIONS_CONSENSUS_THRESHOULD, CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP, CHEAT_REASON_REPEATED_COUNTER_DATA, CHEAT_REASON_INVALID_COUNTER_ACTION, RIPPLE_STAGE_AMALGAMATE_FETCHING_NEW_TRANSACTIONS, COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE, RIPPLE_STATE_PERISH_NODE, COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE, PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST, PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, STAGE_STATE_EMPTY, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");
const assert = require("assert");
const _ = require("underscore");

const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerStageConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unl = process[Symbol.for("unl")];
const mysql = process[Symbol.for("mysql")];
const fullUnl = process[Symbol.for("fullUnl")];

const COUNTER_DATA_TIMESTAMP_CHEATED_LEFT_GAP = 60 * 1000;
const COUNTER_DATA_TIMESTAMP_CHEATED_RIGHT_GAP = 60 * 1000;

const COUNTER_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP = 30 * 1000;
const COUNTER_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP = 30 * 1000;

class Counter extends Stage
{
	constructor(ripple)
	{
		super({
			name: 'counter',
			synchronize_state_request_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;

		this.counterDatas = [];
		this.stageSynchronizeTrigger = [];
	}

	reset()
	{
		super.reset();

		this.counterDatas = [];
		this.stageSynchronizeTrigger = [];
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			logger.info("Counter handler, sync stage success")
		}
		else
		{	
			logger.info("Counter handler, sync stage success because of timeout")
		}

		const actionCollsMap = new Map();

		for(let counterData of this.counterDatas)
		{
			const action = bufferToInt(counterData.action);

			if(actionCollsMap.has(action))
			{
				const count = actionCollsMap.get(action);
				actionCollsMap.set(action, count + 1);
			}
			else
			{
				actionCollsMap.set(action, 1);
			}
		}

		// statistic vote result
		const sortedActionColls = _.sortBy([...actionCollsMap], actionColl => -actionColl[1]);

		//
		if(sortedActionColls[0] && sortedActionColls[0][1] / (fullUnl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			this.reset();
			
			const action = sortedActionColls[0][0];

			if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
			{
				logger.info("Counter handler, stage synchronize success, begin to fetch new transaction and amalgamate")

				this.ripple.stage = RIPPLE_STAGE_AMALGAMATE_FETCHING_NEW_TRANSACTIONS;

				this.ripple.run(false).then(() => {

					// handle cached messages
					for(let i = 0; i < this.ripple.amalgamateMessagesCache.length; i++)
					{
						let {address, cmd, data} = this.ripple.amalgamateMessagesCache[i];
						this.ripple.amalgamate.handleMessage(address, cmd, data);
					}

					this.ripple.amalgamateMessagesCache = [];		

				}).catch(e => {
					logger.fatal(`Counter handler, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

					process.exit(1);
				});
			}
			else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
			{
				logger.info("Counter handler, stage synchronize success, begin to reuse cached transactions and amalgamate because of transaction consensus failed")

				this.ripple.run(true);
			}
			else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND)
			{
				logger.info("Counter handler, stage synchronize success, begin to reuse cached transactions and amalgamate because of stage fall behind")

				this.ripple.run(true);
			}
			else
			{
				logger.fatal(`Counter handler, invalid action, ${this.action}`);

				process.exit(1);
			}
		}
		else 
		{
			// sync stage debug info
			let counterDataInfo = ""
			for(let counterData of this.counterDatas)
			{
				counterDataInfo += `address: ${counterData.from.toString("hex")}, action: ${bufferToInt(counterData.action)}, `
			}
			counterDataInfo = counterDataInfo.slice(0, -1);
			logger.error(`Counter handler, stage sync failed, ${counterDataInfo}`);

			this.reset();
			this.ripple.run(true);
		}
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		switch(cmd)
		{
			case PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE:
			case PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE:
			case PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE:
			{
				if(this.stageSynchronizeTrigger.length > COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE * unl.length)
				{
					this.stageSynchronizeTrigger.shift();
				}
				
				const now = Date.now();
				this.stageSynchronizeTrigger.push(now);
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_REQUEST:
			{
				// there is node begin to sync stage, check if already in sync stage
				if(this.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
				{
					// check if counter data sig and address is valid
					const counterData = new CounterData(data);
					if(!counterData.validate())
					{
						logger.error(`Counter handleMessage, address: ${address.toString('hex')}, validate failed`);

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_INVALID_SIG
						});
					}

					// check timestamp
					const now = Date.now();
					const timestamp = bufferToInt(counterData.timestamp)
					if(timestamp > now + COUNTER_DATA_TIMESTAMP_CHEATED_RIGHT_GAP || timestamp < now - COUNTER_DATA_TIMESTAMP_CHEATED_LEFT_GAP)
					{
						logger.error(`Counter handleMessage, address: ${address.toString('hex')}, invalid timestamp ${timestamp}, now is ${now}`);

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP
						})
					}

					const action = bufferToInt(counterData.action);

					const counterDataHash = counterData.hash().toString("hex");

					// check if repeated
					mysql.checkIfCounterRepeated(counterDataHash).then(repeated => {
						// there is a timewindow here, so should check again, check if already in sync stage
						if(this.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
						{
							if(repeated)
							{
								logger.error(`Counter handleMessage, counter data is repeated, address: ${address.toString('hex')}`)

								return this.cheatedNodes.push({
									address: address.toString('hex'),
									reason: CHEAT_REASON_REPEATED_COUNTER_DATA
								})
							}
						
							if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
							{
								logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to fetch new transactions and amalgamate`);
							}
							else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
							{
								logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to use cached tranasctions and amalgamate because of transaction consensus failed`);
							}
							else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND)
							{
								logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to use cached tranasctions and amalgamate because of stage fall behind`);
							}
							else
							{
								logger.error(`Counter handleMessage, invalid action, ${action}`)

								return this.cheatedNodes.push({
									address: address.toString('hex'),
									reason: CHEAT_REASON_INVALID_COUNTER_ACTION
								})
							}

							// handle cheated nodes
							if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE 
								|| action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
							{
								// then amalgamate is processing, or block agreement is processing, or candidate agreement data exchange is processing
								if(this.ripple.candidateAgreement.checkDataExchangeIsProceeding() 
								|| this.ripple.amalgamate.checkIfDataExchangeIsFinish()
								|| this.ripple.amalgamate.checkDataExchangeIsProceeding() 
								|| this.ripple.blockAgreement.checkIfDataExchangeIsFinish() 
								|| this.ripple.blockAgreement.checkDataExchangeIsProceeding() )
								{
									return this.cheatedNodes.push({
										address: counterData.from.toString('hex'),
										reason: CHEAT_REASON_MALICIOUS_COUNTER_ACTION
									})
								}
							}

							// record fall behind node
							if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
							{
								this.timeoutNodes.push({
									address: counterData.from.toString('hex'),
									reason: TIMEOUT_REASON_SLOW
								});
							}

							// check if spread counter data
							if(timestamp < now + COUNTER_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP && timestamp > now - COUNTER_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP)
							{
								this.startStageSynchronize({
									counterData: counterData
								});
							}
						}
					
						p2p.send(address, PROTOCOL_CMD_STAGE_INFO_RESPONSE, this.counterData.serialize());
					}).catch(e => {
						this.logger.fatal(`Counter handleMessage, checkIfCounterRepeated throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

						process.exit(1)
					})
				}
				else
				{
					p2p.send(address, PROTOCOL_CMD_STAGE_INFO_RESPONSE, this.counterData.serialize());
				}
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				const counterData = new CounterData(data);

				this.validateAndProcessExchangeData(counterData, this.counterDatas, address.toString("hex"), {
					addressCheck: false
				});
			}
			break;
			default:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				super.handleMessage(address, cmd, data);
			}
		}
	}

	resetTrigger()
	{
		if(this.state !== STAGE_STATE_EMPTY)
		{
			logger.fatal(`Counter resetTrigger, counter state should be STAGE_STATE_EMPTY, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);
			
			process.exit(1)
		}

		this.stageSynchronizeTrigger = [];
	}

	checkIfTriggered()
	{
		const now = Date.now();

		let stageInvalidFrequency = 0;
		for(let timestamp of this.stageSynchronizeTrigger.reverse())
		{
			if(timestamp + COUNTER_INVALID_STAGE_TIME_SECTION > now)
			{
				stageInvalidFrequency ++;
			}
			else
			{
				break;
			}
		}

		return this.state === STAGE_STATE_EMPTY && stageInvalidFrequency >= COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD * unl.length
	}

	/**
	 * @param {Number} action
	 * @param {CounterData} counterData
	 */
	startStageSynchronize({action, counterData})
	{
		if(action === undefined && counterData === undefined)
		{
			throw new Error(`Counter startStageSynchronize, action and counterData can not be undefined at the same time`);
		}
		
		if(counterData)
		{
			assert(counterData instanceof CounterData, `Counter startStageSynchronize, counterData should be an instance of CounterData, now is ${typeof counterData}`);
		}
		else
		{
			assert(typeof action === "number", `Counter startStageSynchronize, action should be a Number, now is ${typeof action}`);
		
			counterData = new CounterData({
				timestamp: Date.now(),
				action: action
			});
			counterData.sign(privateKey)
		}

		this.start();

		this.ripple.reset();
		this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;
		
		this.counterData = counterData;
		this.action = bufferToInt(counterData.action)

		this.counterDatas.push(counterData);

		logger.info(`Counter startStageSynchronize, begin to send stage sync protocol, stage: ${this.ripple.stage}`);

		p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST, counterData.serialize());
	}
}

module.exports = Counter;