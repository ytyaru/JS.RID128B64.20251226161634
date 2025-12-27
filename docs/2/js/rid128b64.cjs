const crypto = require('node:crypto');
class RID128B64 {
    static get() {return this.#uint8ToBase64URL(this.#random);}
    static get #random() {return crypto.getRandomValues(new Uint8Array(128/8));}
    static #uint8ToBase64(bytes) {return Buffer.from(bytes).toString('base64');}
    static #uint8ToBase64URL(bytes) {return this.#uint8ToBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');}
}
class Base64 {
    static valid(str) {
        if ('string'!==typeof str) {throw new TypeError(`Base64はString値であるべきです。`)}
        if (str.match(/^[A-Za-z0-9\+\/]+$/)) {throw new TypeError(`Base64は正規表現/^[A-Za-z0-9\+\/]+$/に従ったString値であるべきです。`)}
        return true;
    }
    static fromBigInt(int) {return Buffer.from(bigIntValue.toString(16), 'hex').toString('base64');}
    static fromU8a(u8a) {return new Base64('function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes)), u8a)}
    constructor(str, u8a) {
        Base64.valid(str);
        this._ = {str:str, u8a:null, int:0n};
    }
    get int() {}
    get str() {}
    get u8a() {}
}

module.exports = RID128B64;
