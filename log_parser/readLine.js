const assert = require("assert");
const stream = require('stream');
const log4js= require("./logConfig");

const READ_SIZE = 100;

const logger = log4js.getLogger("logParse");

class ReadLine {
	/**
	 * @param input 
	 */
	constructor({ input })
	{
		assert(input instanceof stream.Readable, `input should be an Readable stream, now is ${typeof input}`)

		this.stringBuffer = ''

		input.setEncoding('utf8');
		input.pause();

		input.on('end', () => {
			this.end = true;
		});
		
		this.end = false;
		this.input = input;
	}

	/**
	 * @return {String} null表示流已经结束
	 */
	async readLine() {
		let { line, remain } = getLineAndRemain(this.stringBuffer)

		if(line)
		{
			this.stringBuffer = remain;

			return line;
		}

		while(true)
		{
			const chunkString = this.input.read(READ_SIZE);
			if(chunkString === null)
			{
				if(this.end)
				{
					if(this.stringBuffer.length)
					{
						let line = this.stringBuffer;

						this.stringBuffer = '';

						return line;
					}
					return null;
				}
				else
				{
					await new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve()
						}, 2000);
					})
					continue;
				}
			}

			this.stringBuffer += chunkString;

			let { line, remain } = getLineAndRemain(this.stringBuffer)

			if(line) {
				this.stringBuffer = remain;

				return line;
			}
		}
	}
}

/**
 * @param
 */
const getLineAndRemain = (content) => {
	assert(typeof content === 'string', `ReadLine getLineAndRemain, content should be a String, now is ${typeof content}`)

	let newLineIndex = content.indexOf("\r\n")
	if(newLineIndex !== -1)
	{
		return {
			line: content.substring(0, newLineIndex),
			remain: content.substring(newLineIndex + 2)
		};
	}

	newLineIndex = content.indexOf("\n")
	if(newLineIndex !== -1)
	{
		return {
			line: content.substring(0, newLineIndex),
			remain: content.substring(newLineIndex + 1)
		};
	}

	newLineIndex = content.indexOf("\r")
	if(newLineIndex !== -1)
	{
		return {
			line: content.substring(0, newLineIndex),
			remain: content.substring(newLineIndex + 1)
		};
	}

	return {
		line: null
	}
}

module.exports = {
	createInterface: ({input}) => {
		return new ReadLine({input});
	}
}