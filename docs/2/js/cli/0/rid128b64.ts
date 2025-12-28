export default class RID128B64 {
    static get():string {return this.#uint8ToBase64URL(this.#random)}
    static get #random():Uint8Array {return crypto.getRandomValues(new Uint8Array(128/8))}
    static #uint8ToBase64(bytes:Uint8Array):string {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static #uint8ToBase64URL(bytes:Uint8Array):string {return this.#uint8ToBase64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
}
