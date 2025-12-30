class IdError extends Error {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdError'}}
class IdDecordError extends IdError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadDecordError'}}
class IdEncordError extends IdError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadEncordError '}}
class IdHeadDecordError extends IdDecordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadDecordError'}}
class IdHeadEncordError extends IdEncordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdHeadEncordError '}}
class IdBodyDecordError extends IdDecordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdBodyDecordError'}}
class IdBodyEncordError extends IdEncordError {constructor(msg, cause) {cause ? super(msg, cause) : super(msg); this.name='IdBodyEncordError '}}

class IdHead {
    /**
     * IDメタデータの妥当性を判定し、詳細な構成を返す
     */
    static decode(headString) {
        const pattern = /^([RTI])(ID)?(\d+(?:-\d+)?)?(?:R(\d+)|(F))?([SUVP]*)$/;
        const match = headString.match(pattern);
        if (!match) throw new IdHeadDecordError(`head文字列が不正です。: ${headString}`);

        let [_, type, hasId, rawNum, explicitRadix, isFull, flagsStr] = match;
        let bits = { time: 0, random: 0 };
        let radix = 64;
        let bitsPart = null;
        let radixPart = explicitRadix;

        if (rawNum) {
            // bits指定であることが確定する条件: 
            // 1. ハイフンが含まれる (TID48-80)
            // 2. 後ろに R指定または F指定がある (RID128R32)
            // 3. rawNumが128より大きい (radixの最大は64,256なので、それを超えればbits)
            const n = parseInt(rawNum, 10);
            if (rawNum.includes('-') || explicitRadix || isFull || n > 256) {
                bitsPart = rawNum;
            } else {
                radixPart = rawNum;
                bitsPart = null;
            }
        }

        if (type === 'T') {
            const val = bitsPart || "128";
            if (val.includes('-')) {
                const [t, r] = val.split('-').map(Number);
                bits.time = t; bits.random = r;
            } else {
                const total = parseInt(val, 10);
                bits.time = 48; bits.random = total - 48;
            }
            if (!Number.isInteger(bits.time) || !Number.isInteger(bits.random)) throw new IdHeadDecordError(`bitsは整数であるべきです。: time:${bits.time}, random:${bits.random}`);
            if (bits.time < 48 || bits.random < 8) throw new IdHeadDecordError(`timeBitsは48以上、randomBitsは8以上必要です。: time:${bits.time}, random:${bits.random}`);
            if (bits.time % 8 !== 0 || bits.random % 8 !== 0) throw new IdHeadDecordError(`bitsの各値は8の倍数であるべきです。: time:${bits.time}, random:${bits.random}`);
        } else {
            if (bitsPart && bitsPart.includes('-')) throw new IdHeadDecordError(`R/Iタイプではハイフン形式のbits指定はできません。: ${bitsPart}`);
            bits.time = 0;
            bits.random = bitsPart ? parseInt(bitsPart, 10) : 128;
            if (!Number.isInteger(bits.random)) throw new IdHeadDecordError(`bitsは整数であるべきです。: random:${bits.random}`);
            if (bits.random < 8) throw new IdHeadDecordError(`randomBitsが8より小さいです。: ${bits.random}`);
            if (bits.random % 8 !== 0) throw new IdHeadDecordError(`bitsの合計は8の倍数であるべきです。: random:${bits.random}`);
        }

        if (isFull) {
            radix = 1048576;
        } else if (radixPart) {
            radix = parseInt(radixPart, 10);
            if (!((radix >= 2 && radix <= 64) || radix === 256)) throw new IdHeadDecordError(`radixが不正値です(2〜64, 256, F): ${radixPart}`);
        }

        const flagSet = new Set(flagsStr);
        if (flagSet.size !== flagsStr.length) throw new IdHeadDecordError(`flagに重複があります: ${flagsStr}`);

        return { type, bits, radix, flags: { S: flagSet.has('S'), U: flagSet.has('U'), V: flagSet.has('V'), P: flagSet.has('P') } };
    }

    /**
     * 解析オブジェクトからメタデータ文字列を生成する
     */
    static encode(obj) {
        if (!obj || typeof obj !== 'object') throw new IdHeadEncordError(`引数objが不正です。typeofが'object'の値のみ有効です。: ${typeof obj}`);
        const { type, bits, radix, flags } = obj;
        if (!['R', 'T', 'I'].includes(type)) throw new IdHeadEncordError(`typeが不正です。'R','T','I'のいずれかのみ有効です。: ${type}`);
        
        const commonMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。";
        if (!bits || typeof bits !== 'object') throw new IdHeadEncordError(`${commonMsg} bits: typeof ${typeof bits}, ${bits}`);
        const missing = [];
        if (!('time' in bits)) missing.push("'time'");
        if (!('random' in bits)) missing.push("'random'");
        if (missing.length > 0) throw new IdHeadEncordError(`${commonMsg} プロパティ不足: ${missing.join(', ')}`);

        const typeErrors = [];
        if (typeof bits.time !== 'number') typeErrors.push(`'time' ${typeof bits.time} ${bits.time}`);
        if (typeof bits.random !== 'number') typeErrors.push(`'random' ${typeof bits.random} ${bits.random}`);
        if (typeErrors.length > 0) throw new IdHeadEncordError(`${commonMsg} 次のプロパティがtypeof numberではありません: ${typeErrors.join(', ')}`);

        if (type === 'T') {
            if (bits.time < 48 || bits.random < 8 || bits.time % 8 !== 0 || bits.random % 8 !== 0) {
                throw new IdHeadEncordError(`bitsの制約（time:48以上, random:8以上, 且つ8の倍数）を満たしていません。: bits.time:${bits.time}, bits.random:${bits.random}`);
            }
        } else {
            if (bits.random < 8 || bits.random % 8 !== 0) {
                throw new IdHeadEncordError(`bitsの制約（8以上且つ8の倍数）を満たしていません。: bits.random:${bits.random}`);
            }
        }
        if (!((radix >= 2 && radix <= 64) || radix === 256 || radix === 1048576)) throw new IdHeadEncordError(`radixが範囲外です: ${radix}`);
        
        let res = type + "ID";
        const isDefaultBits = (type === 'T') ? (bits.time === 48 && bits.random === 80) : (bits.time === 0 && bits.random === 128);
        const isDefaultRadix = (radix === 64);

        if (!isDefaultBits) {
            res += (type === 'T') ? `${bits.time}-${bits.random}` : bits.random;
        }

        if (radix === 1048576) { res += "F"; } 
        else if (!isDefaultRadix) {
            res += isDefaultBits ? radix : "R" + radix;
        }

        ['S', 'U', 'V', 'P'].forEach(f => { if (flags && flags[f] === true) res += f; });
        return res;
    }

    constructor(str) { this._ = IdHead.decode(str); }
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

