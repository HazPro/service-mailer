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
        api: process.env.MAILGUUN_TOKEN || '29f838318e75f5290eb7a74aa0a48291-060550c6-5c142be5',
        domain: process.env.MAILGUUN_DOMAIN || 'sandboxa731d8d9cb9a47a682d2502c878965a4.mailgun.org'
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