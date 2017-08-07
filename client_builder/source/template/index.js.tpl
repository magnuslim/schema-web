const Ajv = require('ajv');
const ajv = new Ajv();
require('ajv-keywords')(ajv, 'switch');

const Transport = require('./lib/transport.js');
const QwebClientError = require('./lib/error.js');
const schemaDict = {<%for (let api of apiInfoList){ %>
    '<%-api.name-%>': require('./schema/<%-api.name-%>.json'),<%}%>
};

module.exports = class {
    constructor({
        protocol = 'http',
        host = 'localhost',
        port = '80',
        root = '/',
        timeout = 30000
    }) {
        this._transport = new Transport(protocol, host, port, root, timeout);
    }

    setState(key, value) {
        let states = sessionStorage.getItem('Qweb-State');
        if (typeof states !== 'string') {
            states = '';
        }

        let statesMap = new Map();
        for (let pair of states.split(';')) {
            let [pairKey, pairValue] = pair.trim().split('=', 2);
            if (pairKey.length > 0) {
                statesMap.set(pairKey, pairValue);
            }
        }
        statesMap.set(key, value);

        states = [];
        for (let [key, value] of statesMap) {
            states.push(`${key}=${value}`);
        }

        sessionStorage.setItem(`Qweb-State`, states.join(';'));
    }

    getState(key) {
        let states = sessionStorage.getItem('Qweb-State');
        if (typeof states !== 'string') {
            return undefined;
        }

        let statesMap = new Map();
        for (let pair of states.split(';')) {
            let [pairKey, pairValue] = pair.trim().split('=', 2);
            if (pairKey.length > 0) {
                statesMap.set(pairKey, pairValue);
            }
        }
        return statesMap.get(key);
    }

    unsetState(key) {
        let states = sessionStorage.getItem('Qweb-State');
        if (typeof states !== 'string') {
            states = '';
        }

        let statesMap = new Map();
        for (let pair of states.split(';')) {
            let [pairKey, pairValue] = pair.trim().split('=', 2);
            if (pairKey.length > 0) {
                statesMap.set(pairKey, pairValue);
            }
        }
        statesMap.delete(key);

        states = [];
        for (let [key, value] of statesMap) {
            states.push(`${key}=${value}`);
        }

        sessionStorage.setItem(`Qweb-State`, states.join(';'));
    }

    clearState() {
        sessionStorage.removeItem(`Qweb-State`);
    }
<%for (let api of apiInfoList){ %>
    <%-api.funcName-%>(request) {
        return this._run('<%-api.name-%>', request);
    }
<%}-%>

    _run(api, request) {

        let schema = schemaDict[api];
        if ((typeof schema.request !== 'object') 
			|| (typeof schema.response !== 'object') 
			|| (typeof schema.info !== 'object')) {
			throw new QwebClientError(`bad format of schemaFile(${schemaFile}), expecting info / request / response to be an object.`);
		}
        let [isValid, $errMsg] = this._validateSchema('request', request, schema);
        if (!isValid) {
            return Promise.reject(new QwebClientError($errMsg));
        }

        return this._transport.run(api, request).then((response) => {
            let [isValid, $errMsg] = this._validateSchema('response', response, schema);
            if (!isValid) {
                return Promise.reject(new QwebClientError($errMsg));
            }
            return response;
        });
    }

    _validateSchema(module, instance, schema) {
		if (ajv.validate(schema[module],instance)) {
			return [true, null];
		}
		return [false, `invalid ${module}\n instance:${JSON.stringify(instance)}\nschema:${JSON.stringify(schema[module])}\n${ajv.errorsText()}`];
	}

    static get Constant() {
        return {<%for (let api of apiInfoList){ %>
            <%-api.funcName-%>: schemaDict['<%-api.name-%>'].constant,<%}%>
        }; 
    }
}