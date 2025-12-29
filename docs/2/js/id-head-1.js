class IdError extends Error {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdError'}}
class IdDecordError extends IdError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdDecordError'}}
class IdEncordError extends IdError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdEncordError '}}
class IdHeadDecordError extends IdDecordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadDecordError'}}
class IdHeadEncordError extends IdEncordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadEncordError '}}
class IdBodyDecordError extends IdDecordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdBodyDecordError'}}
class IdBodyEncordError extends IdEncordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdBodyEncordError '}}
class IdHead {// 'RID128B64SUVP'のようなIDの型を示す文字列
    static decode(headString) {
        // 1:Type, 2:ID(固定文字列), 3:数値(bitsかradix), 4:R+数値(明示的radix), 5:F(Full), 6:flags
        const pattern = /^([RTI])(ID)?(\d+(?:-\d+)?)?(?:R(\d+)|(F))?([SUVP]*)$/;
        const match = headString.match(pattern);

        if (!match) {throw new IdHeadDecordError(`head文字列が不正です。: ${headString}`);}

        let [_, type, hasId, rawNum, explicitRadix, isFull, flagsStr] = match;

        let bits = { time: 0, random: 0 };
        let radix = 64;

        let bitsPart = null;
        let radixPart = explicitRadix;

        // --- bits と radix の振り分けロジックの修正 ---
        if (rawNum) {
            // ハイフンが含まれる、または後ろに明示的なradix(R/F)がある場合は bitsPart
            if (rawNum.includes('-') || explicitRadix || isFull) {
                bitsPart = rawNum;
            } 
            // それ以外は仕様に基づき radix とみなす
            else {
                radixPart = rawNum;
                bitsPart = null;
            }
        }

        // --- bitsオブジェクトの構築 ---
        if (type === 'T') {
            const val = bitsPart || "128";
            if (val.includes('-')) {
                const [t, r] = val.split('-').map(Number);
                bits.time = t;
                bits.random = r;
            } else {
                const total = parseInt(val, 10);
                bits.time = 48;
                bits.random = total - 48;
            }
            if (bits.time < 48 || bits.random < 0) {
                throw new IdHeadDecordError(`timeBitsは48以上、randomBitsは0以上必要です。`);
            }
        } else {
            // R, I タイプでハイフン形式は禁止
            if (bitsPart && bitsPart.includes('-')) {
                throw new IdHeadDecordError(`R/Iタイプではハイフン形式のbits指定はできません。`);
            }
            bits.time = 0;
            bits.random = bitsPart ? parseInt(bitsPart, 10) : 128;
            if (bits.random < 8) {
                throw new IdHeadDecordError(`randomBitsが8より小さいです。: ${bits.random}`);
            }
        }

        // --- radixの確定 ---
        if (isFull) {
            radix = 1048576;
        } else if (radixPart) {
            radix = parseInt(radixPart, 10);
            if (!((radix >= 2 && radix <= 64) || radix === 256)) {
                throw new IdHeadDecordError(`radixが不正値です(2〜64, 256, F): ${radix}`);
            }
        }

        // --- flagsの確定 ---
        const flagSet = new Set(flagsStr);
        if (flagSet.size !== flagsStr.length) {
            throw new IdHeadDecordError(`flagに重複があります: ${flagsStr}`);
        }

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

    static encode(obj) {
        const { type, bits, radix, flags } = obj;
        let res = type + "ID";

        const isDefaultBits = (type === 'T') 
            ? (bits.time === 48 && bits.random === 80) 
            : (bits.time === 0 && bits.random === 128);
        const isDefaultRadix = (radix === 64);

        if (!isDefaultBits) {
            res += (type === 'T') ? `${bits.time}-${bits.random}` : bits.random;
        }

        if (radix === 1048576) {
            res += "F";
        } else if (!isDefaultRadix) {
            // bitsがデフォルトなら数値直結(RID32)、指定ありならR連結(RID256R32)
            res += isDefaultBits ? radix : "R" + radix;
        }

        ['S', 'U', 'V', 'P'].forEach(f => { if (flags[f]) res += f; });
        return res;
    }
    constructor(str) {this._ = IdHead.decode(str);}
    get type() { return this._.type; }
    get timeBits() { return this._.bits.time; }
    get randomBits() { return this._.bits.random; }
    get radix() { return this._.radix; }
    get sortable() { return this._.flags.S; }
    get urlUnsafed() { return this._.flags.U; }
    get visibled() { return this._.flags.V; }
    get padded() { return this._.flags.P; }
}
export {IdError,IdDecordError,IdEncordError,IdHeadDecordError,IdHeadEncordError,IdBodyDecordError,IdBodyEncordError,IdHead};
