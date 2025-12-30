import { expect, test, describe } from "bun:test";
import { IdHead, IdHeadDecordError } from "./id-head.js";

describe("IdHead.decode 正常系全パターン網羅", () => {
    const types = ["R", "T", "I"];
    const radices = [2, 32, 64, 256, 1048576];
    const flagChars = ["S", "U", "V", "P"];

    // フラグの全16組合せを生成
    const getAllFlagCombinations = () => {
        const results = [""];
        for (const char of flagChars) {
            const count = results.length;
            for (let i = 0; i < count; i++) {
                results.push(results[i] + char);
            }
        }
        return results;
    };

    const allFlags = getAllFlagCombinations();

    for (const type of types) {
        for (const radix of radices) {
            for (const flags of allFlags) {
                // 基本的なテストケースの生成
                test(`${type} type, Radix:${radix}, Flags:${flags}`, () => {
                    let headStr = type + "ID";
                    
                    // Radix表記の決定
                    if (radix === 1048576) {
                        headStr += "F";
                    } else if (radix !== 64) {
                        headStr += radix; // RID32 形式
                    }
                    headStr += flags;

                    const decoded = IdHead.decode(headStr);
                    expect(decoded.type).toBe(type);
                    expect(decoded.radix).toBe(radix);
                    
                    // Flagsの検証
                    for (const char of flagChars) {
                        expect(decoded.flags[char]).toBe(flags.includes(char));
                    }

                    // Encodeして元に戻るか(Round-trip)
                    const encoded = IdHead.encode(decoded);
                    // 省略ルールの都合上、完全一致しないケースがあるため、
                    // 再度decodeした内容が一致するかで検証
                    const reDecoded = IdHead.decode(encoded);
                    expect(reDecoded).toEqual(decoded);
                });
            }
        }
    }
});

describe("IdHead.decode 特殊なBits指定のテスト", () => {
    test("TIDのtime-random分離形式", () => {
        const head = IdHead.decode("TID64-128");
        expect(head.bits.time).toBe(64);
        expect(head.bits.random).toBe(128);
    });

    test("RIDのカスタムBits", () => {
        const head = IdHead.decode("RID256");
        // RID256 は radix=256 と解釈される仕様のため、
        // 明示的に bits 指定するには RID256R64 等が必要
        const head2 = IdHead.decode("RID256R64");
        expect(head2.bits.random).toBe(256);
        expect(head2.radix).toBe(64);
    });
});

describe("IdHead 異常系（例外発生）テスト", () => {
    const invalidCases = [
        { s: "XID128", m: "Type不正" },
//        { s: "RID7", m: "randomBits < 8" },
        { s: "RID7R64", m: "randomBits < 8" }, 
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
        });
    });
});

describe("IdHead クラスインスタンスとgetterのテスト", () => {
    test("プロパティアクセス", () => {
        const head = new IdHead("RID128R32S");
        expect(head.type).toBe("R");
        expect(head.randomBits).toBe(128);
        expect(head.radix).toBe(32);
        // 仕様確認: インスタンスのgetter名は sortable, visibled等
        // decode()が返すオブジェクトは S, V 等なのでマッピングの確認
        // ※現在のコードだと getter 内で this._.S を参照しているが、
        // decode結果は { flags: { S: bool } } なので修正が必要
    });
});

