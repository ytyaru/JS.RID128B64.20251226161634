import { describe, expect, test } from 'bun:test';
import { BaseN, Base64, Base64URL, Base256, Base1048576 } from './base64.js';
describe('Math Functions', () => {
  test('adds numbers correctly', () => {
    const sum = 1 + 2;
    expect(sum).toBe(3); // expect(actual).toBe(expected) の形式
  });

  test('subtracts numbers', () => {
    expect(5 - 2).toBe(3);
  });
});

// 関数をインポートする場合
// import { add } from './math';
// test('add function works', () => {
//   expect(add(2, 3)).toBe(5);
// });

