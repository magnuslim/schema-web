const Express = require('express');
const iconv = require('iconv-lite');
const ContentType = require('content-type');
const cors = require('cors');
const bodyParser = require('body-parser');
const SchemaHelper = require('./helper/schema.js');
const stateHelper = require('./helper/state.js');
const Logger = require('./helper/logger.js');

module.exports = class {

    constructor() {
        this._host = '0.0.0.0';
        this._port = 3000;
        this._handler = `${__dirname}/app/handler/`;
        this._schema = `${__dirname}/app/schema/`;
        this._log = `${__dirname}/app/log/`;
        this.app = Express();
    }

    static create(opts = {
        host: undefined,
        port: undefined,
        handlerDir: undefined,
        logDir: undefined,
        
    }, middlewares = []) {
        let zeus = new this();
        if(opts.host)       zeus._host    = opts.host;
        if(opts.port)       zeus._port    = opts.port;
        if(opts.handlerDir) zeus._handler = opts.handlerDir;
        if(opts.schemaDir)  zeus._schema  = opts.schemaDir;
        if(opts.logDir)     zeus._log     = opts.logDir;
        zeus._init(middlewares);
        return zeus;
    }

    _init(middlewares = []) {
        const logger = new Logger({
            level: Logger.LEVEL_ERROR,
            path: this._log
        });
        const schemaHelper = new SchemaHelper(this._schema);
        this.app.use(cors());
        this.app.use((req, res, next) => {
            let chunks = [];
            req.on('data', (chunk) => { 
                chunks.push(chunk);
            });
            req.on('end', () => {
                try {
                    let contentType = ContentType.parse(req.headers['content-type']);
                    let charset = contentType.parameters.charset ? contentType.parameters.charset : 'UTF-8';
                    let body = iconv.decode(Buffer.concat(chunks), charset);
                    req.body = JSON.parse(body);
                    next();
                }
                catch(err) {
                    logger.error(err.stack);
                    next('Internal Server Error');
                }
            });
        });

        // 参数预处理
        this.app.post('/*', (req, res, next) => {
            try{
                let apiName = req.originalUrl.replace(/^\//, '');
                let schema = schemaHelper.resolveSchema(apiName);
                req.api = {
                    name: apiName,
                    schema: schema,
                    payload: {
                        state: stateHelper.extract(req),
                        constant: schema.constant,
                        request: req.body.request
                    }
                }
                next();
            }
            catch(err) {
                logger.error(err.stack);
                res.sendStatus(500);
            }
        });

        middlewares.map((middleware, idx) => {
            this.app.post(middleware.pattern, (req, res, next) => {
                middleware.handle(req, res, next)
                .catch((err) => {
                    logger.error(`[middleware.${idx}] ${err.stack}`);
                    res.sendStatus(500);
                });
            });
        });

        // 接口派发
        this.app.post('/*', async (req, res) => {
            try {
                schemaHelper.validateSchema('request', req.api.payload.request, req.api.schema);
                let response = await require(`${this._handler}/${req.api.name}`)(req.api.payload);
                if(response === undefined) response = null;
                schemaHelper.validateSchema('response', response, req.api.schema);
                res.json({response});
            }
            catch(err) {
                logger.error(`[${req.api.name}] ${err.stack}`);
                res.sendStatus(500);
            }
        });
    }

    raise() {
        return this.app.listen(this._port, this._host);
    }

}