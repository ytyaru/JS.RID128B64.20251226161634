export class Base64URL extends Base64 {
    static valid(str) {B64U.valid(str); return this.#calcBase64Padding(str);}
    static fromBigInt(int) {return new Base64URL(B64Str.toBase64URL(B64Int.toStr(int)), B64Int.toU8aBE(int), int);}
    static fromU8a(u8a) {return new Base64URL(B64Str.toBase64URL(B64U8a.toStr(u8a)), u8a, B64U8a.toIntBE(u8a));}
    constructor(str, u8a, int) {
        const padNum = B64UStr.valid(str);
        super(B64UStr.toBase64(str, padNum), u8a, int);
        this._.str = str;
        this._.padNum = padNum;
    }
    toBase64() {return new Base64(this.#toBaset64(this._.str, this._.padNum), this._.u8a, this._.int)}
    #toBase64(str, padNum) {return (str ?? this._.str).replaceAll('-','+').replaceAll('_','/') + '='.repeat(padNum}
}
export class Base64 {
    static valids(str,u8a,int) {
        this.valid(str);
        if (u8a) {if(str!==B64U8a.toStr(u8a)){throw new TypeError(`strとu8aが代入されましたが、互いに異なる値です。両者共同じ値にしてください。`)}}
        if (int) {if(int!==B64Int.toU8aBE(int))}{throw new TypeError(`strとu8aとintが代入されましたが、intの値がstrやu8aと異なる値です。全て同じ値にしてください。`)}}
        return true;
    }
    static valid(str) {return B64.valid(str);}
    static fromBigInt(int) {return new Base64(B64Int.toStr(int));} // ブラウザ環境の場合。Node.jsではBufferを使う
    static fromU8a(u8a) {return new Base64('function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes)), u8a)}
    constructor(str, u8a, int) {
        Base64.valid(str);
        this._ = {str:str};
        this._.u8a = u8a instanceof Uint8Array ? u8a : B64Str.toU8a(str);
        if (u8a) {if(str!==B64U8a.toStr(u8a)){throw new TypeError(`strとu8aが代入されましたが、互いに異なる値です。両者共同じ値にしてください。`)}}
        this._.int = 'bigint'===typeof int ? int : B64U8a.toIntBE(this._.u8a);
        if (int) {if(int!==B64Int.toU8aBE(int))}{throw new TypeError(`strとu8aとintが代入されましたが、intの値がstrやu8aと異なる値です。全て同じ値にしてください。`)}}
    }
    get int() {return this._.int}
    get u8a() {return this._.u8a}
    get str() {return this._.str}
    toBase64URL() {return new Base64URL(B64Str.toBase64URL(this._.str), this._.u8a, this._.int))}
}
class ValidStr {
    static valid(str, name, REG) {
        if ('string'!==typeof str) {throw new TypeError(`${name}はString値であるべきです。`)}
        if (str.match(REG)) {throw new TypeError(`${name}は正規表現${REG}に従ったString値であるべきです。`)}
        return true;
    }
}
class B64UStr extends ValidStr {
    static valid(str, isURL) {super.valid(str, `Base64URL`, /^[A-Za-z0-9\-_]+$/); return this.#calcBase64Padding(base64URL);}
    static toBase64(base64URL, padNum) {return base64URL.replaceAll('-','+').replaceAll('_','/') + '='.repeat(padNum ?? this.#calcBase64Padding(base64URL))}
    static #calcBase64Padding(base64URL) {
        const L = base64URL.length; // Base64URL文字列の長さ (パディングなし)
        const R = length % 4; // 長さを4で割った余りを計算
        if (1===R) {throw new TypeError(`Base64URLは無効な長さです。`)}
        return 0===R ? 0 : (2===R ? 2 : 1);
    }
}
class B64Str extends ValidStr {
    static valid(str, isURL) {return super.valid(str, `Base64`, /^[A-Za-z0-9\+\/]+$/)}
    static toU8a(str) {
        const binStr = atob(str);
        const bytes = new Uint8Array(binStr.length);
        for (let i=0; i<binStr.length; i++) {bytes[i] = binStr.charCodeAt(i);}
        return bytes;
    }
    static toBase64URL(str) {return str.replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
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
    static getPaddingNum(I, radix=64) {// 値Iが基数radixの時、必要なパディング数を返す（I,radixはBigInt型。戻り値はNumber型）
        if (0n===I) {return 1;} // 0または1を扱う特殊なケース
        let [padding,power] = [0n,1n];
        if ('bigint'!==radix) {radix = BigInt(radix)}
        while (power <= I) {power *= radix; padding++;}
        return Number(padding); // パディング数はNumber型で返しても一般的に問題ない
    }
}
export class Base256 {
    static get #chars() {return Array.from('⠀⢀⠠⢠⠐⢐⠰⢰⠈⢈⠨⢨⠘⢘⠸⢸⡀⣀⡠⣠⡐⣐⡰⣰⡈⣈⡨⣨⡘⣘⡸⣸⠄⢄⠤⢤⠔⢔⠴⢴⠌⢌⠬⢬⠜⢜⠼⢼⡄⣄⡤⣤⡔⣔⡴⣴⡌⣌⡬⣬⡜⣜⡼⣼⠂⢂⠢⢢⠒⢒⠲⢲⠊⢊⠪⢪⠚⢚⠺⢺⡂⣂⡢⣢⡒⣒⡲⣲⡊⣊⡪⣪⡚⣚⡺⣺⠆⢆⠦⢦⠖⢖⠶⢶⠎⢎⠮⢮⠞⢞⠾⢾⡆⣆⡦⣦⡖⣖⡶⣶⡎⣎⡮⣮⡞⣞⡾⣾⠁⢁⠡⢡⠑⢑⠱⢱⠉⢉⠩⢩⠙⢙⠹⢹⡁⣁⡡⣡⡑⣑⡱⣱⡉⣉⡩⣩⡙⣙⡹⣹⠅⢅⠥⢥⠕⢕⠵⢵⠍⢍⠭⢭⠝⢝⠽⢽⡅⣅⡥⣥⡕⣕⡵⣵⡍⣍⡭⣭⡝⣝⡽⣽⠃⢃⠣⢣⠓⢓⠳⢳⠋⢋⠫⢫⠛⢛⠻⢻⡃⣃⡣⣣⡓⣓⡳⣳⡋⣋⡫⣫⡛⣛⡻⣻⠇⢇⠧⢧⠗⢗⠷⢷⠏⢏⠯⢯⠟⢟⠿⢿⡇⣇⡧⣧⡗⣗⡷⣷⡏⣏⡯⣯⡟⣟⡿⣿');}
}
export class Base1048576 {// UTF8で安全に使える文字はU+10000 〜 U+10FFFF の約104万文字分。20bitを1字に変換するのが最大効率。2**20=1048576 20bitマッピング(UTF8効率重視)
    /**
     * 20bitのデータをUnicodeの「追加多言語面(U+10000-U+1FFFF)」の1文字に変換
     * UTF-8で出力した際、元のデータ密度を高く保ちつつ、不正な文字を回避します。
     */
    static OFFSET = 0x10000; // マッピング開始地点（表示可能な領域）
    constructor(u8a) {this._={u8a:u8a, str:this.encode(u8a)}}
    encode(u8a) {return this.#packTo20BitString(u8a ?? this._.u8a)}
    decode(str) {return this.#unpackFrom20BitString(str ?? this._.str, this._.u8a.byteLength)}
    #packTo20BitString(uint8Array) {
        let binary = "";
        // バッファをビット列として扱うために1文字ずつ連結（簡易実装）
        for (let b of uint8Array) {binary += b.toString(2).padStart(8, '0');}
        let result = "";
        // 20bitずつ切り出して1文字に変換
        for (let i = 0; i < binary.length; i += 20) {
            const chunk = binary.slice(i, i + 20);
            if (chunk.length === 0) break;
            const val = parseInt(chunk.padEnd(20, '0'), 2);
            result += String.fromCodePoint(Base1048576.OFFSET + val);
        }
        return result;
    }
    #unpackFrom20BitString(str, originalByteLength) {
        const chars = Array.from(str);
        let binary = "";
        for (let char of chars) {
            const val = char.codePointAt(0) - Base1048576.OFFSET;
            binary += val.toString(2).padStart(20, '0');
        }
        const uint8Array = new Uint8Array(originalByteLength);
        for (let i = 0; i < originalByteLength; i++) {
            const byteStr = binary.slice(i * 8, i * 8 + 8);
            uint8Array[i] = parseInt(byteStr, 2);
        }
        return uint8Array;
    }
}
export class Base65536 {// 0x0000〜0xFFFF
    /**
     * Uint8Arrayを16bit単位で1文字の文字列に変換する
     * ※UTF-8で保存・出力すると、1文字あたり3バイト消費するため、
     * 元のバイナリ（2バイト）よりサイズは増える（約1.5倍）。
     */
    packUint8ArrayToString(uint8Array) {
        if (!(uint8Array instanceof Uint8Array)) {throw new TypeError(`u8aはUint8Arrayであるべきです。`)}
        if (uint8Array.length % 2 !== 0) {
            // 長さが奇数の場合はゼロパディングするなどの処理が必要
            const padded = new Uint8Array(uint8Array.length + 1);
            padded.set(uint8Array);
            uint8Array = padded;
        }
        const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
        let result = "";
        for (let i = 0; i < uint8Array.length; i += 2) {
            // 16bit(0-65535)の数値を取得
            const uint16 = view.getUint16(i, true); // リトルエンディアン
            // Unicode文字に変換
            result += String.fromCharCode(uint16);
        }
        return result;
    }
    // 文字列を元のUint8Arrayに復元する
    unpackStringToUint8Array(str) {
        const uint8Array = new Uint8Array(str.length * 2);
        const view = new DataView(uint8Array.buffer);

        for (let i = 0; i < str.length; i++) {
            const uint16 = str.charCodeAt(i);
            view.setUint16(i * 2, uint16, true);
        }
        return uint8Array;
    }
}
// B64Int.getPaddingNum(this._.int, 64))
export class BaseN {
    constructor(radix=64) {
        if (!Number.isSafeInteger(radix)) {throw new TypeError(`radixはNumber.isSafeInteger()がtrueを返す値であるべきです。`)}
        if ((radix < 2 || 64 < radix) && 256!==radix) {throw new TypeError(`radixは2〜64か256か65536のいずれかであるべきです。`)}
    }
}

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
