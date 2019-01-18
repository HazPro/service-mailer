import * as forge from 'node-forge'
import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'

export interface ICertificateData {
    organization: string,
    email: string
}
export interface IKsuCertificate {
    info: ICertificateData,
    permissions: Array<string>
}

export interface IKsuUser {
    username: string
    role: string,
    name: string,
    id: string
}

export class Certificate {
    private ca: forge.pki.Certificate
    private privateKey: string

    constructor(CaPem: string, CaKeyPem?: string) {
        this.ca = forge.pki.certificateFromPem(CaPem)
        if (!this.ca.privateKey && CaKeyPem) {
            this.ca.privateKey = forge.pki.privateKeyFromPem(CaKeyPem)
            this.privateKey = CaKeyPem
            console.log(`Use CA certificate ${this.getInfo().info.organization}`)
        }
    }
    static fromFile(CaPath: string) {
        const ca = path.resolve(CaPath, './cert/ca.pem')
        if (!fs.existsSync(path.resolve(CaPath, './cert/ca.pem'))) {
            throw new Error('Ca file not found, check it')
        }
        let key: string = undefined
        if (fs.existsSync(path.resolve(CaPath, './keys/ca.pem'))) {
            key = fs.readFileSync(path.resolve(CaPath, './keys/ca.pem'), 'ascii')
        }
        return new Certificate(
            fs.readFileSync(path.resolve(CaPath, './cert/ca.pem'), 'ascii'),
            key
        )
    }
    validateCertificate(cert: string) {
        const clientCertificate = forge.pki.certificateFromPem(cert)
        try {
            return this.ca.verify(clientCertificate)
        } catch {
            return false
        }
    }
    getInfo(): IKsuCertificate {
        //2.5.4.15
        const perms: any = this.ca.subject.getField({ type: '2.5.4.15' } as forge.pki.CertificateFieldOptions)
        let permissions = []
        if (perms) {
            permissions = perms.value.split(',')
        }
        return {
            info: {
                organization: this.ca.subject.getField('O').value,
                email: this.ca.subject.getField('E').value
            },
            permissions
        } as IKsuCertificate
    }
    getPublicString() {
        return forge.pki.publicKeyToPem(this.ca.publicKey)
    }
    getSerialNumber() {
        return this.ca.serialNumber
    }
    getPrivateKey() {
        return this.privateKey
    }
}