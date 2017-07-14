const dateFormat = require('dateformat');
const colors = require('colors');
const fsx = require('fs-extra');
const fs = require('fs');

module.exports = class Logger {
	static get LEVEL_ERROR() { return 1; }
	static get LEVEL_DEBUG() { return 2; }
	static get LEVEL_INFO() { return 3; }

	constructor({level = Logger.LEVEL_INFO, path = null} = {}) {
		this._level = level;
		this._path = path;
		if (typeof this._path === 'string') {
			fsx.ensureDirSync(require('path').resolve(this._path));
		}
	}

	error(content) {
		this._write(Logger.LEVEL_ERROR, content);
	}

	debug(content) {
		if (this._level >= Logger.LEVEL_DEBUG) {
			this._write(Logger.LEVEL_DEBUG, content);
		}
	}

	info(content) {
		if (this._level >= Logger.LEVEL_INFO) {
			this._write(Logger.LEVEL_INFO, content);
		}
	}

	_write(category, content) {
		let now = new Date();

		let timeStr = dateFormat(now, 'yyyy-mm-dd HH:MM:ss,l');

		let categoryStr = 'ERROR';
		switch(category) {
			case Logger.LEVEL_ERROR:
				categoryStr = 'ERROR';
				break;
			case Logger.LEVEL_DEBUG:
				categoryStr = 'DEBUG';
				break;
			case Logger.LEVEL_INFO:
				categoryStr = 'INFO';
				break;
		}

		let log = `[${timeStr}][${categoryStr}]${content}`;

		if (typeof this._path === 'string') {
			this._writeToFile(now, log);
		}
		else {
			this._writeToConsole(category, log);
		}
	}

	_writeToConsole(category, log) {
		switch(category) {
			case Logger.LEVEL_ERROR:
				console.log(colors.red(log));
				break;
			case Logger.LEVEL_DEBUG:
				console.log(colors.cyan(log));
				break;
			default:
				console.log(colors.grey(log));
				break;
		}
	}

	_writeToFile(now, log) {
		let filename = `${this._path}/${dateFormat(now, 'yyyy-mm-dd')}.log`;
		fsx.ensureFile(filename, (err) => {
			fs.appendFile(filename, `${log}\n`, () => {});
		});
	}
}
