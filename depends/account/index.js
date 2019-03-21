const util = require("../utils");

const Buffer = util.Buffer;

class Account
{
  constructor(data)
  {
    data = data || {};

    let fields = [{
      length: 32,
      name: "nonce",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "balance",
      allowZero: true,
      allowLess: true,
      default: util.toBuffer("0x6000")
    }];

    util.defineProperties(this, fields, data);
  }

  isEmpty()
  {
    return this.balance.toString("hex") === "" && this.nonce.toString("hex") === "";
  }
}

module.exports = Account;