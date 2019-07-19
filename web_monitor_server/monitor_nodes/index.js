const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const rp = require("request-promise");
const assert = require("assert");

const app = process[Symbol.for('app')]
const { Node } = process[Symbol.for('models')]
const logger = process[Symbol.for('logger')];
const printErrorStack = process[Symbol.for("printErrorStack")]

app.post('/monitorNodes', (req, res) => {
	Node.findAll().then(nodes => {
		res.json({
	    code: SUCCESS,
	    data: nodes
	  })
	}).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post('/addMonitorNode', (req, res) => {
	const name = req.body.name;
  const address = req.body.address;
	const host = req.body.host;
	const port = req.body.port;
	const remarks = req.body.remarks;

	if(!!!name)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid name'
    })
  }

  if(!!!address)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid address'
    })
  }

  if(!!!host)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid host'
    })
  }

  if(!!!port)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid port'
    })
  }

  if(!!!remarks)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid remarks'
    })
  }

	Node.findOrCreate({
		where: {
			address: address
		},
		defaults: {
      name,
      address,
			host,
			port,
			remarks
		}
	}).then(([node, created]) => {
    if(!created)
    {
      return res.json({
        code: OTH_ERR,
        msg: `node ${node.address} has existed`
      });
    }
    
    res.json({
      code: SUCCESS
    });
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post('/modifyMonitorNode', (req, res) => {
	const id = req.body.id;
	const name = req.body.name;
	const host = req.body.host;
	const port = req.body.port;
	const remarks = req.body.remarks;

	if(!!!id)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid id'
    })
  }

	if(!!!name)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid name'
    })
  }

  if(!!!host)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid host'
    })
  }

  if(!!!port)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid port'
    })
  }

  if(!!!remarks)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid remarks'
    })
  }

  (async () => {
  	const node = await Node.findOne({
	  	where: {
	  		id: id
	  	}
	  });

	  if(undefined === node)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'node not exist'
      });
    }

    Object.assign(node, { name, host, port, remarks });

    await node.save();

		res.json({
      code: SUCCESS
    });
  })().catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post('/deleteMonitorNode', (req, res) => {
	const id = req.body.id;
	
	if(!!!id)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid id'
    })
  }

 	(async () => {
  	const node = await Node.findOne({
	  	where: {
	  		id: id
	  	}
	  });

	  if(undefined === node)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'node not exist'
      });
    }

    await node.destroy();

		res.json({
      code: SUCCESS
    });
  })().catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.use((req, res, next) => {
  if (req.url.includes("logs")
    || req.url.includes("timeConsume")
    || req.url.includes("abnormalNodes"))
  {
    // check url, offset and limit
    assert(typeof req.body.url === 'string', `req.body.url should be a String, now is ${typeof req.body.url}`);
    assert(typeof req.body.offset === 'number', `req.body.offset should be a Number, now is ${typeof req.body.offset}`);
    assert(typeof req.body.limit === 'number', `req.body.limit should be a Number, now is ${typeof req.body.limit}`);
    
    const options = {
      method: "POST",
      uri: `${req.body.url}${req.url}`,
      body: {
        offset: req.body.offset,
        limit: req.body.limit
      },
      json: true
    };
    
    // check beginTime
    if (req.body.beginTime) 
    {
      assert(typeof req.body.beginTime === 'number', `req.body.beginTime should be a Number, now is ${typeof req.body.beginTime}`)
      options.body.beginTime = req.body.beginTime
    }
    // check endTime
    if (req.body.endTime) 
    {
      assert(typeof req.body.endTime === 'number', `req.body.endTime should be a Number, now is ${typeof req.body.endTime}`)
      options.body.endTime = req.body.endTime
    }
    
    if (req.url.includes("logs"))
    {
      if (req.body.type) {
        assert(typeof req.body.type === 'string', `req.body.type should be a String, now is ${typeof req.body.type}`);
        options.body.type = req.body.type;
      }

      if (req.body.title) {
        assert(typeof req.body.title === 'string', `req.body.title should be a String, now is ${typeof req.body.title}`);
        options.body.title = req.body.title;
      }
    }
    else if (req.url.includes("timeConsume"))
    {
      if (req.body.type) {
        assert(typeof req.body.type === 'number', `req.body.type should be a Number, now is ${typeof req.body.type}`)
        options.body.type = req.body.type;
      }
      if (req.body.stage) {
        assert(typeof req.body.stage === 'number', `req.body.stage should be a Number, now is ${typeof req.body.stage}`)
        options.body.stage = parseInt(req.body.stage);
      }
    }
    else if (req.url.includes("abnormalNodes"))
    {
      if (req.body.type) {
        assert(typeof req.body.type === 'number', `req.body.type should be a Number, now is ${typeof req.body.type}`)
        options.body.type = req.body.type;
      }
    }

    // retransmit data
    rp(options).then(response => {
      res.json({
        code: response.code,
        data: response.data,
        msg: response.msg
      })
    }).catch(e => {
      printErrorStack(e);

      res.json({
        code: OTH_ERR,
        msg: e.toString()
      })
    });
  }
  else 
  {
    next()
  }
})