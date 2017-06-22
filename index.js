
const Express = require('express');
const bodyParser = require('body-parser');
const SchemaHelper = require('./helper/schema.js');
const stateHelper = require('./helper/state.js');
const Logger = require('logger');

module.exports = class {

    constructor() {
        this._host = '0.0.0.0';
        this._port = 3000;
        this._handler = './app/handler/';
        this._log = './log/';
        this._middlewareList = [];
    }

    static create(opts = {
        host: undefined,
        port: undefined,
        handlerDir: undefined,
        logDir: undefined
    }) {
        let zeus = new this();
        if(opts.host)          zeus._host       = opts.host;
        if(opts.port)          zeus._port       = opts.port;
        if(opts.handlerDir)    zeus._handler    = opts.handlerDir;
        if(opts.logDir)        zeus._log        = opts.logDir;
        return zeus;
    }

    installMiddleware(middleware) {
        this._middlewareList.push(middleware);
        return this;
    }

    raise() {
        const logger = new Logger({path: this._log});
        const schemaHelper = new SchemaHelper(this._handler);
        const app = Express();
        app.use(bodyParser.json({limit:"5mb"}));

        // 参数预处理
        app.post('/*', (req, res, next) => {
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
        });

        // 中间件
        for(let idx in this._middlewareList) {
            app.post(this._middlewareList[idx].pattern, (req, res, next) => {
                this._middlewareList[idx].handle(req, res, next)
                .catch((err) => {
                    logger.error(`[middleware.${idx}] ${err.stack}`);
                    res.sendStatus(500);
                });
            });
        }

        // 接口派发
        app.post('/*', async (req, res) => {
            try {
                schemaHelper.validateSchema('request', req.api.payload.request, req.api.schema);
                let response = await require(`${this._handler}/${req.api.name}`)(req.api.payload);
                schemaHelper.validateSchema('response', response, req.api.schema);
                res.json({response});
            }
            catch(err) {
                logger.error(`[${req.api.name}] ${err.stack}`);
                res.sendStatus(500);
            }
        });

        app.listen(this._port, this._host);
    }

}