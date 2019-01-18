import * as s from './http'
import * as config from './config'
const http = new s.default(null, config.default)
http.start()