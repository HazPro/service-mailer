import * as mail from 'mailgun-js'

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
}

const config: IConfig = {
    ca: process.env.CA_PATH || './assets/ca.pem',
    http: {
        port: process.env.PORT || 3000
    },
    mail: {
        api: '123123',
        domain: 'test.com'
    },
} as IConfig

config.mailInstance = mail({
    apiKey: config.mail.api,
    domain: config.mail.domain
})

export default config