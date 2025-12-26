// 128bit長のバイナリをBase64URLで表現する（モジュロバイアス無し）
class RID128B64 {
    static get() {return this.#uint8ToBase64URL(this.#random)}
    static get #random() {return crypto.getRandomValues(new Uint8Array(128/8))}
    static #uint8ToBase64(bytes) {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static #uint8ToBase64URL(bytes) {return this.#uint8ToBase64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
}
