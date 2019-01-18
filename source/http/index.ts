import * as Router from 'koa-router'
import * as Koa from 'koa'
import * as winston from 'winston'
import * as bodyparser from 'koa-bodyparser'
import * as _ from 'lodash'
import { Auth } from '@hazpro/auth'
import { Queue, IMessage } from '@hazpro/queue'

import * as mailSend from './middleware/mail/send'
import { IConfig } from '../config'

export default class HttpServer {
    httpHandler: Koa
    router: Router
    logger: winston.Logger
    config: IConfig
    ca: Auth
    queue: Queue
    /** */
    constructor(
        logger: winston.Logger = null,
        config: IConfig
    ) {
        this.config = config
        this.ca = new Auth(this.config.ca)
        this.httpHandler = new Koa()
        this.router = new Router()
        this.queue = new Queue(this.config.queue)
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
        _.set(ctx, 'config', this.config)
        _.set(ctx, 'ca', this.ca.getCerificate())
        // Templates endpoints
        this.router.get('Send email', '/api/mail/send', this.ca.auth, mailSend.default)
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
    async incomingTask(msg: IMessage) {
        console.log(msg)
        msg.ack()
    }
    async subscribeToTask() {
        await this.queue.open()
        this.queue.consumeQueue('email', this.incomingTask)
    }

    start() {
        this.httpHandler.use(this.setExtensions)
        this.httpHandler.use(this.httpLogger)
        this.httpHandler.use(bodyparser())
        this.httpHandler.use(this.router.routes())
        this.httpHandler.use(this.router.allowedMethods())
        this.httpHandler.listen(this.config.http.port, async () => {
            await this.subscribeToTask()
        })
    }
}