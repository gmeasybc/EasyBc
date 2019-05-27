const process = require('process');
const pm2 = require('pm2');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");

const app =  process[Symbol.for('app')];
const mysql = process[Symbol.for("mysql")];

app.post('/status', (req, res) => {
	pm2.list((err, processDescriptionList) => {
		if(!!err)
		{
			return res.json({
				code: OTH_ERR,
				msg: `pm2.list throw error, ${err.toString()}`
			})
		}

		for(let processDescription of processDescriptionList)
		{
			if(processDescription.name === 'fullConsensus')
			{
				return res.json({
					code: SUCCESS,
					data: {
						"name": processDescription.name,
						"pid": processDescription.pid,
						"pm_id": processDescription.pm_id,
						"memory": processDescription.monit ? processDescription.monit.memory : undefined,
						"cpu": processDescription.monit ? processDescription.monit.cpu : undefined
					}
				})
			}
		}

		res.json({
			code: OTH_ERR,
			msg: 'cpu and memory info is can not get'
		})
	});
});

app.post('/logs', (req, res) => {
	const type = req.body.type;
	const title = req.body.title;
	const beginTime = req.body.beginTime;
	const endTime = req.body.endTime;

	mysql.getLogs({ type, title, beginTime, endTime }).then(result => {
		res.json({
			code: SUCCESS,
			data: {
				count: result.count,
				logs: result.rows.map(log => {
					return {
						id: log.id,
						time: log.time,
						type: log.type,
						title: log.title,
						data: log.data
					}
				})
			}
		})
	});
})

app.post("/timeConsume", (req, res) => {
	const type = req.body.type;
	const stage = req.body.stage;
	const beginTime = req.body.beginTime;
	const endTime = req.body.endTime;

	mysql.getTimeConsume({ type, stage, beginTime, endTime }).then(result => {
		res.json({
			code: SUCCESS,
			data: result.map(ele => {
				return {
					id: ele.id,
					time: ele.createdAt,
					stage: ele.stage,
					type: ele.type,
					data: ele.data
				}
			})
		})
	});
})

app.post("/abnormalNodes", (req, res) => {
	const type = req.body.type || 1;
	const beginTime = req.body.beginTime;
	const endTime = req.body.endTime;

	mysql.getAbnormalNodes({ type, beginTime, endTime }).then(result => {
		res.json({
			code: SUCCESS,
			data: result.map(ele => {
				return {
					address: ele.address,
					frequency: ele.frequency
				}
			})
		});
	})
})