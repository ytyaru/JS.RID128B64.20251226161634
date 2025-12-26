const crypto = require('node:crypto');
class RID128B64 {
    static get() {return this.#uint8ToBase64URL(this.#random);}
    static get #random() {return crypto.getRandomValues(new Uint8Array(128/8));}
    static #uint8ToBase64(bytes) {return Buffer.from(bytes).toString('base64');}
    static #uint8ToBase64URL(bytes) {return this.#uint8ToBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');}
}
module.exports = RID128B64;
