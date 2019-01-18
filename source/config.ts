import * as mail from 'mailgun-js'
import { IQueueConfig } from '@hazpro/queue'

export interface IConfig {
    ca: string
    http: {
        port: number
    },
    mail: {
        api: string,
        domain: string
    }
    mailInstance?: mail.Mailgun
    queue: IQueueConfig
}

const config: IConfig = {
    ca: process.env.CA_PATH || './assets/',
    http: {
        port: process.env.PORT || 3000
    },
    mail: {
        api: '123123',
        domain: 'test.com'
    },
    queue: {
        exchangeName: 'ksu',
        resultQueue: 'result',
        url: process.env.RABBIT_URL || 'amqp://gqvnsede:PXNexiA9coQRT8wNa-K1NzHsQ0cNrLbP@baboon.rmq.cloudamqp.com/gqvnsede'
    }
} as IConfig

config.mailInstance = mail({
    apiKey: config.mail.api,
    domain: config.mail.domain
})

export default config