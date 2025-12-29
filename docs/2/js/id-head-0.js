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
    get sortable() {return this._.S}
    get urlUnsafed() {return this._.U}
    get visibled() {return this._.V}
    get padded() {return this._.P}
}
export {IdError,IdDecordError,IdEncordError,IdHeadDecordError,IdHeadEncordError,IdBodyDecordError,IdBodyEncordError,IdHead};
