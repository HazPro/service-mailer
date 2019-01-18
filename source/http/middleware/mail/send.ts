import * as router from 'koa-router'
import * as Koa from 'koa'
import * as _ from 'lodash'
import { Certificate, IKsuCertificate, IKsuUser } from '../../../cert'
import { IConfig } from '../../../config'
import { URL } from 'url'
import { get } from 'request-promise'
import { Stream } from 'stream'
import { AttachmentData, Attachment } from 'mailgun-js'
export interface IMessageAttachemnt {
    url: URL,
    body: any
}
export interface IMessage {
    recipient: Array<string>,
    title: string,
    letter: string,
    attachemntsUrl?: Array<IMessageAttachemnt>,
    attachments?: ReadonlyArray<AttachmentData>
}
export default async function send(
    ctx: Koa.ParameterizedContext<{}, router.IRouterContext>,
    next: () => Promise<any>
) {
    const ca: Certificate = _.get(ctx, 'ca')
    const user: IKsuCertificate | IKsuUser = _.get(ctx, 'user')
    const config: IConfig = _.get(ctx, 'config')
    const body: IMessage = _.get(ctx, 'request.body')
    if (/^(http|https):/.test(body.letter)) {
        body.letter = await get(body.letter)
    }
    if (body.attachemntsUrl && body.attachemntsUrl.length) {
        const requestAttachments = body.attachemntsUrl.map(x => {
            return get(x.url.toString(), { body: x.body })
        })
        const attachments = await Promise.all(requestAttachments)
        body.attachments = attachments
    }

    try {
        const result = await config.mailInstance.messages().send({
            attachment: body.attachments,
            to: body.recipient.join(','),
            html: body.letter,
            text: body.letter,
            subject: body.title
        })
        ctx.body = {
            error: false,
            result: 'Message send',
            message: result.id
        }
    } catch {
        ctx.throw(500, 'Error at send message')
    }

}