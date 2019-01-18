import * as Router from 'koa-router'
import * as Koa from 'koa'
import * as winston from 'winston'
import * as bodyparser from 'koa-bodyparser'
import * as _ from 'lodash'
import DB from '../db'
import { Certificate } from '../cert'

//
import * as auth from '../http/middleware/auth'
import * as addTemplate from '../http/middleware/template/routeAddTemplate'
import * as listTemplate from '../http/middleware/template/routeListTemplate'
import * as updateTemplate from '../http/middleware/template/routeUpdateTemplate'
import * as removeTemplate from '../http/middleware/template/routeRemoveTemplate'

export default class HttpServer {
    httpHandler: Koa
    router: Router
    port: number
    logger: winston.Logger
    config: any
    db: DB
    ca: Certificate
    /** */
    constructor(
        port: number,
        logger: winston.Logger = null,
        db: DB,
        config: any
    ) {
        this.db = db
        this.config = config
        if (this.db.isConnected()) {
            this.db.connect()
        }
        this.ca = Certificate.fromFile(config.ca)
        this.port = port
        this.httpHandler = new Koa()
        this.router = new Router()
        if (!logger) {
            // Create minimal logger fro http
            this.logger = winston.createLogger({
                level: 'info',
                format: winston.format.json(),
                transports: [
                    new winston.transports.Console({ format: winston.format.simple() })
                ]

            })
        } else {
            this.logger = logger
        }
    }
    async setExtensions(ctx: Koa.Context, next: Function) {
        _.set(ctx, 'db', this.db)
        _.set(ctx, 'config', this.config)
        _.set(ctx, 'ca', this.ca)
        // Templates endpoints
        this.router.get('Get template', '/api/template/:id', auth.default)
        this.router.get('Get list templates', '/api/template', auth.default, listTemplate.default)
        this.router.post('Add template', '/api/template', auth.default, addTemplate.default)
        this.router.delete('Remove router', '/api/template/:id', auth.default, removeTemplate.default)
        this.router.put('Update template', '/api/template/:id', auth.default, updateTemplate.default)
        // Report endpoint
        this.router.get('Get render template', '/api/report/:template/:format', auth.default)
        await next()
    }
    async httpLogger(ctx: Koa.Context, next: Function) {
        const start = new Date()
        ctx.logger = this.logger
        await next()
        const ms = new Date().getTime() - start.getTime()
        let logLevel = 'info'
        if (ctx.status >= 500) {
            logLevel = 'error'
        }
        if (ctx.status >= 400) {
            logLevel = 'warn'
        }
        this.logger.log({
            level: logLevel,
            message: ctx.status.toString(),
            meta: {
                method: ctx.method,
                url: ctx.originalUrl,
                ms
            }
        })
    }

    start() {
        this.httpHandler.use(this.setExtensions)
        this.httpHandler.use(this.httpLogger)
        this.httpHandler.use(bodyparser())
        this.httpHandler.use(this.router.routes())
        this.httpHandler.use(this.router.allowedMethods())
        this.httpHandler.listen(this.port)
    }
}