const SemanticSchema = require('semantic-schema');

module.exports = class {

	constructor(schemaDir) {
		this._schemaDir = schemaDir;
		this._schemas = {};
	}

	resolveSchema(api) {
		if(this._schemas[api]) {
			return this._schemas[api];
		}
		let schemaFile = `${this._schemaDir}/${api}`;
		let schema = null;
		try {
			schema = require(schemaFile);
		}
		catch(err) {
			throw new Error(`failed to load schemaFile(${schemaFile}), detail message: ${err.message}`);
		}
		if ((schema.request === undefined) 
			|| (schema.response === undefined) 
			|| (typeof schema.info !== 'object')) {
			throw new Error(`bad format of schemaFile(${schemaFile}), expecting schema with request/response/info.`);
		}
		schema.request = SemanticSchema.syntacticSugar.parseDescriber(schema.request);
		schema.response = SemanticSchema.syntacticSugar.parseDescriber(schema.response);
		this._schemas[api] = schema;
		return this._schemas[api];
	}
	
	validateSchema(module, instance, schema) {
		if (SemanticSchema.validator.validate(schema[module], instance)) {
			return;
		}
		throw new Error(`invalid ${module}\n instance:${JSON.stringify(instance)}\nschema:${JSON.stringify(schema[module].normalize())}\n${SemanticSchema.validator.errorsText()}`);
	}
}

