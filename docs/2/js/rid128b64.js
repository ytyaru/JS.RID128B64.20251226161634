// RID=RandomID, IID=IncrementID
class RID128B64 {
    static get() {return this.#uint8ToBase64URL(this.#random)}
    static get #random() {return crypto.getRandomValues(new Uint8Array(128/8))}
    static #uint8ToBase64(bytes) {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static #uint8ToBase64URL(bytes) {return this.#uint8ToBase64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
}
class RID128 {
    constructor(base=64) {
        this._ = {}
    }
}
class RID {// RandomID。分散システムID。任意ビット数の乱数で、任意Base表記文字列を出力する。「rid128b64-...」等のような文字列になる。
    constructor(base=64, bits=128) {
        this._ = {bits:bits, base:base}
    }
}
class IID {// IncrementID。中央システムID。0以上の整数を+1しながら返す。出力された文字列はASCIIコード表においてソート可能。baseは64迄。
    constructor(next=0n, base=10) {
        if (Number.isSafeInteger(next)) {next = BigInt(next)}
        if ('bigint'!==typeof next) {throw new TypeError(`nextはBigIntかNumber.isSafeInteger()が真を返す値であるべきです。`)}
        this._ = {count:next};
    }
    next() {return this._.count++;}
    get int() {return this._.count}
    get num() {
        if (BigInt(Number.MAX_SAFE_INTEGER) < this._.count) {throw new TypeError(`countはNumber.MAX_SAFE_INTEGERを超過しています。IEEE754規格により誤差が発生するためIDとして正常に使用できません。numでなくintを使用してください。`)}
        return Number(this._.count)
    }
    get str() {

    }

    #bigintToBase64(bigIntValue) {
        // 1. BigIntを16進数文字列に変換 (先頭の '0x' は除去)
        const hexString = bigIntValue.toString(16);
        // 2. 16進数文字列をバイト配列 (Uint8Array) に変換
        // 16進数1文字は4ビット、2文字で1バイトなので、文字列の長さは偶数にする必要あり
        const paddedHexString = hexString.length % 2 === 0 ? hexString : '0' + hexString;
        const bytes = new Uint8Array(paddedHexString.length / 2);
        for (let i = 0; i < paddedHexString.length; i += 2) {
            bytes[i / 2] = parseInt(paddedHexString.substring(i, i + 2), 16);
        }
        // 3. バイト配列をバイナリ文字列に変換し、btoaでBase64エンコード
        let binaryString = '';
        bytes.forEach(byte => {
            binaryString += String.fromCharCode(byte);
        });
        return window.btoa(binaryString); // ブラウザ環境の場合。Node.jsではBufferを使う
    }
}

class Base64URL extends Base64 {
    static valid(str) {return Base64._valid(str, 'Base64URL', /^[A-Za-z0-9\-_]+$/)}
    static fromBigInt(int) {
        const base64 = Base64.fromBigInt(int);
        return new Base64URL(base64._.str, base64._.u8a, base64._.int);
    }
    static fromU8a(u8a) {
        const base64 = Base64.fromU8a(u8a);
        return new Base64URL(base64._.str, base64._.u8a, base64._.int);
    }
    constructor(str, u8a, int) {
    //constructor(str, u8a, int, nonValid=false) {
        super(this.#padding(str.replaceAll('-','+').replaceAll('_','/')), u8a, int);
        this._.str = this._.str.replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
        super(str, u8a, int);
        nonValid ? super(str) : super(str, u8a, int);
        ;
        if (!nonValid) {

        }
        Base64.valids(str, u8a, int);
        super();
    }
}

/*
B64Int.toStr(int)
B64Str.toU8a(str)
B64U8a.toStr(u8a)
B64U8a.toIntBE(u8a)
B64Int.toU8aBE(int)
*/
class Base64 {
    static valids(str,u8a,int) {
        this.valid(str);
        if (u8a) {if(str!==this.#u8aToStr(u8a)){throw new TypeError(`strとu8aが代入されましたが、互いに異なる値です。両者共同じ値にしてください。`)}}
        if (int) {if(int!==this.#intToU8aBE(int))}{throw new TypeError(`strとu8aとintが代入されましたが、intの値がstrやu8aと異なる値です。全て同じ値にしてください。`)}}
        return true;
    }
    static valid(str) {return this._valid(str, 'Base64', /^[A-Za-z0-9\+\/]+$/)}
    static _valid(str, name, REG) {
        if ('string'!==typeof str) {throw new TypeError(`${name}はString値であるべきです。`)}
        if (str.match(/^[A-Za-z0-9\+\/]+$/)) {throw new TypeError(`${name}は正規表現${REG}に従ったString値であるべきです。`)}
        return true;
    }
    static fromBigInt(int) {
        // 1. BigIntを16進数文字列に変換 (先頭の '0x' は除去)
        const hexString = bigIntValue.toString(16);
        // 2. 16進数文字列をバイト配列 (Uint8Array) に変換
        // 16進数1文字は4ビット、2文字で1バイトなので、文字列の長さは偶数にする必要あり
        const paddedHexString = hexString.length % 2 === 0 ? hexString : '0' + hexString;
        const bytes = new Uint8Array(paddedHexString.length / 2);
        for (let i = 0; i < paddedHexString.length; i += 2) {
            bytes[i / 2] = parseInt(paddedHexString.substring(i, i + 2), 16);
        }
        // 3. バイト配列をバイナリ文字列に変換し、btoaでBase64エンコード
        let binaryString = '';
        bytes.forEach(byte => {
            binaryString += String.fromCharCode(byte);
        });
        return new Base64(window.btoa(binaryString), bytes); // ブラウザ環境の場合。Node.jsではBufferを使う
    }
    static fromU8a(u8a) {return new Base64('function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes)), u8a)}
    constructor(str, u8a, int) {
        Base64.valid(str);
        this._ = {str:str};
        this._.u8a = u8a instanceof Uint8Array ? u8a : this.#strToU8a(str);
        if (u8a) {if(str!==this.#u8aToStr(u8a)){throw new TypeError(`strとu8aが代入されましたが、互いに異なる値です。両者共同じ値にしてください。`)}}
        this._.int = 'bigint'===typeof int ? int : this.#u8aToIntBE(this._.u8a);
        if (int) {if(int!==this.#intToU8aBE(int))}{throw new TypeError(`strとu8aとintが代入されましたが、intの値がstrやu8aと異なる値です。全て同じ値にしてください。`)}}
    }
    get int() {return this._.int}
    get u8a() {return this._.u8a}
    get str() {return this._.str}
}
class B64Str {
    static valid(str, isURL) {return this._valid(str, `Base64${isURL ? : 'URL' : ''}`, isURL ? /^[A-Za-z0-9\-_]+$/ : /^[A-Za-z0-9\+\/]+$/)}
    static _valid(str, name, REG) {
        if ('string'!==typeof str) {throw new TypeError(`${name}はString値であるべきです。`)}
        if (str.match(REG)) {throw new TypeError(`${name}は正規表現${REG}に従ったString値であるべきです。`)}
        return true;
    }
    static toU8a(str) {
        const binStr = atob(str);
        const bytes = new Uint8Array(binStr.length);
        for (let i=0; i<binStr.length; i++) {bytes[i] = binStr.charCodeAt(i);}
        return bytes;
    }
}
class B64U8a {
    static toStr(u8a) {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static toIntBE(u8a) {// Uint8Array→BigInt(ビッグエンディアン)
        let result = BigInt(0);
        for (const byte of u8a) {result = (result << 8n) + BigInt(byte);}
        return result;
    }
    static toIntLE(u8a) {// Uint8Array→BigInt(リトルエンディアン)
        let result = BigInt(0);
        for (let i=u8a.length-1; i>= 0; i--) {result = (result << 8n) + BigInt(u8a[i]);}
        return result;
    }
}

class B64Int {
    static toStr(int) {
        // 1. BigIntを16進数文字列に変換 (先頭の '0x' は除去)
        const hexString = int.toString(16);
        // 2. 16進数文字列をバイト配列 (Uint8Array) に変換
        // 16進数1文字は4ビット、2文字で1バイトなので、文字列の長さは偶数にする必要あり
        const paddedHexString = hexString.length % 2 === 0 ? hexString : '0' + hexString;
        const bytes = new Uint8Array(paddedHexString.length / 2);
        for (let i = 0; i < paddedHexString.length; i += 2) {
            bytes[i / 2] = parseInt(paddedHexString.substring(i, i + 2), 16);
        }
        // 3. バイト配列をバイナリ文字列に変換し、btoaでBase64エンコード
        let binaryString = '';
        bytes.forEach(byte => {
            binaryString += String.fromCharCode(byte);
        });
        return btoa(binaryString); // ブラウザ環境の場合。Node.jsではBufferを使う
    }
    static toU8aBE(int) {// BigInt→Uint8Array（ビッグエンディアン）
        let hex = int.toString(16);
        if (hex.length % 2 !== 0) {hex = '0' + hex;} // 長さを偶数に調整
        const len = hex.length / 2;
        const u8a = new Uint8Array(len);
        for (let i=0; i<len; i++) {// 8ビットずつ右シフトして下位8ビットを抽出
            u8a[len-1-i] = Number(int & 0xffn);
            int >>= 8n;
        }
        return u8a;
    }
}

    /*
    static valid(str) {
        if ('string'!==typeof str) {throw new TypeError(`Base64はString値であるべきです。`)}
        if (str.match(/^[A-Za-z0-9\+\/]+$/)) {throw new TypeError(`Base64は正規表現/^[A-Za-z0-9\+\/]+$/に従ったString値であるべきです。`)}
        return true;
    }
    */
    /*
    #strToU8a(str) {
        const binStr = atob(str);
        const bytes = new Uint8Array(binStr.length);
        for (let i=0; i<binStr.length; i++) {bytes[i] = binStr.charCodeAt(i);}
        return bytes;
    }
    #u8aToStr(u8a) {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    #u8aToStr(u8a) {return }
    #u8aToIntBE(u8a) {// Uint8Array→BigInt(ビッグエンディアン)
        let result = BigInt(0);
        for (const byte of u8a) {result = (result << 8n) + BigInt(byte);}
        return result;
    }
    #u8aToIntLE(u8a) {// Uint8Array→BigInt(リトルエンディアン)
        let result = BigInt(0);
        for (let i=u8a.length-1; i>= 0; i--) {result = (result << 8n) + BigInt(u8a[i]);}
        return result;
    }
    #intToU8aBE(int) {// BigInt→Uint8Array（ビッグエンディアン）
        let hex = int.toString(16);
        if (hex.length % 2 !== 0) {hex = '0' + hex;} // 長さを偶数に調整
        const len = hex.length / 2;
        const u8a = new Uint8Array(len);
        for (let i=0; i<len; i++) {// 8ビットずつ右シフトして下位8ビットを抽出
            u8a[len-1-i] = Number(int & 0xffn);
            int >>= 8n;
        }
        return u8a;
    }
    */


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
