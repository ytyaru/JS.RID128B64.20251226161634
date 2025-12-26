class RID128B64 {// 128bit長のバイナリをBase64URLで表現する（モジュロバイアス無し）
    static get() {return this.#uint8ToBase64URL(this.#random)}
    static get #random() {return crypto.getRandomValues(new Uint8Array(128/8))}
    //static #uint8ToBase64(bytes) {return window.btoa(bytes.reduce((b,v)=>b+String.fromCharCode(v),''))}
    static #uint8ToBase64(bytes) {return bytes.toBase64()}
    static #uint8ToBase64URL(bytes) {return this.#uint8ToBase64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
}
