import * as router from 'koa-router'
import * as Koa from 'koa'
import * as _ from 'lodash'
import { IConfig } from '../../../config'
import { URL } from 'url'
import { get } from 'request-promise'
import { AttachmentData, Attachment } from 'mailgun-js'
import * as At from 'mailgun-js/lib/attachment'
import * as mime from 'mime'
import * as path from 'path'
export interface IMessageAttachemnt {
    url: URL,
    body: any
}
export interface IMailMessage {
    recipient: Array<string>,
    from: string,
    title: string,
    letter: string,
    attachemntsUrl?: Array<IMessageAttachemnt>,
    attachments?: ReadonlyArray<Attachment>
}
export default async function send(
    ctx: Koa.ParameterizedContext<{}, router.IRouterContext> | any,
    next: () => Promise<any>
) {
    // const ca: Certificate = _.get(ctx, 'ca')
    // const user: IKsuCertificate | IKsuUser = _.get(ctx, 'user')
    const config: IConfig = _.get(ctx, 'config')
    const body: IMailMessage = _.get(ctx, 'request.body')
    if (/^(http|https):/.test(body.letter)) {
        body.letter = await get(body.letter)
    }
    if (body.attachemntsUrl && body.attachemntsUrl.length) {
        const requestAttachments = body.attachemntsUrl.map(async x => {
            const data: Buffer = await get(x.url.toString(), { body: x.body, encoding: null })
            const filename = path.basename(x.url.toString())
            return new At({ data, filename })
        })
        const attachments = await Promise.all(requestAttachments)
        body.attachments = attachments
    }

    try {
        const result = await config.mailInstance.messages().send({
            attachment: body.attachments,
            to: body.recipient.join(','),
            from: body.from,
            html: body.letter,
            text: body.letter,
            subject: body.title
        })
        ctx.body = {
            error: false,
            result: 'Message send',
            message: result.id
        }
    } catch (e) {
        console.log(e)
        ctx.throw(500, `Error at send message: ${e.message}`)
    }

}