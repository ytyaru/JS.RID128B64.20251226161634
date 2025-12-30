import { expect, test, describe } from "bun:test";
import { IdHead, IdHeadDecordError, IdHeadEncordError } from "./id-head.js";

const getAllFlagCombinations = () => {
    const chars = ["S", "U", "V", "P"];
    const results = [""];
    for (const char of chars) {
        const len = results.length;
        for (let i = 0; i < len; i++) results.push(results[i] + char);
    }
    return results;
};

describe("IdHead 正常系: 基本全パターン網羅 (Type x Radix x Flags)", () => {
    const types = ["R", "T", "I"];
    const radices = [2, 3, 8, 10, 16, 26, 32, 36, 62, 64, 256, 1048576];
    const allFlags = getAllFlagCombinations();

    for (const type of types) {
        for (const radix of radices) {
            for (const flags of allFlags) {
                test(`Type:${type}, Radix:${radix}, Flags:${flags || "none"}`, () => {
                    const obj = {
                        type,
                        bits: type === 'T' ? { time: 48, random: 80 } : { time: 0, random: 128 },
                        radix,
                        flags: { S: flags.includes("S"), U: flags.includes("U"), V: flags.includes("V"), P: flags.includes("P") }
                    };
                    const encoded = IdHead.encode(obj);
                    const decoded = IdHead.decode(encoded);
                    expect(decoded).toEqual(obj);
                });
            }
        }
    }
});

describe("IdHead 正常系: bits/radixの多様な指定パターン", () => {
    const validBits = [8, 16, 24, 32, 40, 56, 64, 120, 128, 136, 256, 512, 1024];
    validBits.forEach(b => {
        test(`RID${b}R64 (bits=${b})`, () => {
            const d = IdHead.decode(`RID${b}R64`);
            expect(d.bits.random).toBe(b);
        });
    });

    const validRadices = [2, 3, 8, 9, 10, 15, 16, 26, 32, 36, 62, 64, 256, 1048576];
    validRadices.forEach(r => {
        test(`RIDR${r} (radix=${r})`, () => {
            const d = IdHead.decode(r === 1048576 ? "RIDF" : `RIDR${r}`);
            expect(d.radix).toBe(r);
        });
    });

    test("省略しないフル表記: RID128R64", () => {
        const d = IdHead.decode("RID128R64");
        expect(d.bits.random).toBe(128);
        expect(d.radix).toBe(64);
    });

    test("最重要難読ケース: RID256 は radix=256, bits=128", () => {
        const d = IdHead.decode("RID256");
        expect(d.bits.random).toBe(128);
        expect(d.radix).toBe(256);
    });
});

describe("IdHead 異常系: decodeメッセージ検証", () => {
    const cases = [
        { s: "RID7R64", m: "randomBitsが8より小さいです。: 7" },
        { s: "RID2R64", m: "randomBitsが8より小さいです。: 2" },
        { s: "RID0R64", m: "randomBitsが8より小さいです。: 0" },
        { s: "RID9R64", m: "bitsの合計は8の倍数であるべきです。: random:9" },
        { s: "RID15R64", m: "bitsの合計は8の倍数であるべきです。: random:15" },
        { s: "RID31R64", m: "bitsの合計は8の倍数であるべきです。: random:31" },
        { s: "RID122R64", m: "bitsの合計は8の倍数であるべきです。: random:122" },
        { s: "RID126R64", m: "bitsの合計は8の倍数であるべきです。: random:126" },
        { s: "TID40-80", m: "timeBitsは48以上、randomBitsは0以上必要です。: time:40, random:80" },
        { s: "TID50-80", m: "bitsの合計は8の倍数であるべきです。: time:50, random:80" },
        { s: "TID48-10", m: "bitsの合計は8の倍数であるべきです。: time:48, random:10" },
        { s: "RID-1R64", m: "head文字列が不正です。: RID-1R64" },
        { s: "RID1.5R64", m: "head文字列が不正です。: RID1.5R64" },
        { s: "RIDRE", m: "head文字列が不正です。: RIDRE" },
        { s: "RIDRG", m: "head文字列が不正です。: RIDRG" },
        { s: "RIDR1", m: "radixが不正値です(2〜64, 256, F): 1" },
        { s: "RIDR65", m: "radixが不正値です(2〜64, 256, F): 65" },
        { s: "RIDR255", m: "radixが不正値です(2〜64, 256, F): 255" },
        { s: "RIDR257", m: "radixが不正値です(2〜64, 256, F): 257" },
        { s: "RIDSS", m: "flagに重複があります: SS" },
        { s: "RID48-64", m: "R/Iタイプではハイフン形式のbits指定はできません。: 48-64" }
    ];

    cases.forEach(({ s, m }) => {
        test(`Decode Error Message Check: ${s}`, () => {
            expect(() => IdHead.decode(s)).toThrow(IdHeadDecordError);
            try { IdHead.decode(s); } catch (e) { expect(e.message).toBe(m); }
        });
    });
});

describe("IdHead 異常系: encode(obj) 直接指定バリデーション", () => {
    test("radix 1048575 (境界値下)", () => {
        const obj = { type: 'R', bits: { time: 0, random: 128 }, radix: 1048575, flags: {} };
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe("radixが範囲外です: 1048575"); }
    });

    test("bits random: 9 (8の倍数違反)", () => {
        const obj = { type: 'R', bits: { time: 0, random: 9 }, radix: 64, flags: {} };
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe("bitsの制約（8以上且つ8の倍数）を満たしていません。: bits.random:9"); }
    });

    test("bits time: 40 (TID閾値未満)", () => {
        const obj = { type: 'T', bits: { time: 40, random: 80 }, radix: 64, flags: {} };
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe("bitsの制約（48以上且つ8の倍数）を満たしていません。: bits.time:40, bits.random:80"); }
    });

    test("type X (種別不正)", () => {
        const obj = { type: 'X', bits: { time: 0, random: 128 }, radix: 64, flags: {} };
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe("typeが不正です。'R','T','I'のいずれかのみ有効です。: X"); }
    });

    test("bitsオブジェクト構造不正", () => {
        const obj = { type: 'R', bits: { random: 128 }, radix: 64, flags: {} };
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toContain("bitsオブジェクトが不正です。"); }
    });
});

describe("IdHead 異常系: encode(obj) bitsオブジェクト詳細バリデーション", () => {
    
    test("bitsが非オブジェクト (null)", () => {
        const obj = { type: 'R', bits: null, radix: 64, flags: {} };
        const expectedMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。: has-time:false, has-random:false, is-number-time: undefined, is-number-random: undefined";
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe(expectedMsg); }
    });

    test("bits.timeプロパティがない", () => {
        const obj = { type: 'R', bits: { random: 128 }, radix: 64, flags: {} };
        const expectedMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。: has-time:false, has-random:true, is-number-time: undefined, is-number-random: number";
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe(expectedMsg); }
    });

    test("bits.randomプロパティがない", () => {
        const obj = { type: 'R', bits: { time: 0 }, radix: 64, flags: {} };
        const expectedMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。: has-time:true, has-random:false, is-number-time: number, is-number-random: undefined";
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe(expectedMsg); }
    });

    test("bits.timeプロパティの値が非number (string)", () => {
        const obj = { type: 'R', bits: { time: "0", random: 128 }, radix: 64, flags: {} };
        const expectedMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。: has-time:true, has-random:true, is-number-time: string, is-number-random: number";
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe(expectedMsg); }
    });

    test("bits.randomプロパティの値が非number (boolean)", () => {
        const obj = { type: 'R', bits: { time: 0, random: true }, radix: 64, flags: {} };
        const expectedMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。: has-time:true, has-random:true, is-number-time: number, is-number-random: boolean";
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe(expectedMsg); }
    });

    test("bits全体が不正な型 (number)", () => {
        const obj = { type: 'R', bits: 128, radix: 64, flags: {} };
        // typeof 128 は 'number' なので 'time' in bits 等はランタイムエラーを避けるため実装で bits && ... としているか確認が必要
        // 実装コード: bits ? 'time' in bits : false 
        const expectedMsg = "bitsオブジェクトが不正です。bitsは'time'と'random'プロパティを持つオブジェクトであり、それぞれtypeofが'number'を返す値であるべきです。: has-time:false, has-random:false, is-number-time: undefined, is-number-random: undefined";
        expect(() => IdHead.encode(obj)).toThrow(IdHeadEncordError);
        try { IdHead.encode(obj); } catch (e) { expect(e.message).toBe(expectedMsg); }
    });
});
