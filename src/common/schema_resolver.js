const Validator = require('semantic-schema').validator;
class CustomValidator extends Validator{
    constructor(mod, schema) {
        super(schema);
        this._module = mod;
    }
    validate(instance) {
        let result = super.validate(instance);
        if(!result) {
            let instanceStr = JSON.stringify(instance);
            let schemaStr = JSON.stringify(this.jsonSchema);
            console.log(this.errors());
            let errorStr = this.errorsText(this.errors());
            throw new Error(`invalid ${this._module}\n instance: ${instanceStr}\n schema: ${schemaStr}\n error: ${errorStr}`);
        }
    }
}

module.exports = class {
    constructor(schemaDir) {
        this._schemaDir = schemaDir;
        this._schemaCache = {};
    }

    resolve(apiName) {
        if(!apiName) {
            throw new Error('apiName must be provided.');
        }
        if(!this._schemaCache[apiName]) {
            let schema;
            try {schema = require(`${this._schemaDir}/${apiName}`)}
            catch(err) {throw new Error(`no such api: ${apiName}`)}
            if (schema.request === undefined 
                || schema.response === undefined 
                || (typeof schema.info !== 'object')) {
                throw new Error(`bad format of schema ${apiName}, expecting schema to have properties request, response and info.`);
            }
            this._schemaCache[apiName] = {
                info: schema.info,
                constant: schema.constant,
                requestValidator: new CustomValidator('request', schema.request),
                responseValidator: new CustomValidator('response', schema.response)
            };
        }

        return this._schemaCache[apiName];
    }
};