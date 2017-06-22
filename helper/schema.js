const Ajv = require('ajv');
const ajv = new Ajv();

module.exports = class {

	constructor(handlerDir) {
		this._handlerDir = handlerDir;
	}

	resolveSchema(api) {
		let schemaFile = `${this._handlerDir}/${api}/schema.js`;
		let schema = null;
		try {
			schema = require(schemaFile);
		}
		catch(err) {
			throw new Error(`failed to load schemaFile(${schemaFile}), detail message: ${err.message}`);
		}
		if ((typeof schema.request !== 'object') 
			|| (typeof schema.response !== 'object') 
			|| (typeof schema.info !== 'object')
			|| (typeof schema.info.auth !== 'boolean')) {
			throw new Error(`bad format of schemaFile(${schemaFile}), expecting request / response to be an object, and auth to be an boolean.`);
		}
		return schema;
	}
	
	validateSchema(module, instance, schema) {
		if (ajv.validate(schema[module], instance)) {
			return;
		}

		throw new Error(`invalid ${module}\n instance:${JSON.stringify(instance)}\nschema:${JSON.stringify(schema[module])}\n${ajv.errorsText()}`);
	}
}

