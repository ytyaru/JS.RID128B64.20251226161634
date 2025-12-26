class RID128B64 {
    static get(bits=128) {return this.#uint8ToBase64URL(this.#random(bits))}
    static #random(bits) {return crypto.getRandomValues(new Uint8Array(this.#bit2byte(bits)))}
    static #uint8ToBase64(bytes) {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static #uint8ToBase64URL(bytes) {return this.#uint8ToBase64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
    static #bit2byte(bits) {this.#throwBits(bits); return bits/8;}
    static #throwBits(bits) {if(!this.#isPowOf2GE8(bits)){throw new TypeError(`bitsは8以上の2の冪乗であるべきです。`)}}
    static #isPowOf2GE8(n) {return Number.isSafeInteger(n) && 8 <= n && 0===(n & (n - 1));}
    static from(v) {// String/Uint8Array 相互変換 get() で取得した文字列をバイナリに変換する
        if (v instanceof Uint8Array) {
            if (!this.#isPowOf2GE8(v.byteLength*8)) {throw new TypeError(`Uint8Arrayの長さが不正です。2の冪乗bitsであるべきです。`)}
            return this.#uint8ToBase64URL(v);
        } else if ('string'===typeof v) {
            if (!v.match(/^[A-Za-z0-9\-_]+$/)) {throw new TypeError(`Base64URL文字列ではありません。次の正規表現に従ってください。/^[A-Za-z0-9\-_]+$/`)}
            const bits = this.#calculateBitsFromBase64URLLength(v.length);
            if (!this.#isPowOf2GE8(bits)) {throw new TypeError(`Base64URL文字列の長さが不正です。`)}
            return this.#base64URLToUint8Array(v);
        } else {throw new TypeError(`from()の引数はUint8ArrayインスタンスかBase64URL文字列であるべきです。`)}
    }
    /**
     * Base64URL文字列をUint8Arrayに変換する
     * @param {string} base64url - Base64URL形式の文字列
     * @returns {Uint8Array}
     */
    static #base64URLToUint8Array(base64url) {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {base64 += '=';} // パディング
        // Uint8Array.fromBase64 が利用可能か (ECMAScript 2024+ / Node.js 22+)
        if (typeof Uint8Array.fromBase64 === 'function') {return Uint8Array.fromBase64(base64);}
        // フォールバック: atob を使用して変換
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {bytes[i] = binaryString.charCodeAt(i);}
        return bytes;
    }
    // データのビット数からBase64URL文字列長を算出する
    #calculateBase64URLLength(bits) {return this.#calculateBase64Length(bits, false)}
    #calculateBase64Length(bits, usePadding=true) {
        if (usePadding) {
            const bytes = Math.ceil(bits / 8);
            return Math.ceil(bytes / 3) * 4;
        } else {return Math.ceil(bits / 6);}
    }
    // Base64URL文字数からデータのビット数を算出する
    #calculateBitsFromBase64URLLength(length) {
        const maxPossibleBits = length * 6;
        const power = Math.floor(Math.log2(maxPossibleBits));
        const bits = Math.pow(2, power);
        return bits < 8 ? 8 : bits;
    }
}
