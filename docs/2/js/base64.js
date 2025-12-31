class IdError extends Error {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdError'}}
class IdDecordError extends IdError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdDecordError'}}
class IdEncordError extends IdError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdEncordError '}}
class IdHeadDecordError extends IdDecordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadDecordError'}}
class IdHeadEncordError extends IdEncordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadEncordError '}}
class IdBodyDecordError extends IdDecordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdBodyDecordError'}}
class IdBodyEncordError extends IdEncordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdBodyEncordError '}}
class IdHead {// 'RID128B64SUVP'のようなIDの型を示す文字列
    /**
     * IDメタデータの妥当性を判定し、詳細な構成を返す
     * @param {string} headString - ハイフン（乱数セパレータ）より前の文字列
     * @returns {object|null} 妥当なら解析オブジェクト、不当ならnull
     */
    static decode(headString) {
        // 1:Type, 2:ID(固定文字列), 3:数値(bitsかradix), 4:R+数値(明示的radix), 5:F(Full), 6:flags
        const pattern = /^([RTI])(ID)?(\d+(?:-\d+)?)?(?:R(\d+)|(F))?([SUVP]*)$/;
        const match = headString.match(pattern);

        //if (!match) return null;
        if (!match) {throw new IdHeadDecordError(`head文字列が不正です。次の正規表現に従ってください。${pattern}`)};

        let [_, type, hasId, rawNum, explicitRadix, isFull, flagsStr] = match;

        let bits = { time: 0, random: 0 };
        let radix = 64;

        // --- bits と radix の振り分けロジック ---
        let bitsPart = null;
        let radixPart = explicitRadix;

        if (rawNum) {
            // 明示的な基数指定(R32やF)が後ろにあるなら、前の数字(rawNum)は確実にbits
            if (explicitRadix || isFull) {
                bitsPart = rawNum;
            } 
            // 後ろに基数指定がない場合、仕様により「bits省略時はRも省略可」＝ radixとみなす
            else {
                radixPart = rawNum;
                bitsPart = null; // bitsはデフォルト(128)へ
            }
        }

        // --- bitsオブジェクトの構築 ---
        if (type === 'T') {
            const val = bitsPart || "128"; // 省略時は合計128
            if (val.includes('-')) {
                const [t, r] = val.split('-').map(Number);
                bits.time = t;
                bits.random = r;
            } else {
                const total = parseInt(val, 10);
                bits.time = 48; // Timedデフォルト
                bits.random = total - 48;
            }
//            if (bits.time < 48 || bits.random < 0) return null;
            if (bits.time < 48 || bits.random < 0) {throw new IdHeadDecordError(`timeBitsは48未満かrandomBitsが0以下です。各bitsを増やしてください。`)}
        } else {
            if (bitsPart && bitsPart.includes('-')) return null; // R,Iでハイフン不可
            bits.time = 0;
            bits.random = bitsPart ? parseInt(bitsPart, 10) : 128;
//            if (bits.random < 8) return null;
            if (bits.random < 8) {throw new IdHeadDecordError(`randomBitsが8より小さいです。増やしてください。`)}
        }

        // --- radixの確定 ---
        if (isFull) {
            radix = 1048576;
        } else if (radixPart) {
            radix = parseInt(radixPart, 10);
            //if (!((radix >= 2 && radix <= 64) || radix === 256)) return null;
            if (!((radix >= 2 && radix <= 64) || radix === 256)) {throw new IdHeadDecordError(`radixが不正値です。2〜64か256の整数かFのみ有効です。: ${radix}`)}
        }

        // --- flagsの確定 ---
        const flagSet = new Set(flagsStr);
//        if (flagSet.size !== flagsStr.length) return null;
        if (flagSet.size !== flagsStr.length) {throw new IdHeadDecordError(`flagが不正値です。SUVPの4字のみ有効です。: ${flagStr}`)}

        return {
            type,
            bits,
            radix,
            flags: {
                S: flagSet.has('S'),
                U: flagSet.has('U'),
                V: flagSet.has('V'),
                P: flagSet.has('P')
            }
        };
    }
    /**
     * 解析オブジェクトからメタデータ文字列を生成する
     * @param {object} obj - type, bits, radix, flags を持つオブジェクト
     * @returns {string} メタデータ文字列
     */
    static encode(obj) {
        const { type, bits, radix, flags } = obj;
        let res = type + "ID";

        const isDefaultBits = (type === 'T') 
            ? (bits.time === 48 && bits.random === 80) 
            : (bits.time === 0 && bits.random === 128);
        const isDefaultRadix = (radix === 64);

        // bitsがデフォルトでない場合のみ出力
        if (!isDefaultBits) {
            if (type === 'T') {
                res += `${bits.time}-${bits.random}`;
            } else {
                res += bits.random;
            }
        }

        // radixの出力
        if (radix === 1048576) {
            res += "F";
        } else if (!isDefaultRadix) {
            // bitsが省略されている場合は R も省略可能 (RID32 形式)
            // bitsがある場合は区別のため R をつける (RID256R32 形式)
            if (isDefaultBits) {
                res += radix;
            } else {
                res += "R" + radix;
            }
        }

        // flags
        ['S', 'U', 'V', 'P'].forEach(f => {
            if (flags[f]) res += f;
        });

        return res;
    }
    constructor(str) {
        this._ = IdHead.decode(str);
    }
    get type() {return this._.type}
    get timeBits() {return this._.bits.time}
    get randomBits() {return this._.bits.random}
    get radix() {return this._.radix}
    get sortable() { return this._.flags.S }
    get urlUnsafed() { return this._.flags.U }
    get visibled() { return this._.flags.V }
    get padded() { return this._.flags.P }
}

export const id = (head='RID128R64', nextInt=0n)=>{
};
export class ID {
    static get(head='RID128R64', nextInt=0n) {
    }
    static convert(ins, head) {
    }
}
class BaseN {// 2〜63
    constructor(head) {}
    get full() {}
    get head() {}
    get body() {}
}
const IdKinds = ['R','T','I'];
class BaseNStringHead {
    constructor(kind, bits, radix, sortabled=false, urlUnsafed=false, visibled=false, padded=false) {}
    get kind() {}
    get bits() {}
    get radix() {}
    get sortabled() {}
    get urlUnsafed() {}
    get visibled() {}
    get padded() {}
    get str() {} // 'RID128R64SUVP'のような文字列を返す
    #encode(kind, bits, radix, sortabled=false, urlUnsafed=false, visibled=false, padded=false) {
        
    }
    #decode(head) {
        /^(?:<kind>(R|T|I)ID(?:<bits>\d+)?R?(?:<radix>(\d+|U))?(?:<flags>S?U?V?P?))-(?:<random>.+)$/
    }
    #encodeKind(kind) {
        if (Number.isSafeInteger(kind)) {throw new TypeError(`kindは安全な整数値であるべきです。`)}
        if (kind < 0 || IdKinds.length <= kind) {throw new TypeError(`kindは0〜${IdKinds.length-1}のいずれかであるべきです。`)}
    }
}

class BaseNString {
    constructor(head, body) {}
    get full() {}
    get head() {}
    get body() {}
    set body(v) {}
}
class BaseNStringBody {
    get str() {}
    get u8a() {}
    get int() {}
    set str(v) {}
    set u8a(v) {}
    set int(v) {}
}

// B64Int.getPaddingNum(this._.int, 64))
export class SomeBase {
    static fromRadix(radix, sortable, visibled, urlSafed, padded) {
        if (!Number.isSafeInteger(radix)) {throw new TypeError(`radixはNumber.isSafeInteger()がtrueを返す値であるべきです。`)}
        if ((radix < 2 || 64 < radix) && [256, 1048576].some(v=>v!==radix)) {throw new TypeError(`radixは2〜64か256か1048576のいずれかであるべきです。`)}
        if ([256, 1048576].some(v=>v===radix) && [visibility, sortable].some(v=>v)) {throw new TypeError(`radixが256か1048576の時はvisibilityやsortableは無効です。`)}
        if (radix===1048576) {return Base1048576}
        else if (radix===256) {return Base256}
        else if (radix===64) {return Base64URL}
        else {return BaseN}
    }
    static fromChars(chars, arrowMultiBytePerChar=false, onlyTwoPowLen=false, padded=false) {
        return new BaseC(chars, arrowMultiBytePerChar, onlyTwoPowLen, padded);
    }
    static convert(ins, radixOrChars) {// Base64をBase36に変換等

    }
}
class BaseChar {
    static #A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    static #a = 'abcdefghijklmnopqrstuvwxyz';
    static #N = '0123456789';
    static #S = '-_';
    static #s = '+/';
    static #P = '=';
    static #B = this.#A + this.#a;
    static #C = [this.#B, this.#N];
    static #62LE(radix=62, sortable=false) {return (sortable ? this.#C.reverse() : this.#C).join('').slice(0, radix)}
    static #62S =  `${this.#N}${this.#A}${this.#a}`;
    static #64US = `-${this.#N}${this.#A}_${this.#a}`;
    static #64S =  `+/${this.#N}${this.#A}${this.#a}`;
    static #62 =   `${this.#A}${this.#a}${this.#N}`;
    //static #62 =   this.#62LE();
    static #64U =  `${this.B62}${this.#S}`;
    static #64 =   `${this.B62}${this.#s}`;
    static #32  = this.#A + this.#N.slice(2,7);
    static #32H = this.#62LE(32, true);
    static #getConfusingChars(radix=55) {
        return 62 <=radix ? '' : (
               61===radix ? '0' : (
               60===radix ? '01' : (
               59===radix ? '1Il' : (
               58===radix ? '0OIl' : (
               57===radix ? '0O1Il' : (
               56===radix ? '0O1Il8' :
               56===radix ? '0O1Il8' : '0O1Il8B'))))));
    }
    static #getChars(radix, sortable, visibled, urlSafed, padded) {
        if      (64===radix) {return sortable ? this.#64H : (urlSafed ? this.#64U : this.#64)}
        else if (63===radix) {return this.#getChars(64, sortable, visibled, urlSafed, padded).slice(0, radix)}
        else if (32===radix) {return sortable ? this.#32H : this.#32}
        else {
            const S = this.#62LE(62, sortable);
            return (visibled ? ([...this.#getConfusingChars(radix)].reduce((s,v)=>s.replace(v,''), S)) : S).slice(0,radix);
        }
    }
    static get(radix, sortable, visible, urlSafed, padded) {
        if (!(Number.isSafeInteger(radix) && 2 <= radix && radix <= 64)) {throw new TypeError(`radixは2〜64の整数であるべきです。`)}
        sortable = sortable ?? ![32,64].some(v=>v===radix);
        urlSafed = urlSafed ?? true;
        if (64===radix && urlSafed && true===padded) {throw new TypeError(`radix=64, urlSafed=trueの時、paddedはfalseであるべきです。`)}
        padded = padded ?? false;
        visibled = visibled ?? [32,58].some(v=>v===radix);
        if ('boolean'!==typeof sortabale) {throw new TypeError(`sortableは真偽値であるべきです。`)}
        if ('boolean'!==typeof urlSafed) {throw new TypeError(`urlSafedは真偽値であるべきです。`)}
        if ('boolean'!==typeof padded) {throw new TypeError(`paddedは真偽値であるべきです。`)}
        if ('boolean'!==typeof visibled) {throw new TypeError(`paddedは真偽値であるべきです。`)}
        return #getChars(radix, sortable, visibled, urlSafed, padded);
    }
    static valid(chars, arrowMultiBytePerChar=false, onlyTwoPowLen=false, padded=false) {
        if ('string'!==typeof chars) {throw new TypeError(`charsは文字列であるべきです。`)}
        const C = Array.from(chars);
        const radix = C.length;
        if (radix < 2 || 256 < radix) {throw new TypeError(`charsの字数は2〜256であるべきです。`)}
        if ((new Set(C)).size!==radix) {throw new TypeError(`charsに重複文字があります。`)}
        if (!arrowMultiBytePerChar && !C.every(c=>1===c.length)) {throw new TypeError(`arrowMultiBytePerCharがfalseなのに、charsに1Byte文字以外の字が混入しています。`)}
        if (onlyTwoPowLen && this.#isPowerOfTwo(C.length)) {throw new TypeError(`onlyTwoPowLenがtrueなのに、charsの字数が2〜256以内の2の冪乗ではありません。`)}
        return {
            chars: chars,
            radix: radix,
            sortable: Array.from(chars).sort().join('')===C.join(''),
            visibled: this.#isVisibled(chars),
            urlSafed: chars.match(/^[A-Za-z0-9\-_]+$/),
            padded: padded,
        };
    }
    static #isVisibled(chars) {return Array.from(this.#getConfusingChars(chars.length)).every(c=>-1===chars.indexOf(c));}
    //static #isVisibled(chars) {return 2 <= chars.length && chars.length <= 62 ? Array.from(this.#getConfusingChars( (32===chars.length ? 60 : chars.length) )).every(c=>-1<chars.indexOf(c)) : false;}
}
class BaseC {// C=任意使用文字列
    constructor(bits, chars, arrowMultiBytePerChar=false, onlyTwoPowLen=false, padded=false) {
        this._ = {spec:BaseChars.valid(chars, arrowMultiBytePerChar, onlyTwoPowLen, padded), v:{str:null, u8a:null, int:null}};
        if (!(Number.isSafeInteger(bits) && 8<=bits)) {throw new TypeError(`bitsは8以上でNumber.isSafeInteger()がtrueを返す値であるべきです。`)}
        this._.spec.bits = bits;
    }
    get bits() {return this._.spec.bits}
    get chars() {return this._.spec.chars}
    get sortable() {return this._.spec.sortable}
    get visibled() {return this._.spec.visibled}
    get urlSafed() {return this._.spec.urlSafed}
    get padded() {return this._.spec.padded}
    get str() {return this._.v.str}
    get u8a() {return this._.v.u8a}
    get int() {return this._.v.int}
    set str(v) {
        if ('string'!==typeof v) {throw new TypeError(`代入値はString値であるべきです。`)}
        if (Array.from(v).some(c=>-1===this._.spec.chars.indexOf(c))) {throw new TypeError(`代入値に無効な文字が含まれています。次の文字だけで構成してください。:${this._.spec.chars}`)}
        this._.v.str = v;
        this._.v.u8a = B64Str.toU8a(v);
        this._.v.int = B64Str.toInt(v);
        const expectedBits = (this.padded ? 0 : B64Int.getPaddingNum(this._.v.int, this._.spec.chars.length)) + (this._.v.u8a.byteLength*8);
        if (this.bits!==expectedBits) {throw new TypeError(`bitsが一致しません。期待値:${bits}, 実際値:${this._.v.u8a.byteLength*8}`)}
    }
    set u8a(v) {
        if (v instanceof Uint8Array) {throw new TypeError(`代入値はUint8Arrayインスタンスであるべきです。`)}
        this._.v.u8a
    }
    set int(v) {
        this._.v.int
    }

    valid(str) {

    }
}
class BaseN {// X=2〜63
    constructor(str, u8a, int) {

    }

}

export class Base64URL extends Base64 {
    static valid(str) {B64U.valid(str); return this.#calcBase64Padding(str);}
    static fromBigInt(int) {return new Base64URL(B64Str.toBase64URL(B64Int.toStr(int)), B64Int.toU8a(int), int);}
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
class Base64 {
    static encode(data) {
        if ('bigint'===typeof data) {return this.#u8aToStr(B64Int.toU8a(data));}
        else if (data instanceof Uint8Array) {return this.#u8aToStr(u8a);}
        else {throw new TypeError(`dataはUint8ArrayインスタンスかBigInt値であるべきです。`)}
    }
    static #u8aToStr(u8a) {return 'function'===typeof u8a.toBase64 ? u8a.toBase64() : btoa(String.fromCharCode(...u8a))}
    static decode(str, toInt=false) {
        if ('string'!==typeof str){throw new TypeError(`strはString値であるべきです。`)}
        if (!str.match(this.#R)){throw new TypeError(`strは正規表現 ${this.#R} にマッチすべきです。`)}
        return toInt ? B64Str.toInt(str) : this.#strToU8a(str);
    }
    static #R = /^[A-Za-z0-9\+\/]+$/;
    static #strToU8a(str) {
        if ('function'===typeof Uint8Array.fromBase64) {return Uint8Array.fromBase64(str);}
        // フォールバック: atob を使用して変換
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {bytes[i] = binaryString.charCodeAt(i);}
        return bytes;
    }
}
export class Base64 {
    static valids(str,u8a,int) {
        this.valid(str);
        if (u8a) {if(str!==B64U8a.toStr(u8a)){throw new TypeError(`strとu8aが代入されましたが、互いに異なる値です。両者共同じ値にしてください。`)}}
        if (int) {if(int!==B64Int.toU8a(int))}{throw new TypeError(`strとu8aとintが代入されましたが、intの値がstrやu8aと異なる値です。全て同じ値にしてください。`)}}
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
        if (int) {if(int!==B64Int.toU8a(int))}{throw new TypeError(`strとu8aとintが代入されましたが、intの値がstrやu8aと異なる値です。全て同じ値にしてください。`)}}
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
    static toInt(str) {return B64U8a.toIntBE(this.toU8a(str))}
    static toBase64URL(str) {return str.replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
}
class B64U8a {
    static toStr(u8a) {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static toInt(u8a, isLE=false) {// Uint8Array→BigInt(エンディアン選択可)
        let result = BigInt(0);
        const len = u8a.length;
        for (let i=0; i<len; i++) {
            const index = isLE ? (len - 1 - i) : i;
            result = (result << 8n) + BigInt(u8a[index]);
        }
        return result;
    }
    static toIntBE(u8a) {return this.toInt(u8a, false)} // ビッグエンディアン
    static toIntLE(u8a) {return this.toInt(u8a, true)} // リトルエンディアン
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
    static toU8a(int, isLE=false) {// BigInt→Uint8Array（エンディアン選択可）
        let hex = int.toString(16);
        if (hex.length % 2 !== 0) {hex = '0' + hex;} // 長さを偶数に調整
        const len = hex.length / 2;
        const u8a = new Uint8Array(len);
        for (let i=0; i<len; i++) {
            const index = isLE ? i : len - 1 - i; // (リトル|ビッグ)エンディアン切替
            u8a[index] = Number(int & 0xffn);
            int >>= 8n;
        }
        return u8a;
    }
    static toU8aBE(int) {return this.toU8a(int,false)} // ビッグエンディアン
    static toU8aLE(int) {return this.toU8a(int,true)} // リトルエンディアン
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
