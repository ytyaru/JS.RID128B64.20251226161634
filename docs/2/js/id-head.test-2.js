import { expect, test, describe } from "bun:test";
import { IdHead, IdHeadDecordError } from "./id-head.js";

// フラグの全16組合せを生成
const getAllFlagCombinations = () => {
    const chars = ["S", "U", "V", "P"];
    const results = [""];
    for (const char of chars) {
        const len = results.length;
        for (let i = 0; i < len; i++) {
            results.push(results[i] + char);
        }
    }
    return results;
};

describe("IdHead 正常系全パターン網羅テスト", () => {
    const types = ["R", "T", "I"];
    const radices = [2, 7, 32, 64, 256, 1048576];
    const allFlags = getAllFlagCombinations();

    for (const type of types) {
        for (const radix of radices) {
            for (const flags of allFlags) {
                const testName = `Type:${type}, Radix:${radix}, Flags:${flags || "(none)"}`;
                test(testName, () => {
                    // 入力用オブジェクトの組み立て
                    const inputObj = {
                        type,
                        bits: type === 'T' ? { time: 48, random: 80 } : { time: 0, random: 128 },
                        radix,
                        flags: {
                            S: flags.includes("S"),
                            U: flags.includes("U"),
                            V: flags.includes("V"),
                            P: flags.includes("P")
                        }
                    };

                    // Encodeして得られた文字列がDecode可能か
                    const headStr = IdHead.encode(inputObj);
                    const decoded = IdHead.decode(headStr);

                    // 検証
                    expect(decoded.type).toBe(inputObj.type);
                    expect(decoded.bits).toEqual(inputObj.bits);
                    expect(decoded.radix).toBe(inputObj.radix);
                    expect(decoded.flags).toEqual(inputObj.flags);

                    // 再Encodeして同じ文字列になるか（一貫性）
                    expect(IdHead.encode(decoded)).toBe(headStr);
                });
            }
        }
    }
});

describe("IdHead Bits指定と8の倍数制約のテスト", () => {
    test("TIDのカスタムBits指定 (Valid)", () => {
        const head = IdHead.decode("TID64-128");
        expect(head.bits.time).toBe(64);
        expect(head.bits.random).toBe(128);
    });

    test("RIDのカスタムBits指定 (Valid)", () => {
        const head = IdHead.decode("RID256R64");
        expect(head.bits.random).toBe(256);
        expect(head.radix).toBe(64);
    });

    test("RID7 は radix=7, bits=128 (Valid)", () => {
        const head = IdHead.decode("RID7");
        expect(head.bits.random).toBe(128);
        expect(head.radix).toBe(7);
    });
});

describe("IdHead 異常系（例外発生）テスト", () => {
    const invalidCases = [
        { s: "XID128", m: "Type不正" },
        { s: "RID7R64", m: "randomBits < 8" },
        { s: "RID9R64", m: "bitsの合計は8の倍数であるべきです。(RID9)" },
        { s: "TID53-75", m: "bitsの合計は8の倍数であるべきです。(TID53-75)" },
        { s: "TID48-10", m: "bitsの合計は8の倍数であるべきです。(TID48-10)" },
        { s: "TID50-80", m: "bitsの合計は8の倍数であるべきです。(TID50-80)" },
        { s: "TID32-80", m: "timeBits < 48" },
        { s: "RIDR1", m: "Radix範囲外(低)" },
        { s: "RIDR300", m: "Radix範囲外(高)" },
        { s: "RIDSS", m: "Flag重複" },
        { s: "RIDUUKC", m: "不正文字" },
        { s: "RID48-64", m: "Rタイプでハイフン使用" }
    ];

    invalidCases.forEach(({ s, m }) => {
        test(`Exception: ${m} (${s})`, () => {
            expect(() => IdHead.decode(s)).toThrow(IdHeadDecordError);
            // 8の倍数エラーの場合はメッセージを検証
            if (m.includes("8の倍数")) {
                try {
                    IdHead.decode(s);
                } catch (e) {
                    expect(e.message).toBe("bitsの合計は8の倍数であるべきです。");
                }
            }
        });
    });
});

describe("IdHead クラスインスタンスとgetterのテスト", () => {
    test("getterマッピング検証", () => {
        const head = new IdHead("TID64-64R32SUVP");
        expect(head.type).toBe("T");
        expect(head.timeBits).toBe(64);
        expect(head.randomBits).toBe(64);
        expect(head.radix).toBe(32);
        expect(head.sortable).toBe(true);
        expect(head.urlUnsafed).toBe(true);
        expect(head.visibled).toBe(true);
        expect(head.padded).toBe(true);
    });

    test("デフォルト値の検証 (RID)", () => {
        const head = new IdHead("RID");
        expect(head.randomBits).toBe(128);
        expect(head.radix).toBe(64);
        expect(head.sortable).toBe(false);
    });
});

